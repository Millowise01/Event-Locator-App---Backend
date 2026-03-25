const reviewService = require('../../services/reviewService');
const { db } = require('../../database/connection');

jest.mock('../../database/connection');

describe('ReviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrUpdateReview', () => {
    it('should create a new review', async () => {
      const userId = 'user123';
      const eventId = 'event123';
      const rating = 5;
      const reviewText = 'Great event!';

      db.oneOrNone.mockResolvedValueOnce({ id: eventId }); // Event exists
      db.oneOrNone.mockResolvedValueOnce({ id: 'att123' }); // User attended
      db.oneOrNone.mockResolvedValueOnce(null); // No existing review
      db.one.mockResolvedValueOnce({
        id: 'review123',
        user_id: userId,
        event_id: eventId,
        rating,
        review_text: reviewText,
        created_at: new Date(),
        updated_at: new Date()
      });

      const result = await reviewService.createOrUpdateReview(userId, eventId, rating, reviewText);

      expect(result).toEqual(expect.objectContaining({
        user_id: userId,
        event_id: eventId,
        rating
      }));
    });

    it('should update existing review', async () => {
      const userId = 'user123';
      const eventId = 'event123';
      const newRating = 4;

      db.oneOrNone.mockResolvedValueOnce({ id: eventId }); // Event exists
      db.oneOrNone.mockResolvedValueOnce({ id: 'att123' }); // User attended
      db.oneOrNone.mockResolvedValueOnce({ id: 'rev123' }); // Existing review
      db.one.mockResolvedValueOnce({
        id: 'rev123',
        user_id: userId,
        event_id: eventId,
        rating: newRating,
        updated_at: new Date()
      });

      const result = await reviewService.createOrUpdateReview(userId, eventId, newRating, 'Updated text');

      expect(result.rating).toBe(newRating);
    });

    it('should throw error for invalid rating', async () => {
      await expect(reviewService.createOrUpdateReview('user123', 'event123', 6, 'text'))
        .rejects
        .toThrow('Rating must be an integer between 1 and 5');
    });

    it('should throw error if user did not attend', async () => {
      db.oneOrNone.mockResolvedValueOnce({ id: 'event123' });
      db.oneOrNone.mockResolvedValueOnce(null); // User did not attend

      await expect(reviewService.createOrUpdateReview('user123', 'event123', 5, 'text'))
        .rejects
        .toThrow('You must be registered for this event to leave a review');
    });
  });

  describe('getEventReviews', () => {
    it('should get event reviews', async () => {
      const mockReviews = [
        {
          id: 'rev1',
          user_id: 'user1',
          rating: 5,
          review_text: 'Great!',
          first_name: 'John',
          last_name: 'Doe'
        }
      ];

      db.any.mockResolvedValueOnce(mockReviews);

      const result = await reviewService.getEventReviews('event123');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('getEventStatistics', () => {
    it('should get event statistics', async () => {
      db.one.mockResolvedValueOnce({
        total_reviews: '10',
        average_rating: '4.5',
        five_star_count: '5',
        four_star_count: '3',
        three_star_count: '2',
        two_star_count: '0',
        one_star_count: '0'
      });

      const result = await reviewService.getEventStatistics('event123');

      expect(result.totalReviews).toBe(10);
      expect(result.averageRating).toBe('4.50');
      expect(result.distribution).toBeDefined();
    });
  });

  describe('deleteReview', () => {
    it('should delete review successfully', async () => {
      const reviewId = 'rev123';
      const userId = 'user123';

      db.oneOrNone.mockResolvedValueOnce({ user_id: userId });
      db.none.mockResolvedValueOnce();

      const result = await reviewService.deleteReview(reviewId, userId);

      expect(result).toBe(true);
    });

    it('should throw error if unauthorized', async () => {
      const reviewId = 'rev123';
      const userId = 'user123';

      db.oneOrNone.mockResolvedValueOnce({ user_id: 'differentuser' });

      await expect(reviewService.deleteReview(reviewId, userId))
        .rejects
        .toThrow('Unauthorized: Only review author can delete');
    });
  });

  describe('getTopRatedEvents', () => {
    it('should return top rated events', async () => {
      const mockEvents = [
        {
          id: 'event1',
          title: 'Top Event',
          average_rating: '4.8',
          review_count: '50'
        }
      ];

      db.any.mockResolvedValueOnce(mockEvents);

      const result = await reviewService.getTopRatedEvents(10);

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
