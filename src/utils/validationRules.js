/**
 * Validation Rules Utility
 * Reusable validation rules
 */

const { body, param, query } = require('express-validator');

const validationRules = {
  // Email validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),

  // Password validation
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  // Name validation
  name: body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),

  // Coordinate validation
  latitude: body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),

  longitude: body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),

  // UUID validation
  uuid: param('id')
    .isUUID()
    .withMessage('Invalid ID format'),

  // Rating validation
  rating: body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  // Radius validation
  radius: body('radiusKm')
    .isInt({ min: 1 })
    .withMessage('Radius must be greater than 0'),

  // Pagination
  pagination: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
};

module.exports = validationRules;
