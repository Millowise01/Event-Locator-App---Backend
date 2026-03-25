const express = require('express');
const { body, param } = require('express-validator');
const { authenticateToken } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');
const userController = require('../controllers/userController');

const router = express.Router();

// GET /api/users/preferences
router.get('/preferences', authenticateToken, userController.getPreferences);

// PUT /api/users/preferences
router.put('/preferences',
  authenticateToken,
  [
    body('searchRadiusKm').optional().isInt({ min: 1, max: 500 }),
    body('notificationEnabled').optional().isBoolean(),
    body('newslettersEnabled').optional().isBoolean()
  ],
  handleValidationErrors,
  userController.updatePreferences
);

// POST /api/users/categories
router.post('/categories',
  authenticateToken,
  [body('categoryIds').isArray({ min: 1 })],
  handleValidationErrors,
  userController.setPreferredCategories
);

// GET /api/users/favorites (before /:eventId routes)
router.get('/favorites', authenticateToken, userController.getFavorites);

// POST /api/users/favorites/:eventId
router.post('/favorites/:eventId', authenticateToken, userController.addFavorite);

// DELETE /api/users/favorites/:eventId
router.delete('/favorites/:eventId', authenticateToken, userController.removeFavorite);

// GET /api/users/favorites/:eventId/check
router.get('/favorites/:eventId/check', authenticateToken, userController.checkFavorite);

// GET /api/users/events/attending (before /:eventId routes)
router.get('/events/attending', authenticateToken, userController.getAttendingEvents);

// POST /api/users/events/:eventId/register
router.post('/events/:eventId/register', authenticateToken, userController.registerForEvent);

// DELETE /api/users/events/:eventId/unregister
router.delete('/events/:eventId/unregister', authenticateToken, userController.unregisterFromEvent);

module.exports = router;
