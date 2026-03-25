const userService = require('../services/userService');
const logger = require('../config/logger');

async function getPreferences(req, res) {
  try {
    const preferences = await userService.getUserPreferences(req.userId);
    res.json({ success: true, data: preferences });
  } catch (error) {
    logger.error('Get preferences error:', error.message);
    res.status(404).json({ success: false, message: error.message });
  }
}

async function updatePreferences(req, res) {
  try {
    const preferences = await userService.updateUserPreferences(req.userId, req.body);
    logger.info(`Preferences updated: ${req.userId}`);
    res.json({ success: true, message: 'Preferences updated successfully', data: preferences });
  } catch (error) {
    logger.error('Update preferences error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function setPreferredCategories(req, res) {
  try {
    const categories = await userService.setPreferredCategories(req.userId, req.body.categoryIds);
    logger.info(`Preferred categories updated: ${req.userId}`);
    res.json({ success: true, message: 'Preferred categories updated', data: categories });
  } catch (error) {
    logger.error('Set categories error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function addFavorite(req, res) {
  try {
    await userService.addToFavorites(req.userId, req.params.eventId);
    logger.info(`Event added to favorites: ${req.params.eventId} by ${req.userId}`);
    res.status(201).json({ success: true, message: req.t('favorite.added') });
  } catch (error) {
    logger.error('Add favorite error:', error.message);
    res.status(error.message.includes('already') ? 409 : 400).json({
      success: false,
      message: error.message
    });
  }
}

async function removeFavorite(req, res) {
  try {
    await userService.removeFromFavorites(req.userId, req.params.eventId);
    logger.info(`Event removed from favorites: ${req.params.eventId} by ${req.userId}`);
    res.json({ success: true, message: req.t('favorite.removed') });
  } catch (error) {
    logger.error('Remove favorite error:', error.message);
    res.status(404).json({ success: false, message: error.message });
  }
}

async function getFavorites(req, res) {
  try {
    const events = await userService.getFavoriteEvents(req.userId);
    res.json({ success: true, data: { count: events.length, events } });
  } catch (error) {
    logger.error('Get favorites error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function checkFavorite(req, res) {
  try {
    const isFavorite = await userService.isFavorite(req.userId, req.params.eventId);
    res.json({ success: true, data: { isFavorite } });
  } catch (error) {
    logger.error('Check favorite error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function registerForEvent(req, res) {
  try {
    await userService.registerForEvent(req.userId, req.params.eventId);
    logger.info(`User registered for event: ${req.params.eventId}`);
    res.status(201).json({ success: true, message: req.t('event.registered') });
  } catch (error) {
    logger.error('Register event error:', error.message);
    res.status(error.message.includes('capacity') || error.message.includes('already') ? 400 : 404).json({
      success: false,
      message: error.message
    });
  }
}

async function unregisterFromEvent(req, res) {
  try {
    await userService.unregisterFromEvent(req.userId, req.params.eventId);
    logger.info(`User unregistered from event: ${req.params.eventId}`);
    res.json({ success: true, message: req.t('event.unregistered') });
  } catch (error) {
    logger.error('Unregister event error:', error.message);
    res.status(404).json({ success: false, message: error.message });
  }
}

async function getAttendingEvents(req, res) {
  try {
    const events = await userService.getUserAttendingEvents(req.userId);
    res.json({ success: true, data: { count: events.length, events } });
  } catch (error) {
    logger.error('Get attending events error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = {
  getPreferences,
  updatePreferences,
  setPreferredCategories,
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite,
  registerForEvent,
  unregisterFromEvent,
  getAttendingEvents
};
