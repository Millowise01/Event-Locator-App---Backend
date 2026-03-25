const { db } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

/**
 * Review Service
 * Handles event reviews and ratings
 */

class ReviewService {
  /**
   * Create or update a review
   * @param {string} userId - User ID
   * @param {string} eventId - Event ID
   * @param {number} rating - Rating (1-5)
   * @param {string} reviewText - Review text
   * @returns {Promise<Object>} Created/Updated review
   */
  async createOrUpdateReview(userId, eventId, rating, reviewText) {
    // Validate rating
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new Error('Rating must be an integer between 1 and 5');
    }

    // Check if event exists
    const event = await db.oneOrNone(
      'SELECT id FROM events WHERE id = $1 AND is_active = TRUE',
      [eventId]
    );

    if (!event) {
      throw new Error('Event not found');
    }

    // Check if user attended the event
    const attendance = await db.oneOrNone(
      'SELECT id FROM event_attendees WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    if (!attendance) {
      throw new Error('You must be registered for this event to leave a review');
    }

    // Try to update existing review
    const existingReview = await db.oneOrNone(
      'SELECT id FROM event_reviews WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    if (existingReview) {
      const updated = await db.one(
        `UPDATE event_reviews 
         SET rating = $1, review_text = $2, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $3 AND event_id = $4
         RETURNING id, user_id, event_id, rating, review_text, created_at, updated_at`,
        [rating, reviewText, userId, eventId]
      );
      return updated;
    }

    // Create new review
    const review = await db.one(
      `INSERT INTO event_reviews (id, user_id, event_id, rating, review_text)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, event_id, rating, review_text, created_at, updated_at`,
      [uuidv4(), userId, eventId, rating, reviewText]
    );

    return review;
  }

  /**
   * Get reviews for an event
   * @param {string} eventId - Event ID
   * @param {number} limit - Limit results
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Reviews
   */
  async getEventReviews(eventId, limit = 10, offset = 0) {
    const reviews = await db.any(
      `SELECT er.id, er.user_id, er.rating, er.review_text, er.created_at,
              u.first_name, u.last_name
       FROM event_reviews er
       JOIN users u ON er.user_id = u.id
       WHERE er.event_id = $1
       ORDER BY er.created_at DESC
       LIMIT $2 OFFSET $3`,
      [eventId, limit, offset]
    );

    return reviews;
  }

  /**
   * Get event statistics
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} Event statistics
   */
  async getEventStatistics(eventId) {
    const stats = await db.one(
      `SELECT 
        COUNT(*) AS total_reviews,
        AVG(rating) AS average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) AS five_star_count,
        COUNT(CASE WHEN rating = 4 THEN 1 END) AS four_star_count,
        COUNT(CASE WHEN rating = 3 THEN 1 END) AS three_star_count,
        COUNT(CASE WHEN rating = 2 THEN 1 END) AS two_star_count,
        COUNT(CASE WHEN rating = 1 THEN 1 END) AS one_star_count
       FROM event_reviews
       WHERE event_id = $1`,
      [eventId]
    );

    return {
      totalReviews: parseInt(stats.total_reviews),
      averageRating: parseFloat(stats.average_rating || 0).toFixed(2),
      distribution: {
        fiveStar: parseInt(stats.five_star_count),
        fourStar: parseInt(stats.four_star_count),
        threeStar: parseInt(stats.three_star_count),
        twoStar: parseInt(stats.two_star_count),
        oneStar: parseInt(stats.one_star_count)
      }
    };
  }

  /**
   * Get user's review for an event
   * @param {string} userId - User ID
   * @param {string} eventId - Event ID
   * @returns {Promise<Object|null>} User's review or null
   */
  async getUserReview(userId, eventId) {
    const review = await db.oneOrNone(
      `SELECT id, user_id, event_id, rating, review_text, created_at, updated_at
       FROM event_reviews
       WHERE user_id = $1 AND event_id = $2`,
      [userId, eventId]
    );

    return review || null;
  }

  /**
   * Delete a review
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} Success
   */
  async deleteReview(reviewId, userId) {
    const review = await db.oneOrNone(
      'SELECT user_id FROM event_reviews WHERE id = $1',
      [reviewId]
    );

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.user_id !== userId) {
      throw new Error('Unauthorized: Only review author can delete');
    }

    await db.none(
      'DELETE FROM event_reviews WHERE id = $1',
      [reviewId]
    );

    return true;
  }

  /**
   * Get top-rated events
   * @param {number} limit - Number of events to return
   * @returns {Promise<Array>} Top-rated events
   */
  async getTopRatedEvents(limit = 10) {
    const events = await db.any(
      `SELECT e.id, e.title, e.description, e.address, e.city, e.country,
              AVG(er.rating) AS average_rating,
              COUNT(er.id) AS review_count
       FROM events e
       LEFT JOIN event_reviews er ON e.id = er.event_id
       WHERE e.is_active = TRUE
       GROUP BY e.id
       HAVING COUNT(er.id) > 0
       ORDER BY AVG(er.rating) DESC
       LIMIT $1`,
      [limit]
    );

    return events;
  }
}

module.exports = new ReviewService();
