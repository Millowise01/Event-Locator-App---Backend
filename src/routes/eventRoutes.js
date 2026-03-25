const express = require('express');
const { body, query, validationResult } = require('express-validator');
const eventService = require('../services/eventService');
const { authenticateToken } = require('../middleware/authMiddleware');
const logger = require('../config/logger');

const router = express.Router();

/**
 * POST /api/events
 * Create a new event
 */
router.post('/', authenticateToken, [
  body('title').trim().notEmpty(),
  body('description').trim(),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('country').optional().trim(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('maxAttendees').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const event = await eventService.createEvent(req.userId, req.body);

    logger.info(`Event created: ${event.id} by user ${req.userId}`);

    res.status(201).json({
      success: true,
      message: req.i18n.t('event.created'),
      data: event
    });
  } catch (error) {
    logger.error('Create event error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/events/:id
 * Get event by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const event = await eventService.getEventById(req.params.id);

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    logger.error('Get event error:', error.message);
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/events/search/location
 * Search events by location
 */
router.post('/search/location', [
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('radiusKm').optional().isInt({ min: 1, max: 1000 }),
  body('categoryIds').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { latitude, longitude, radiusKm = 50, categoryIds, startDate, endDate } = req.body;

    const events = await eventService.searchEventsByLocation(
      latitude,
      longitude,
      radiusKm,
      { categoryIds, startDate, endDate }
    );

    res.json({
      success: true,
      data: {
        count: events.length,
        events
      }
    });
  } catch (error) {
    logger.error('Location search error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/events/search
 * Search events by text
 */
router.get('/search', [
  query('q').notEmpty(),
  query('categoryIds').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { q, categoryIds, startDate, endDate } = req.query;
    const categories = categoryIds ? (Array.isArray(categoryIds) ? categoryIds : [categoryIds]) : undefined;

    const events = await eventService.searchEvents(q, {
      categoryIds: categories,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: {
        count: events.length,
        events
      }
    });
  } catch (error) {
    logger.error('Text search error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/events/:id
 * Update event
 */
router.put('/:id', authenticateToken, [
  body('title').optional().trim(),
  body('description').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('country').optional().trim(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const event = await eventService.updateEvent(req.params.id, req.userId, req.body);

    logger.info(`Event updated: ${req.params.id}`);

    res.json({
      success: true,
      message: req.i18n.t('event.updated'),
      data: event
    });
  } catch (error) {
    logger.error('Update event error:', error.message);
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/events/:id
 * Delete event
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await eventService.deleteEvent(req.params.id, req.userId);

    logger.info(`Event deleted: ${req.params.id}`);

    res.json({
      success: true,
      message: req.i18n.t('event.deleted')
    });
  } catch (error) {
    logger.error('Delete event error:', error.message);
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/events
 * Get user's events
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const events = await eventService.getUserEvents(req.userId);

    res.json({
      success: true,
      data: {
        count: events.length,
        events
      }
    });
  } catch (error) {
    logger.error('Get user events error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
