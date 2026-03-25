const eventService = require('../services/eventService');
const notificationService = require('../services/notificationService');
const logger = require('../config/logger');

async function createEvent(req, res) {
  try {
    const event = await eventService.createEvent(req.userId, req.body);
    logger.info(`Event created: ${event.id} by user ${req.userId}`);

    // Notify users whose preferred categories match this event
    notificationService.notifyUpcomingEvent(event.id).catch(() => {});

    res.status(201).json({
      success: true,
      message: req.t('event.created'),
      data: event
    });
  } catch (error) {
    logger.error('Create event error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getEventById(req, res) {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.json({ success: true, data: event });
  } catch (error) {
    logger.error('Get event error:', error.message);
    res.status(404).json({ success: false, message: error.message });
  }
}

async function getUserEvents(req, res) {
  try {
    const events = await eventService.getUserEvents(req.userId);
    res.json({ success: true, data: { count: events.length, events } });
  } catch (error) {
    logger.error('Get user events error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function updateEvent(req, res) {
  try {
    const event = await eventService.updateEvent(req.params.id, req.userId, req.body);
    logger.info(`Event updated: ${req.params.id}`);
    res.json({
      success: true,
      message: req.t('event.updated'),
      data: event
    });
  } catch (error) {
    logger.error('Update event error:', error.message);
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message
    });
  }
}

async function deleteEvent(req, res) {
  try {
    await eventService.deleteEvent(req.params.id, req.userId);
    logger.info(`Event deleted: ${req.params.id}`);
    res.json({ success: true, message: req.t('event.deleted') });
  } catch (error) {
    logger.error('Delete event error:', error.message);
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message
    });
  }
}

async function searchByLocation(req, res) {
  try {
    const { latitude, longitude, radiusKm = 50, categoryIds, startDate, endDate } = req.body;
    const events = await eventService.searchEventsByLocation(
      latitude, longitude, radiusKm,
      { categoryIds, startDate, endDate }
    );
    res.json({ success: true, data: { count: events.length, events } });
  } catch (error) {
    logger.error('Location search error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function searchByText(req, res) {
  try {
    const { q, categoryIds, startDate, endDate } = req.query;
    const categories = categoryIds
      ? (Array.isArray(categoryIds) ? categoryIds : [categoryIds])
      : undefined;
    const events = await eventService.searchEvents(q, { categoryIds: categories, startDate, endDate });
    res.json({ success: true, data: { count: events.length, events } });
  } catch (error) {
    logger.error('Text search error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = {
  createEvent,
  getEventById,
  getUserEvents,
  updateEvent,
  deleteEvent,
  searchByLocation,
  searchByText
};
