/**
 * Advanced Structured Logging System
 * Provides comprehensive logging with correlation IDs, performance tracking, and error handling
 */

const winston = require('winston');
const path = require('path');

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'grey'
});

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      correlationId,
      ...meta
    };
    return JSON.stringify(logEntry);
  })
);

// Create logger instance
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console output for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
          const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
          const corrId = correlationId ? `[${correlationId}]` : '';
          return `${timestamp} ${level} ${corrId}: ${message}${metaStr}`;
        })
      )
    }),

    // File output for production
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ]
});

// Performance tracking
class PerformanceTracker {
  constructor(operation, correlationId) {
    this.operation = operation;
    this.correlationId = correlationId;
    this.startTime = process.hrtime.bigint();
    this.checkpoints = [];
  }

  checkpoint(name) {
    const currentTime = process.hrtime.bigint();
    const elapsed = Number(currentTime - this.startTime) / 1000000; // Convert to milliseconds
    this.checkpoints.push({ name, elapsed });

    logger.debug('Performance checkpoint', {
      operation: this.operation,
      checkpoint: name,
      elapsed: `${elapsed.toFixed(3)}ms`,
      correlationId: this.correlationId
    });
  }

  finish(metadata = {}) {
    const endTime = process.hrtime.bigint();
    const totalTime = Number(endTime - this.startTime) / 1000000;

    logger.info('Performance tracking completed', {
      operation: this.operation,
      totalTime: `${totalTime.toFixed(3)}ms`,
      checkpoints: this.checkpoints,
      correlationId: this.correlationId,
      ...metadata
    });

    return {
      operation: this.operation,
      totalTime,
      checkpoints: this.checkpoints
    };
  }
}

// Logging middleware for HTTP requests
const loggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const correlationId = req.correlationId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add correlation ID to request
  req.correlationId = correlationId;
  req.logger = createContextLogger(correlationId);

  // Log incoming request
  req.logger.http('Incoming request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    headers: sanitizeHeaders(req.headers)
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;

    req.logger.http('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length') || 0
    });

    originalEnd.apply(this, args);
  };

  next();
};

// Create context-aware logger
function createContextLogger(correlationId) {
  return {
    error: (message, meta = {}) => logger.error(message, { correlationId, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { correlationId, ...meta }),
    info: (message, meta = {}) => logger.info(message, { correlationId, ...meta }),
    http: (message, meta = {}) => logger.http(message, { correlationId, ...meta }),
    verbose: (message, meta = {}) => logger.verbose(message, { correlationId, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { correlationId, ...meta }),
    perf: (operation) => new PerformanceTracker(operation, correlationId)
  };
}

// Sanitize sensitive headers
function sanitizeHeaders(headers) {
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });

  return sanitized;
}

// Error logging helper
function logError(error, correlationId, context = {}) {
  const contextLogger = createContextLogger(correlationId);

  contextLogger.error('Application error', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    ...context
  });
}

// Business event logging
function logBusinessEvent(event, data, correlationId) {
  const contextLogger = createContextLogger(correlationId);

  contextLogger.info('Business event', {
    event,
    data,
    timestamp: new Date().toISOString()
  });
}

// Security event logging
function logSecurityEvent(event, details, correlationId) {
  const contextLogger = createContextLogger(correlationId);

  contextLogger.warn('Security event', {
    event,
    details,
    timestamp: new Date().toISOString(),
    severity: 'high'
  });
}

// Ensure logs directory exists
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

module.exports = {
  logger,
  loggingMiddleware,
  createContextLogger,
  PerformanceTracker,
  logError,
  logBusinessEvent,
  logSecurityEvent
};