const userService = require('../../services/userService');
const { db } = require('../../database/connection');

jest.mock('../../database/connection');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateUserPreferences', () => {
    it('should update preferences successfully', async () => {
      db.one.mockResolvedValueOnce({
        id: 'pref1', user_id: 'user123',
        search_radius_km: 25, notification_enabled: false, newsletters_enabled: true
      });
      const result = await userService.updateUserPreferences('user123', {
        search_radius_km: 25, notification_enabled: false
      });
      expect(result.search_radius_km).toBe(25);
    });

    it('should throw error if no valid fields', async () => {
      await expect(userService.updateUserPreferences('user123', { invalid: true }))
        .rejects.toThrow('No valid fields to update');
    });
  });

  describe('getFavoriteEvents', () => {
    it('should return favorite events', async () => {
      db.any.mockResolvedValueOnce([
        { id: 'evt1', title: 'Event 1', favorited_at: new Date() }
      ]);
      const result = await userService.getFavoriteEvents('user123');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('getUserAttendingEvents', () => {
    it('should return attending events', async () => {
      db.any.mockResolvedValueOnce([
        { id: 'evt1', title: 'Event 1', status: 'registered' }
      ]);
      const result = await userService.getUserAttendingEvents('user123');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('addToFavorites duplicate error', () => {
    it('should throw already in favorites on duplicate key', async () => {
      db.oneOrNone.mockResolvedValueOnce({ id: 'evt1' });
      db.none.mockRejectedValueOnce(new Error('duplicate key value'));
      await expect(userService.addToFavorites('user123', 'evt1'))
        .rejects.toThrow('Event already in favorites');
    });
  });

  describe('registerForEvent duplicate error', () => {
    it('should throw already registered on duplicate key', async () => {
      db.oneOrNone.mockResolvedValueOnce({ id: 'evt1', max_attendees: 100, current_attendees: 5 });
      db.none.mockRejectedValueOnce(new Error('duplicate key value'));
      await expect(userService.registerForEvent('user123', 'evt1'))
        .rejects.toThrow('Already registered for this event');
    });
  });

  describe('getUserPreferences', () => {
    it('should get user preferences', async () => {
      const userId = 'user123';
      const mockPreferences = {
        id: 'pref123',
        user_id: userId,
        search_radius_km: 50,
        notification_enabled: true,
        newsletters_enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      db.oneOrNone.mockResolvedValueOnce(mockPreferences);
      db.any.mockResolvedValueOnce([
        { id: 'cat1', name: 'technology' }
      ]);

      const result = await userService.getUserPreferences(userId);

      expect(result).toEqual(expect.objectContaining({
        user_id: userId,
        search_radius_km: 50
      }));
      expect(result.preferredCategories).toBeDefined();
    });

    it('should throw error if preferences not found', async () => {
      db.oneOrNone.mockResolvedValueOnce(null);

      await expect(userService.getUserPreferences('user123'))
        .rejects
        .toThrow('User preferences not found');
    });
  });

  describe('addToFavorites', () => {
    it('should add event to favorites', async () => {
      const userId = 'user123';
      const eventId = 'event123';

      db.oneOrNone.mockResolvedValueOnce({ id: eventId }); // Event exists
      db.none.mockResolvedValueOnce();

      const result = await userService.addToFavorites(userId, eventId);

      expect(result).toBe(true);
    });

    it('should throw error if event not found', async () => {
      const userId = 'user123';
      const eventId = 'nonexistent';

      db.oneOrNone.mockResolvedValueOnce(null);

      await expect(userService.addToFavorites(userId, eventId))
        .rejects
        .toThrow('Event not found');
    });
  });

  describe('removeFromFavorites', () => {
    it('should remove event from favorites', async () => {
      const userId = 'user123';
      const eventId = 'event123';

      db.result.mockResolvedValueOnce({ rowCount: 1 });

      const result = await userService.removeFromFavorites(userId, eventId);

      expect(result).toBe(true);
    });

    it('should throw error if favorite not found', async () => {
      const userId = 'user123';
      const eventId = 'event123';

      db.result.mockResolvedValueOnce({ rowCount: 0 });

      await expect(userService.removeFromFavorites(userId, eventId))
        .rejects
        .toThrow('Favorite event not found');
    });
  });

  describe('registerForEvent', () => {
    it('should register user for event', async () => {
      const userId = 'user123';
      const eventId = 'event123';

      db.oneOrNone.mockResolvedValueOnce({
        id: eventId,
        max_attendees: 100,
        current_attendees: 50
      });
      db.none.mockResolvedValueOnce();
      db.none.mockResolvedValueOnce();

      const result = await userService.registerForEvent(userId, eventId);

      expect(result).toBe(true);
    });

    it('should throw error if event at capacity', async () => {
      const userId = 'user123';
      const eventId = 'event123';

      db.oneOrNone.mockResolvedValueOnce({
        id: eventId,
        max_attendees: 10,
        current_attendees: 10
      });

      await expect(userService.registerForEvent(userId, eventId))
        .rejects
        .toThrow('Event is at full capacity');
    });

    it('should throw error if event not found', async () => {
      db.oneOrNone.mockResolvedValueOnce(null);

      await expect(userService.registerForEvent('user123', 'nonexistent'))
        .rejects
        .toThrow('Event not found');
    });
  });

  describe('unregisterFromEvent', () => {
    it('should unregister user from event', async () => {
      const userId = 'user123';
      const eventId = 'event123';

      db.result.mockResolvedValueOnce({ rowCount: 1 });
      db.none.mockResolvedValueOnce();

      const result = await userService.unregisterFromEvent(userId, eventId);

      expect(result).toBe(true);
    });

    it('should throw error if registration not found', async () => {
      db.result.mockResolvedValueOnce({ rowCount: 0 });

      await expect(userService.unregisterFromEvent('user123', 'event123'))
        .rejects
        .toThrow('Registration not found');
    });
  });

  describe('setPreferredCategories', () => {
    it('should set preferred categories', async () => {
      const userId = 'user123';
      const categoryIds = ['cat1', 'cat2'];

      db.none.mockResolvedValue();
      db.any.mockResolvedValueOnce([
        { id: 'cat1', name: 'technology' },
        { id: 'cat2', name: 'sports' }
      ]);

      const result = await userService.setPreferredCategories(userId, categoryIds);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('isFavorite', () => {
    it('should return true if event is favorite', async () => {
      db.oneOrNone.mockResolvedValueOnce({ id: 'fav123' });

      const result = await userService.isFavorite('user123', 'event123');

      expect(result).toBe(true);
    });

    it('should return false if event is not favorite', async () => {
      db.oneOrNone.mockResolvedValueOnce(null);

      const result = await userService.isFavorite('user123', 'event123');

      expect(result).toBe(false);
    });
  });
});
