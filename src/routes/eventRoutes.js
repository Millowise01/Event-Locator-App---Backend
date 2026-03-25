const express = require('express');
const { body, query, param } = require('express-validator');
const { authenticateToken } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');
const eventController = require('../controllers/eventController');

const router = express.Router();

// POST /api/events — create event
router.post('/',
  authenticateToken,
  [
    body('title').trim().notEmpty(),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('description').optional().trim(),
    body('address').optional().trim(),
    body('city').optional().trim(),
    body('country').optional().trim(),
    body('maxAttendees').optional().isInt({ min: 0 }),
    body('categoryIds').optional().isArray()
  ],
  handleValidationErrors,
  eventController.createEvent
);

// GET /api/events — get user's events
router.get('/', authenticateToken, eventController.getUserEvents);

// POST /api/events/search/location — location-based search (before /:id)
router.post('/search/location',
  [
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('radiusKm').optional().isInt({ min: 1, max: 1000 }),
    body('categoryIds').optional().isArray()
  ],
  handleValidationErrors,
  eventController.searchByLocation
);

// GET /api/events/search — text search (before /:id)
router.get('/search',
  [query('q').notEmpty()],
  handleValidationErrors,
  eventController.searchByText
);

// GET /api/events/:id — get event by ID
router.get('/:id',
  [param('id').isUUID()],
  handleValidationErrors,
  eventController.getEventById
);

// PUT /api/events/:id — update event
router.put('/:id',
  authenticateToken,
  [
    param('id').isUUID(),
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('address').optional().trim(),
    body('city').optional().trim(),
    body('country').optional().trim(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('maxAttendees').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  eventController.updateEvent
);

// DELETE /api/events/:id — delete event
router.delete('/:id',
  authenticateToken,
  [param('id').isUUID()],
  handleValidationErrors,
  eventController.deleteEvent
);

module.exports = router;
