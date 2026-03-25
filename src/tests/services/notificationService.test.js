const notificationService = require('../../services/notificationService');
const { db } = require('../../database/connection');

jest.mock('../../database/connection');
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(),
    publish: jest.fn().mockResolvedValue(1),
    zAdd: jest.fn().mockResolvedValue(1),
    subscribe: jest.fn().mockResolvedValue(),
    on: jest.fn(),
    duplicate: jest.fn(() => ({
      connect: jest.fn().mockResolvedValue(),
      subscribe: jest.fn().mockResolvedValue(),
      on: jest.fn()
    }))
  }))
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    notificationService.initialized = false;
    notificationService.client = null;
  });

  describe('createNotification', () => {
    it('should create a notification in the database', async () => {
      const userId = 'user123';
      const notificationData = {
        eventId: 'event123',
        type: 'upcoming_event',
        title: 'New Event',
        message: 'An event is coming up'
      };

      const mockNotification = {
        id: 'notif123',
        user_id: userId,
        event_id: notificationData.eventId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        read: false,
        created_at: new Date()
      };

      db.one.mockResolvedValueOnce(mockNotification);

      const result = await notificationService.createNotification(userId, notificationData);

      expect(result).toEqual(mockNotification);
      expect(db.one).toHaveBeenCalled();
    });
  });

  describe('getUserNotifications', () => {
    it('should return all notifications for a user', async () => {
      const userId = 'user123';
      const mockNotifications = [
        { id: 'notif1', user_id: userId, type: 'upcoming_event', read: false },
        { id: 'notif2', user_id: userId, type: 'new_event', read: true }
      ];

      db.any.mockResolvedValueOnce(mockNotifications);

      const result = await notificationService.getUserNotifications(userId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should filter unread notifications when unreadOnly is true', async () => {
      const userId = 'user123';
      const mockNotifications = [
        { id: 'notif1', user_id: userId, type: 'upcoming_event', read: false }
      ];

      db.any.mockResolvedValueOnce(mockNotifications);

      const result = await notificationService.getUserNotifications(userId, true);

      expect(result.length).toBe(1);
      expect(db.any).toHaveBeenCalledWith(
        expect.stringContaining('read = FALSE'),
        expect.any(Array)
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      db.none.mockResolvedValueOnce();

      const result = await notificationService.markAsRead('notif123');

      expect(result).toBe(true);
      expect(db.none).toHaveBeenCalledWith(
        'UPDATE notifications SET read = TRUE WHERE id = $1',
        ['notif123']
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      db.none.mockResolvedValueOnce();

      const result = await notificationService.markAllAsRead('user123');

      expect(result).toBe(true);
      expect(db.none).toHaveBeenCalledWith(
        'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE',
        ['user123']
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return the unread notification count', async () => {
      db.one.mockResolvedValueOnce({ count: '5' });

      const result = await notificationService.getUnreadCount('user123');

      expect(result).toBe(5);
    });
  });

  describe('notifyUpcomingEvent', () => {
    it('should notify users interested in event categories', async () => {
      const eventId = 'event123';

      db.one.mockResolvedValueOnce({ id: eventId, title: 'Tech Conf', start_date: new Date() });
      db.any.mockResolvedValueOnce([
        { id: 'user1', email: 'user1@example.com' },
        { id: 'user2', email: 'user2@example.com' }
      ]);
      db.one.mockResolvedValue({ id: 'notif1', user_id: 'user1', read: false, created_at: new Date() });

      const count = await notificationService.notifyUpcomingEvent(eventId);

      expect(count).toBe(2);
    });

    it('should return 0 if no matching users', async () => {
      db.one.mockResolvedValueOnce({ id: 'event123', title: 'Event', start_date: new Date() });
      db.any.mockResolvedValueOnce([]);

      const count = await notificationService.notifyUpcomingEvent('event123');

      expect(count).toBe(0);
    });
  });

  describe('publishEventNotification', () => {
    it('should warn when Redis is not initialized', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await notificationService.publishEventNotification('event123', { title: 'Test' });

      expect(consoleSpy).toHaveBeenCalledWith('Redis not available for notification publishing');
      consoleSpy.mockRestore();
    });
  });

  describe('sendScheduledNotification', () => {
    it('should warn when Redis is not initialized', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await notificationService.sendScheduledNotification('user123', { title: 'Test' }, 3600);

      expect(consoleSpy).toHaveBeenCalledWith('Redis not available for scheduled notifications');
      consoleSpy.mockRestore();
    });
  });
});
