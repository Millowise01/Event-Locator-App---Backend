const eventService = require('../../services/eventService');
const { db } = require('../../database/connection');

// Mock the database
jest.mock('../../database/connection');

describe('EventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent without categories', () => {
    it('should create event with no categoryIds', async () => {
      db.one.mockResolvedValueOnce({ id: 'evt1', title: 'Event', created_at: new Date() });
      db.none.mockResolvedValue();
      const result = await eventService.createEvent('user1', {
        title: 'Event', latitude: 40.71, longitude: -74.00,
        startDate: '2025-01-01T10:00:00Z', endDate: '2025-01-01T18:00:00Z'
      });
      expect(result.id).toBe('evt1');
    });
  });

  describe('searchEventsByLocation with filters', () => {
    it('should search with category and date filters', async () => {
      db.any.mockResolvedValueOnce([{ id: 'evt1', distance_km: 2 }]);
      const events = await eventService.searchEventsByLocation(40.71, -74.00, 50, {
        categoryIds: ['cat1'],
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      });
      expect(events.length).toBe(1);
    });
  });

  describe('searchEvents with filters', () => {
    it('should search text with category and date filters', async () => {
      db.any.mockResolvedValueOnce([{ id: 'evt1', title: 'Tech Event' }]);
      const events = await eventService.searchEvents('tech', {
        categoryIds: ['cat1'],
        startDate: '2025-01-01'
      });
      expect(events.length).toBe(1);
    });
  });

  describe('updateEvent edge cases', () => {
    it('should throw if event not found', async () => {
      db.oneOrNone.mockResolvedValueOnce(null);
      await expect(eventService.updateEvent('evt1', 'user1', { title: 'X' }))
        .rejects.toThrow('Event not found');
    });

    it('should throw if no valid fields to update', async () => {
      db.oneOrNone.mockResolvedValueOnce({ creator_id: 'user1' });
      await expect(eventService.updateEvent('evt1', 'user1', { invalid_field: 'x' }))
        .rejects.toThrow('No valid fields to update');
    });
  });

  describe('deleteEvent edge cases', () => {
    it('should throw if event not found', async () => {
      db.oneOrNone.mockResolvedValueOnce(null);
      await expect(eventService.deleteEvent('evt1', 'user1'))
        .rejects.toThrow('Event not found');
    });
  });

  describe('getUserEvents', () => {
    it('should return events created by user', async () => {
      db.any.mockResolvedValueOnce([
        { id: 'evt1', title: 'My Event', created_at: new Date() }
      ]);
      const result = await eventService.getUserEvents('user1');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('getEventById with null rating', () => {
    it('should handle null avg_rating gracefully', async () => {
      db.oneOrNone.mockResolvedValueOnce({ id: 'evt1', title: 'Event' });
      db.any.mockResolvedValueOnce([]);
      db.oneOrNone.mockResolvedValueOnce({ avg_rating: null, review_count: 0 });
      const result = await eventService.getEventById('evt1');
      expect(result.averageRating).toBe('0.00');
    });
  });

  describe('createEvent', () => {
    it('should create event successfully', async () => {
      const creatorId = 'user123';
      const eventData = {
        title: 'Tech Conference',
        description: 'Annual tech conference',
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St',
        city: 'New York',
        country: 'USA',
        startDate: '2024-06-01T10:00:00Z',
        endDate: '2024-06-01T18:00:00Z',
        maxAttendees: 100,
        categoryIds: ['cat1', 'cat2']
      };

      const mockEvent = {
        id: 'event123',
        creator_id: creatorId,
        title: eventData.title,
        description: eventData.description,
        address: eventData.address,
        city: eventData.city,
        country: eventData.country,
        start_date: eventData.startDate,
        end_date: eventData.endDate,
        max_attendees: eventData.maxAttendees,
        created_at: new Date()
      };

      db.one.mockResolvedValueOnce(mockEvent);
      db.none.mockResolvedValue();

      const result = await eventService.createEvent(creatorId, eventData);

      expect(result).toEqual(mockEvent);
      expect(db.one).toHaveBeenCalled();
    });

    it('should throw error if end date is before start date', async () => {
      const eventData = {
        title: 'Event',
        startDate: '2024-06-01T18:00:00Z',
        endDate: '2024-06-01T10:00:00Z',
        latitude: 40.7128,
        longitude: -74.0060
      };

      await expect(eventService.createEvent('user123', eventData))
        .rejects
        .toThrow('End date must be after start date');
    });
  });

  describe('getEventById', () => {
    it('should return event with details', async () => {
      const eventId = 'event123';
      const mockEvent = {
        id: eventId,
        creator_id: 'user123',
        title: 'Tech Conference',
        description: 'Annual tech conference',
        address: '123 Main St',
        city: 'New York',
        country: 'USA',
        start_date: new Date(),
        end_date: new Date(),
        max_attendees: 100,
        current_attendees: 50,
        location_text: 'POINT(-74.0060 40.7128)',
        latitude: 40.7128,
        longitude: -74.0060
      };

      db.oneOrNone.mockResolvedValueOnce(mockEvent);
      db.any.mockResolvedValueOnce([
        { id: 'cat1', name: 'technology', description: 'Tech events' }
      ]);
      db.oneOrNone.mockResolvedValueOnce({
        avg_rating: 4.5,
        review_count: 10
      });

      const result = await eventService.getEventById(eventId);

      expect(result).toEqual(expect.objectContaining({
        id: eventId,
        title: mockEvent.title
      }));
      expect(result.categories).toBeDefined();
      expect(result.averageRating).toBeDefined();
    });

    it('should throw error if event not found', async () => {
      db.oneOrNone.mockResolvedValueOnce(null);

      await expect(eventService.getEventById('nonexistent'))
        .rejects
        .toThrow('Event not found');
    });
  });

  describe('searchEventsByLocation', () => {
    it('should find events within radius', async () => {
      const mockEvents = [
        {
          id: 'event1',
          title: 'Event 1',
          latitude: 40.7128,
          longitude: -74.0060,
          distance_km: 0
        },
        {
          id: 'event2',
          title: 'Event 2',
          latitude: 40.7580,
          longitude: -73.9855,
          distance_km: 5
        }
      ];

      db.any.mockResolvedValueOnce(mockEvents);

      const events = await eventService.searchEventsByLocation(40.7128, -74.0060, 50);

      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBe(2);
    });
  });

  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      const eventId = 'event123';
      const userId = 'user123';
      const updates = { title: 'Updated Title' };

      db.oneOrNone.mockResolvedValueOnce({ creator_id: userId });
      db.one.mockResolvedValueOnce({
        id: eventId,
        title: updates.title,
        updated_at: new Date()
      });

      const result = await eventService.updateEvent(eventId, userId, updates);

      expect(result.title).toBe(updates.title);
    });

    it('should throw error if user is not creator', async () => {
      const eventId = 'event123';
      const userId = 'differentuser';

      db.oneOrNone.mockResolvedValueOnce({ creator_id: 'originaluser' });

      await expect(eventService.updateEvent(eventId, userId, { title: 'New Title' }))
        .rejects
        .toThrow('Unauthorized: Only event creator can update');
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      const eventId = 'event123';
      const userId = 'user123';

      db.oneOrNone.mockResolvedValueOnce({ creator_id: userId });
      db.none.mockResolvedValueOnce();

      const result = await eventService.deleteEvent(eventId, userId);

      expect(result).toBe(true);
    });

    it('should throw error if user is not creator', async () => {
      const eventId = 'event123';
      const userId = 'differentuser';

      db.oneOrNone.mockResolvedValueOnce({ creator_id: 'originaluser' });

      await expect(eventService.deleteEvent(eventId, userId))
        .rejects
        .toThrow('Unauthorized: Only event creator can delete');
    });
  });
});
