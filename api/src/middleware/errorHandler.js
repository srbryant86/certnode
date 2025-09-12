//---------------------------------------------------------------------
// api/src/middleware/errorHandler.js
// Global error handling middleware for unhandled exceptions and Promise rejections

function logError(error, req = null) {
  const timestamp = new Date().toISOString();
  const requestInfo = req ? `${req.method} ${req.url}` : 'No request context';
  
  console.error(`[${timestamp}] ERROR: ${requestInfo}`);
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  
  if (error.code) {
    console.error('Code:', error.code);
  }
}

function createErrorHandler() {
  return function errorHandler(error, req, res) {
    logError(error, req);
    
    // Don't expose internal errors to clients in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    let statusCode = error.statusCode || 500;
    let errorType = 'internal_error';
    let message = 'An unexpected error occurred';
    
    // Map known error types
    if (error.statusCode && error.statusCode < 500) {
      errorType = 'client_error';
      message = error.message || 'Client error';
    } else if (error.code === 'ECONNREFUSED') {
      statusCode = 503;
      errorType = 'service_unavailable';
      message = 'External service unavailable';
    } else if (error.code === 'TIMEOUT') {
      statusCode = 504;
      errorType = 'timeout';
      message = 'Request timeout';
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
      errorType = 'validation_error';
      message = isDevelopment ? error.message : 'Invalid request';
    } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      statusCode = 400;
      errorType = 'invalid_json';
      message = 'Invalid JSON in request body';
    }
    
    const errorResponse = {
      error: errorType,
      message,
      timestamp: new Date().toISOString()
    };
    
    // Include request_id if available
    if (req?.id) {
      errorResponse.request_id = req.id;
    }
    
    // Include error details in development
    if (isDevelopment) {
      errorResponse.details = {
        name: error.name,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 10) // Limit stack trace
      };
    }
    
    // Ensure response headers aren't already sent
    if (!res.headersSent) {
      const headers = { 'Content-Type': 'application/json' };
      
      // Include X-Request-Id header if available
      if (req?.id) {
        headers['X-Request-Id'] = req.id;
      }
      
      res.writeHead(statusCode, headers);
      res.end(JSON.stringify(errorResponse, null, 2));
    }
  };
}

function setupGlobalErrorHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    logError(error);
    
    // Graceful shutdown
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED PROMISE REJECTION! Potential memory leak detected.');
    console.error('Reason:', reason);
    console.error('Promise:', promise);
    
    // In production, we might want to shut down gracefully
    if (process.env.NODE_ENV === 'production') {
      console.error('Shutting down due to unhandled promise rejection...');
      process.exit(1);
    }
  });
}

// Wrapper to catch async errors in route handlers
function asyncHandler(fn) {
  return function(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next || ((error) => {
      const errorHandler = createErrorHandler();
      errorHandler(error, req, res);
    }));
  };
}

// Express-style error middleware (though we're using raw Node.js HTTP)
function createErrorMiddleware() {
  const errorHandler = createErrorHandler();
  
  return function errorMiddleware(req, res, next) {
    // Store original res.end to catch errors during response
    const originalEnd = res.end;
    
    res.end = function(data) {
      try {
        originalEnd.call(this, data);
      } catch (error) {
        errorHandler(error, req, res);
      }
    };
    
    // Store error handler on response for route handlers to use
    res.handleError = (error) => errorHandler(error, req, res);
    
    if (next) next();
  };
}

module.exports = {
  createErrorHandler,
  setupGlobalErrorHandlers,
  asyncHandler,
  createErrorMiddleware,
  logError
};
//---------------------------------------------------------------------