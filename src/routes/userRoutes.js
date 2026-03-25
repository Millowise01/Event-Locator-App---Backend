const express = require('express');
const { body, validationResult } = require('express-validator');
const userService = require('../services/userService');
const { authenticateToken } = require('../middleware/authMiddleware');
const logger = require('../config/logger');

const router = express.Router();

/**
 * GET /api/users/preferences
 * Get user preferences
 */
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const preferences = await userService.getUserPreferences(req.userId);

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Get preferences error:', error.message);
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/users/preferences
 * Update user preferences
 */
router.put('/preferences', authenticateToken, [
  body('searchRadiusKm').optional().isInt({ min: 1, max: 500 }),
  body('notificationEnabled').optional().isBoolean(),
  body('newslettersEnabled').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const preferences = await userService.updateUserPreferences(req.userId, req.body);

    logger.info(`Preferences updated: ${req.userId}`);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: preferences
    });
  } catch (error) {
    logger.error('Update preferences error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/users/favorites/:eventId
 * Add event to favorites
 */
router.post('/favorites/:eventId', authenticateToken, async (req, res) => {
  try {
    await userService.addToFavorites(req.userId, req.params.eventId);

    logger.info(`Event added to favorites: ${req.params.eventId} by ${req.userId}`);

    res.status(201).json({
      success: true,
      message: 'Event added to favorites'
    });
  } catch (error) {
    logger.error('Add favorite error:', error.message);
    const status = error.message.includes('already in favorites') ? 409 : 400;
    res.status(status).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/users/favorites/:eventId
 * Remove event from favorites
 */
router.delete('/favorites/:eventId', authenticateToken, async (req, res) => {
  try {
    await userService.removeFromFavorites(req.userId, req.params.eventId);

    logger.info(`Event removed from favorites: ${req.params.eventId} by ${req.userId}`);

    res.json({
      success: true,
      message: 'Event removed from favorites'
    });
  } catch (error) {
    logger.error('Remove favorite error:', error.message);
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/users/favorites
 * Get user's favorite events
 */
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const events = await userService.getFavoriteEvents(req.userId);

    res.json({
      success: true,
      data: {
        count: events.length,
        events
      }
    });
  } catch (error) {
    logger.error('Get favorites error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/users/favorites/:eventId/check
 * Check if event is in favorites
 */
router.get('/favorites/:eventId/check', authenticateToken, async (req, res) => {
  try {
    const isFavorite = await userService.isFavorite(req.userId, req.params.eventId);

    res.json({
      success: true,
      data: { isFavorite }
    });
  } catch (error) {
    logger.error('Check favorite error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/users/categories
 * Set preferred categories
 */
router.post('/categories', authenticateToken, [
  body('categoryIds').isArray({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const categories = await userService.setPreferredCategories(req.userId, req.body.categoryIds);

    logger.info(`Preferred categories updated: ${req.userId}`);

    res.json({
      success: true,
      message: 'Preferred categories updated',
      data: categories
    });
  } catch (error) {
    logger.error('Set categories error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/users/events/:eventId/register
 * Register for event
 */
router.post('/events/:eventId/register', authenticateToken, async (req, res) => {
  try {
    await userService.registerForEvent(req.userId, req.params.eventId);

    logger.info(`User registered for event: ${req.params.eventId}`);

    res.status(201).json({
      success: true,
      message: 'Successfully registered for the event'
    });
  } catch (error) {
    logger.error('Register event error:', error.message);
    const status = error.message.includes('capacity') || error.message.includes('already') ? 400 : 404;
    res.status(status).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/users/events/:eventId/unregister
 * Unregister from event
 */
router.delete('/events/:eventId/unregister', authenticateToken, async (req, res) => {
  try {
    await userService.unregisterFromEvent(req.userId, req.params.eventId);

    logger.info(`User unregistered from event: ${req.params.eventId}`);

    res.json({
      success: true,
      message: 'Successfully unregistered from the event'
    });
  } catch (error) {
    logger.error('Unregister event error:', error.message);
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/users/events/attending
 * Get events user is attending
 */
router.get('/events/attending', authenticateToken, async (req, res) => {
  try {
    const events = await userService.getUserAttendingEvents(req.userId);

    res.json({
      success: true,
      data: {
        count: events.length,
        events
      }
    });
  } catch (error) {
    logger.error('Get attending events error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
