const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/register
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty()
  ],
  handleValidationErrors,
  authController.register
);

// POST /api/auth/login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  handleValidationErrors,
  authController.login
);

// GET /api/auth/me
router.get('/me', authenticateToken, authController.getMe);

// PUT /api/auth/profile
router.put('/profile',
  authenticateToken,
  [
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('phone').optional(),
    body('preferredLanguage').optional().isIn(['en', 'es', 'fr', 'de'])
  ],
  handleValidationErrors,
  authController.updateProfile
);

// PUT /api/auth/location
router.put('/location',
  authenticateToken,
  [
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 })
  ],
  handleValidationErrors,
  authController.updateLocation
);

// POST /api/auth/change-password
router.post('/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  handleValidationErrors,
  authController.changePassword
);

module.exports = router;
