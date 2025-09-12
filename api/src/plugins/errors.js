const { createErrorHandler } = require('../middleware/errorHandler');

const ERROR_CATEGORIES = {
  CLIENT_ERROR: 'CLIENT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
};

function createError(category, message, statusCode = 500) {
  const error = new Error(message);
  error.category = category;
  error.statusCode = statusCode;
  
  if (category === ERROR_CATEGORIES.CLIENT_ERROR) {
    error.statusCode = 400;
  } else if (category === ERROR_CATEGORIES.VALIDATION_ERROR) {
    error.statusCode = 400;
    error.name = 'ValidationError';
  }
  
  return error;
}

function formatErrorResponse(error, request) {
  const response = {
    error: error.message || 'An error occurred',
    timestamp: new Date().toISOString()
  };
  
  if (request?.id) {
    response.request_id = request.id;
  }
  
  return response;
}

const handleError = createErrorHandler();

module.exports = {
  ERROR_CATEGORIES,
  createError,
  formatErrorResponse,
  handleError
};