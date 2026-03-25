const notificationService = require('../services/notificationService');
const logger = require('../config/logger');

async function getNotifications(req, res) {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = req.query.limit || 50;
    const notifications = await notificationService.getUserNotifications(req.userId, unreadOnly, limit);
    res.json({ success: true, data: { count: notifications.length, notifications } });
  } catch (error) {
    logger.error('Get notifications error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getUnreadCount(req, res) {
  try {
    const count = await notificationService.getUnreadCount(req.userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    logger.error('Get unread count error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function markAllRead(req, res) {
  try {
    await notificationService.markAllAsRead(req.userId);
    logger.info(`All notifications marked as read for user: ${req.userId}`);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Mark all as read error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function markOneRead(req, res) {
  try {
    await notificationService.markAsRead(req.params.notificationId);
    logger.info(`Notification marked as read: ${req.params.notificationId}`);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Mark as read error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = { getNotifications, getUnreadCount, markAllRead, markOneRead };
