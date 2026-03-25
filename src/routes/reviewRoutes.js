const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticateToken } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// GET /api/reviews/top-rated (before /:eventId)
router.get('/top-rated',
  [query('limit').optional().isInt({ min: 1, max: 100 })],
  handleValidationErrors,
  reviewController.getTopRated
);

// POST /api/reviews/:eventId
router.post('/:eventId',
  authenticateToken,
  [
    param('eventId').isUUID(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('reviewText').optional().trim()
  ],
  handleValidationErrors,
  reviewController.createOrUpdateReview
);

// GET /api/reviews/:eventId/stats
router.get('/:eventId/stats',
  [param('eventId').isUUID()],
  handleValidationErrors,
  reviewController.getEventStats
);

// GET /api/reviews/:eventId/user
router.get('/:eventId/user',
  authenticateToken,
  [param('eventId').isUUID()],
  handleValidationErrors,
  reviewController.getUserReview
);

// GET /api/reviews/:eventId
router.get('/:eventId',
  [
    param('eventId').isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  reviewController.getEventReviews
);

// DELETE /api/reviews/:reviewId
router.delete('/:reviewId',
  authenticateToken,
  [param('reviewId').isUUID()],
  handleValidationErrors,
  reviewController.deleteReview
);

module.exports = router;
