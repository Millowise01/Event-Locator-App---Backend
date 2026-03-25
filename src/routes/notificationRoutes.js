const express = require('express');
const { param, query } = require('express-validator');
const { authenticateToken } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// GET /api/notifications
router.get('/',
  authenticateToken,
  [
    query('unreadOnly').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  notificationController.getNotifications
);

// GET /api/notifications/unread-count (before /:notificationId)
router.get('/unread-count', authenticateToken, notificationController.getUnreadCount);

// PUT /api/notifications/mark-all-read (before /:notificationId)
router.put('/mark-all-read', authenticateToken, notificationController.markAllRead);

// PUT /api/notifications/:notificationId/read
router.put('/:notificationId/read',
  authenticateToken,
  [param('notificationId').isUUID()],
  handleValidationErrors,
  notificationController.markOneRead
);

module.exports = router;
