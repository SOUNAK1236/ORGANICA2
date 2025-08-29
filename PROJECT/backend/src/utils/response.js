/**
 * Utility functions for API responses
 */

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {Object} data - Response data
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
exports.success = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message
  };

  if (data) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 500)
 * @param {Object} error - Error details (only included in development)
 */
exports.error = (res, message, statusCode = 500, error = null) => {
  const response = {
    success: false,
    message
  };

  // Include error details in development mode
  if (error && process.env.NODE_ENV === 'development') {
    response.error = error.toString();
    if (error.stack) {
      response.stack = error.stack;
    }
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors array
 */
exports.validationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array()
  });
};

/**
 * Send a not found response
 * @param {Object} res - Express response object
 * @param {String} message - Not found message
 */
exports.notFound = (res, message = 'Resource not found') => {
  return res.status(404).json({
    success: false,
    message
  });
};

/**
 * Send an unauthorized response
 * @param {Object} res - Express response object
 * @param {String} message - Unauthorized message
 */
exports.unauthorized = (res, message = 'Unauthorized access') => {
  return res.status(401).json({
    success: false,
    message
  });
};

/**
 * Send a forbidden response
 * @param {Object} res - Express response object
 * @param {String} message - Forbidden message
 */
exports.forbidden = (res, message = 'Access forbidden') => {
  return res.status(403).json({
    success: false,
    message
  });
};