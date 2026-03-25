const express = require('express');
const { param, query, validationResult } = require('express-validator');
const notificationService = require('../services/notificationService');
const { authenticateToken } = require('../middleware/authMiddleware');
const logger = require('../config/logger');

const router = express.Router();

/**
 * GET /api/notifications
 * Get user notifications
 */
router.get('/', authenticateToken, [
  query('unreadOnly').optional().isBoolean(),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = req.query.limit || 50;

    const notifications = await notificationService.getUserNotifications(req.userId, unreadOnly, limit);

    res.json({ success: true, data: { count: notifications.length, notifications } });
  } catch (error) {
    logger.error('Get notifications error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    logger.error('Get unread count error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/notifications/mark-all-read  <-- must be before /:notificationId/read
 * Mark all notifications as read
 */
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.userId);
    logger.info(`All notifications marked as read for user: ${req.userId}`);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Mark all as read error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/notifications/:notificationId/read
 * Mark notification as read
 */
router.put('/:notificationId/read', authenticateToken, [
  param('notificationId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    await notificationService.markAsRead(req.params.notificationId);
    logger.info(`Notification marked as read: ${req.params.notificationId}`);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Mark as read error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
