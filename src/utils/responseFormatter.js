/**
 * Response Formatter Utility
 * Standardizes API responses
 */

class ResponseFormatter {
  /**
   * Format success response
   */
  static success(data, message = 'Success', statusCode = 200) {
    return {
      statusCode,
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format error response
   */
  static error(message = 'Error', statusCode = 500, errors = null) {
    return {
      statusCode,
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format paginated response
   */
  static paginated(data, page, limit, total) {
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = ResponseFormatter;
