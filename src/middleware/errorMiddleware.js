/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */

const logger = require('../config/logger');

/**
 * Global error handler middleware
 */
function globalErrorHandler(err, req, res, next) {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Not Found middleware
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: req.i18n?.t('error.not_found') || 'Resource not found',
  });
}

module.exports = {
  globalErrorHandler,
  notFoundHandler,
};
