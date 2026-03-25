const reviewService = require('../services/reviewService');
const logger = require('../config/logger');

async function createOrUpdateReview(req, res) {
  try {
    const { rating, reviewText } = req.body;
    const review = await reviewService.createOrUpdateReview(
      req.userId, req.params.eventId, rating, reviewText
    );
    logger.info(`Review submitted for event: ${req.params.eventId}`);
    res.status(201).json({ success: true, message: req.t('review.created'), data: review });
  } catch (error) {
    logger.error('Create review error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getEventReviews(req, res) {
  try {
    const limit = req.query.limit || 10;
    const offset = req.query.offset || 0;
    const reviews = await reviewService.getEventReviews(req.params.eventId, limit, offset);
    res.json({ success: true, data: { count: reviews.length, reviews } });
  } catch (error) {
    logger.error('Get reviews error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getEventStats(req, res) {
  try {
    const stats = await reviewService.getEventStatistics(req.params.eventId);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get stats error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getUserReview(req, res) {
  try {
    const review = await reviewService.getUserReview(req.userId, req.params.eventId);
    res.json({ success: true, data: review });
  } catch (error) {
    logger.error('Get user review error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function deleteReview(req, res) {
  try {
    await reviewService.deleteReview(req.params.reviewId, req.userId);
    logger.info(`Review deleted: ${req.params.reviewId}`);
    res.json({ success: true, message: req.t('review.deleted') });
  } catch (error) {
    logger.error('Delete review error:', error.message);
    res.status(error.message.includes('Unauthorized') ? 403 : 404).json({
      success: false,
      message: error.message
    });
  }
}

async function getTopRated(req, res) {
  try {
    const limit = req.query.limit || 10;
    const events = await reviewService.getTopRatedEvents(limit);
    res.json({ success: true, data: { count: events.length, events } });
  } catch (error) {
    logger.error('Get top rated error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = {
  createOrUpdateReview,
  getEventReviews,
  getEventStats,
  getUserReview,
  deleteReview,
  getTopRated
};
