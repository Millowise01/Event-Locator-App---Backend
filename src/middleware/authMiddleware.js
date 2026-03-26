/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user data to requests
 */

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Middleware to verify JWT token
 */
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: req.t ? req.t('auth.unauthorized') : 'Unauthorized',
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.error('Token verification failed:', err.message);
        return res.status(401).json({
          success: false,
          message: req.t ? req.t('auth.unauthorized') : 'Invalid token',
        });
      }
      req.userId = decoded.userId;
      req.user = decoded;
      next();
    });
  } catch (error) {
    logger.error('Authentication error:', error.message);
    res.status(401).json({
      success: false,
      message: req.t ? req.t('auth.unauthorized') : 'Unauthorized',
    });
  }
}

module.exports = { authenticateToken };
