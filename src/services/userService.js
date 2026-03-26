const { db } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

/**
 * User Service
 * Handles user preferences, favorites, and related operations
 */

class UserService {
  /**
   * Get user preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences(userId) {
    const preferences = await db.oneOrNone(
      `SELECT id, user_id, search_radius_km, notification_enabled, newsletters_enabled, created_at, updated_at
       FROM user_preferences WHERE user_id = $1`,
      [userId]
    );

    if (!preferences) {
      throw new Error('User preferences not found');
    }

    // Get preferred categories
    const categories = await db.any(
      `SELECT c.id, c.name FROM categories c
       JOIN user_category_preferences ucp ON c.id = ucp.category_id
       WHERE ucp.user_id = $1`,
      [userId]
    );

    preferences.preferredCategories = categories;
    return preferences;
  }

  /**
   * Update user preferences
   * @param {string} userId - User ID
   * @param {Object} updates - Preferences to update
   * @returns {Promise<Object>} Updated preferences
   */
  async updateUserPreferences(userId, updates) {
    // Map camelCase request fields to snake_case DB columns
    const fieldMap = {
      searchRadiusKm: 'search_radius_km',
      notificationEnabled: 'notification_enabled',
      newslettersEnabled: 'newsletters_enabled',
      // also accept snake_case directly
      search_radius_km: 'search_radius_km',
      notification_enabled: 'notification_enabled',
      newsletters_enabled: 'newsletters_enabled',
    };
    const updateFields = [];
    const params = [userId];

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMap[key];
      if (dbField) {
        updateFields.push(`${dbField} = $${params.length + 1}`);
        params.push(value);
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const updated = await db.one(
      `UPDATE user_preferences SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING id, user_id, search_radius_km, notification_enabled, newsletters_enabled`,
      params
    );

    return updated;
  }

  /**
   * Add event to user favorites
   * @param {string} userId - User ID
   * @param {string} eventId - Event ID
   * @returns {Promise<boolean>} Success
   */
  async addToFavorites(userId, eventId) {
    // Check if event exists
    const event = await db.oneOrNone(
      'SELECT id FROM events WHERE id = $1 AND is_active = TRUE',
      [eventId]
    );

    if (!event) {
      throw new Error('Event not found');
    }

    try {
      await db.none(
        'INSERT INTO favorite_events (user_id, event_id) VALUES ($1, $2)',
        [userId, eventId]
      );
      return true;
    } catch (error) {
      if (error.message.includes('duplicate')) {
        throw new Error('Event already in favorites');
      }
      throw error;
    }
  }

  /**
   * Remove event from favorites
   * @param {string} userId - User ID
   * @param {string} eventId - Event ID
   * @returns {Promise<boolean>} Success
   */
  async removeFromFavorites(userId, eventId) {
    const result = await db.result(
      'DELETE FROM favorite_events WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    if (result.rowCount === 0) {
      throw new Error('Favorite event not found');
    }

    return true;
  }

  /**
   * Get user's favorite events
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Favorite events
   */
  async getFavoriteEvents(userId) {
    const events = await db.any(
      `SELECT e.id, e.title, e.description, e.address, e.city, e.country, e.start_date, e.end_date,
              MAX(attendees.current_attendees) AS current_attendees, e.max_attendees, fe.created_at AS favorited_at
       FROM favorite_events fe
       JOIN events e ON fe.event_id = e.id
       LEFT JOIN event_attendees attendees ON e.id = attendees.event_id
       WHERE fe.user_id = $1 AND e.is_active = TRUE
       GROUP BY e.id, fe.created_at
       ORDER BY fe.created_at DESC`,
      [userId]
    );

    return events;
  }

  /**
   * Set user's preferred categories
   * @param {string} userId - User ID
   * @param {Array} categoryIds - Category IDs
   * @returns {Promise<Array>} Updated categories
   */
  async setPreferredCategories(userId, categoryIds) {
    // Remove existing preferences
    await db.none(
      'DELETE FROM user_category_preferences WHERE user_id = $1',
      [userId]
    );

    // Add new preferences
    for (const categoryId of categoryIds) {
      await db.none(
        'INSERT INTO user_category_preferences (user_id, category_id) VALUES ($1, $2)',
        [userId, categoryId]
      );
    }

    // Return updated preferences
    const categories = await db.any(
      `SELECT c.id, c.name FROM categories c
       WHERE c.id = ANY($1::uuid[])`,
      [categoryIds]
    );

    return categories;
  }

  /**
   * Check if event is in user's favorites
   * @param {string} userId - User ID
   * @param {string} eventId - Event ID
   * @returns {Promise<boolean>} Is favorite
   */
  async isFavorite(userId, eventId) {
    const result = await db.oneOrNone(
      'SELECT id FROM favorite_events WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    return !!result;
  }

  /**
   * Get user event attendance
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Attending events
   */
  async getUserAttendingEvents(userId) {
    const events = await db.any(
      `SELECT e.id, e.title, e.description, e.address, e.city, e.country, e.start_date, e.end_date,
              e.max_attendees, e.current_attendees, ea.status, ea.joined_at
       FROM event_attendees ea
       JOIN events e ON ea.event_id = e.id
       WHERE ea.user_id = $1 AND e.is_active = TRUE
       ORDER BY e.start_date DESC`,
      [userId]
    );

    return events;
  }

  /**
   * Register user for event
   * @param {string} userId - User ID
   * @param {string} eventId - Event ID
   * @returns {Promise<boolean>} Success
   */
  async registerForEvent(userId, eventId) {
    // Check event capacity
    const event = await db.oneOrNone(
      `SELECT id, max_attendees, current_attendees FROM events 
       WHERE id = $1 AND is_active = TRUE`,
      [eventId]
    );

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.max_attendees && event.current_attendees >= event.max_attendees) {
      throw new Error('Event is at full capacity');
    }

    try {
      await db.none(
        'INSERT INTO event_attendees (event_id, user_id) VALUES ($1, $2)',
        [eventId, userId]
      );

      // Update current attendees count
      await db.none(
        'UPDATE events SET current_attendees = current_attendees + 1 WHERE id = $1',
        [eventId]
      );

      return true;
    } catch (error) {
      if (error.message.includes('duplicate')) {
        throw new Error('Already registered for this event');
      }
      throw error;
    }
  }

  /**
   * Unregister user from event
   * @param {string} userId - User ID
   * @param {string} eventId - Event ID
   * @returns {Promise<boolean>} Success
   */
  async unregisterFromEvent(userId, eventId) {
    const result = await db.result(
      'DELETE FROM event_attendees WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    if (result.rowCount === 0) {
      throw new Error('Registration not found');
    }

    // Update current attendees count
    await db.none(
      'UPDATE events SET current_attendees = GREATEST(current_attendees - 1, 0) WHERE id = $1',
      [eventId]
    );

    return true;
  }
}

module.exports = new UserService();
