const express = require('express');
const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');
const { authenticateToken } = require('../middleware/authMiddleware');
const logger = require('../config/logger');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName } = req.body;

    const result = await authService.registerUser({
      email,
      password,
      firstName,
      lastName
    });

    logger.info(`User registered: ${result.user.email}`);

    res.status(201).json({
      success: true,
      message: req.i18n.t('auth.register_success'),
      data: {
        user: result.user,
        token: result.token
      }
    });
  } catch (error) {
    logger.error('Registration error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const result = await authService.loginUser(email, password);

    logger.info(`User logged in: ${result.user.email}`);

    res.json({
      success: true,
      message: req.i18n.t('auth.login_success'),
      data: {
        user: result.user,
        token: result.token
      }
    });
  } catch (error) {
    logger.error('Login error:', error.message);
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await authService.getUserById(req.userId);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get user error:', error.message);
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('phone').optional(),
  body('preferredLanguage').optional().isIn(['en', 'es', 'fr', 'de'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const updates = req.body;
    const user = await authService.updateUserProfile(req.userId, updates);

    logger.info(`User profile updated: ${req.userId}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    logger.error('Update profile error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/auth/location
 * Update user location
 */
router.put('/location', authenticateToken, [
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { latitude, longitude } = req.body;
    const user = await authService.updateUserLocation(req.userId, latitude, longitude);

    logger.info(`User location updated: ${req.userId}`);

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: user
    });
  } catch (error) {
    logger.error('Update location error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.userId, currentPassword, newPassword);

    logger.info(`Password changed: ${req.userId}`);

    res.json({
      success: true,
      message: req.i18n.t('auth.password_changed')
    });
  } catch (error) {
    logger.error('Change password error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
