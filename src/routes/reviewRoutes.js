const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const reviewService = require('../services/reviewService');
const { authenticateToken } = require('../middleware/authMiddleware');
const logger = require('../config/logger');

const router = express.Router();

/**
 * GET /api/reviews/top-rated  <-- must be before /:eventId
 * Get top-rated events
 */
router.get('/top-rated', [
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const events = await reviewService.getTopRatedEvents(limit);
    res.json({ success: true, data: { count: events.length, events } });
  } catch (error) {
    logger.error('Get top rated error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/reviews/:eventId
 * Create or update a review
 */
router.post('/:eventId', authenticateToken, [
  param('eventId').isUUID(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('reviewText').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { rating, reviewText } = req.body;
    const { eventId } = req.params;

    const review = await reviewService.createOrUpdateReview(req.userId, eventId, rating, reviewText);
    logger.info(`Review submitted for event: ${eventId}`);

    res.status(201).json({ success: true, message: 'Review submitted successfully', data: review });
  } catch (error) {
    logger.error('Create review error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/reviews/:eventId/stats
 * Get event review statistics
 */
router.get('/:eventId/stats', [
  param('eventId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const stats = await reviewService.getEventStatistics(req.params.eventId);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get stats error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/reviews/:eventId/user
 * Get user's review for an event
 */
router.get('/:eventId/user', authenticateToken, [
  param('eventId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const review = await reviewService.getUserReview(req.userId, req.params.eventId);
    res.json({ success: true, data: review });
  } catch (error) {
    logger.error('Get user review error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/reviews/:eventId
 * Get reviews for an event
 */
router.get('/:eventId', [
  param('eventId').isUUID(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const limit = req.query.limit || 10;
    const offset = req.query.offset || 0;
    const reviews = await reviewService.getEventReviews(req.params.eventId, limit, offset);

    res.json({ success: true, data: { count: reviews.length, reviews } });
  } catch (error) {
    logger.error('Get reviews error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/reviews/:reviewId
 * Delete a review
 */
router.delete('/:reviewId', authenticateToken, [
  param('reviewId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    await reviewService.deleteReview(req.params.reviewId, req.userId);
    logger.info(`Review deleted: ${req.params.reviewId}`);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    logger.error('Delete review error:', error.message);
    const status = error.message.includes('Unauthorized') ? 403 : 404;
    res.status(status).json({ success: false, message: error.message });
  }
});

module.exports = router;
