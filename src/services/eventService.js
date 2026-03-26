const { db } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

/**
 * Event Service
 * Handles event CRUD operations and location-based search
 */

class EventService {
  /**
   * Create a new event
   * @param {string} creatorId - Creator user ID
   * @param {Object} eventData - Event information
   * @returns {Promise<Object>} Created event
   */
  async createEvent(creatorId, eventData) {
    const {
      title,
      description,
      latitude,
      longitude,
      address,
      city,
      country,
      startDate,
      endDate,
      maxAttendees,
      categoryIds
    } = eventData;

    // Validate dates
    if (new Date(endDate) <= new Date(startDate)) {
      throw new Error('End date must be after start date');
    }

    const eventId = uuidv4();

    // Create event
    const event = await db.one(
      `INSERT INTO events 
       (id, creator_id, title, description, location, address, city, country, start_date, end_date, max_attendees)
       VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7, $8, $9, $10, $11, $12)
       RETURNING id, creator_id, title, description, address, city, country, start_date, end_date, max_attendees, created_at`,
      [eventId, creatorId, title, description, longitude, latitude, address, city, country, startDate, endDate, maxAttendees]
    );

    // Add categories if provided
    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await db.none(
          'INSERT INTO event_categories (event_id, category_id) VALUES ($1, $2)',
          [eventId, categoryId]
        );
      }
    }

    // Register creator as attendee
    await db.none(
      'INSERT INTO event_attendees (event_id, user_id, status) VALUES ($1, $2, $3)',
      [eventId, creatorId, 'organizer']
    );

    return event;
  }

  /**
   * Get event by ID with full details
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} Event with details
   */
  async getEventById(eventId) {
    const event = await db.oneOrNone(
      `SELECT id, creator_id, title, description, address, city, country, 
              start_date, end_date, max_attendees, current_attendees, created_at, updated_at,
              ST_AsText(location) AS location_text,
              ST_X(location::geometry) AS longitude,
              ST_Y(location::geometry) AS latitude
       FROM events WHERE id = $1 AND is_active = TRUE`,
      [eventId]
    );

    if (!event) {
      throw new Error('Event not found');
    }

    // Get categories
    const categories = await db.any(
      `SELECT c.id, c.name, c.description
       FROM categories c
       JOIN event_categories ec ON c.id = ec.category_id
       WHERE ec.event_id = $1`,
      [eventId]
    );

    // Get average rating
    const ratingData = await db.oneOrNone(
      `SELECT AVG(rating) AS avg_rating, COUNT(*) AS review_count
       FROM event_reviews WHERE event_id = $1`,
      [eventId]
    );

    event.categories = categories;
    event.averageRating = parseFloat(ratingData?.avg_rating || 0).toFixed(2);
    event.reviewCount = ratingData?.review_count || 0;

    return event;
  }

  /**
   * Search events by location and radius
   * @param {number} latitude - User latitude
   * @param {number} longitude - User longitude
   * @param {number} radiusKm - Search radius in kilometers
   * @param {Object} filters - Additional filters (categories, dates)
   * @returns {Promise<Array>} Events within radius
   */
  async searchEventsByLocation(latitude, longitude, radiusKm = 50, filters = {}) {
    const userLocation = `POINT(${longitude} ${latitude})`;
    
    let query = `
      SELECT e.id, e.creator_id, e.title, e.description, e.address, e.city, e.country,
             e.start_date, e.end_date, e.max_attendees, e.current_attendees, e.created_at,
             ST_X(e.location::geometry) AS longitude,
             ST_Y(e.location::geometry) AS latitude,
             ST_Distance(e.location, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography) / 1000 AS distance_km
      FROM events e
      WHERE e.is_active = TRUE
      AND ST_DWithin(e.location, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography, ${radiusKm * 1000})
      AND e.start_date > NOW()
    `;

    const params = [];

    // Filter by categories if provided
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      query += `
        AND e.id IN (
          SELECT DISTINCT ec.event_id FROM event_categories ec
          WHERE ec.category_id = ANY($${params.length + 1}::uuid[])
        )
      `;
      params.push(filters.categoryIds);
    }

    // Filter by date range if provided
    if (filters.startDate) {
      query += ` AND e.start_date >= $${params.length + 1}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND e.end_date <= $${params.length + 1}`;
      params.push(filters.endDate);
    }

    query += ` ORDER BY distance_km ASC, e.start_date ASC`;

    const events = await db.any(query, params);
    return events;
  }

  /**
   * Search events with text search
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Matching events
   */
  async searchEvents(query, filters = {}) {
    let sql = `
      SELECT e.id, e.creator_id, e.title, e.description, e.address, e.city, e.country,
             e.start_date, e.end_date, e.max_attendees, e.current_attendees, e.created_at,
             ST_X(e.location::geometry) AS longitude,
             ST_Y(e.location::geometry) AS latitude
      FROM events e
      WHERE e.is_active = TRUE
      AND (LOWER(e.title) LIKE LOWER($1) OR LOWER(e.description) LIKE LOWER($1))
    `;

    const params = [`%${query}%`];

    if (filters.categoryIds && filters.categoryIds.length > 0) {
      sql += `
        AND e.id IN (
          SELECT DISTINCT ec.event_id FROM event_categories ec
          WHERE ec.category_id = ANY($${params.length + 1}::uuid[])
        )
      `;
      params.push(filters.categoryIds);
    }

    if (filters.startDate) {
      sql += ` AND e.start_date >= $${params.length + 1}`;
      params.push(filters.startDate);
    }

    sql += ` ORDER BY e.start_date ASC LIMIT 50`;

    return db.any(sql, params);
  }

  /**
   * Update event
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID (for authorization)
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated event
   */
  async updateEvent(eventId, userId, updates) {
    // Check authorization
    const event = await db.oneOrNone(
      'SELECT creator_id FROM events WHERE id = $1',
      [eventId]
    );

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.creator_id !== userId) {
      throw new Error('Unauthorized: Only event creator can update');
    }

    const allowedFields = ['title', 'description', 'address', 'city', 'country', 'start_date', 'end_date', 'max_attendees'];
    const updateFields = [];
    const params = [eventId];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${params.length + 1}`);
        params.push(value);
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const updatedEvent = await db.one(
      `UPDATE events SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, title, description, address, city, country, start_date, end_date, max_attendees, updated_at`,
      params
    );

    return updatedEvent;
  }

  /**
   * Delete event
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} Success
   */
  async deleteEvent(eventId, userId) {
    const event = await db.oneOrNone(
      'SELECT creator_id FROM events WHERE id = $1',
      [eventId]
    );

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.creator_id !== userId) {
      throw new Error('Unauthorized: Only event creator can delete');
    }

    await db.none(
      'UPDATE events SET is_active = FALSE WHERE id = $1',
      [eventId]
    );

    return true;
  }

  /**
   * Get events created by user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User's events
   */
  async getUserEvents(userId) {
    const events = await db.any(
      `SELECT id, title, description, address, city, country, start_date, end_date, 
              max_attendees, current_attendees, created_at
       FROM events 
       WHERE creator_id = $1 AND is_active = TRUE
       ORDER BY start_date DESC`,
      [userId]
    );

    return events;
  }
}

module.exports = new EventService();
