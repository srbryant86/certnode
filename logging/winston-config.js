const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');
const path = require('path');

// Custom log format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      service: 'certnode-api',
      environment: process.env.NODE_ENV || 'development',
      pid: process.pid,
      hostname: require('os').hostname(),
      ...meta
    };

    // Add correlation ID if available
    if (meta.correlationId || meta.request_id) {
      logEntry.correlation_id = meta.correlationId || meta.request_id;
    }

    // Add request context if available
    if (meta.req) {
      logEntry.http = {
        method: meta.req.method,
        url: meta.req.url,
        user_agent: meta.req.get('User-Agent'),
        client_ip: meta.req.ip || meta.req.connection.remoteAddress,
        request_id: meta.req.id
      };
    }

    // Add response context if available
    if (meta.res) {
      logEntry.http = {
        ...logEntry.http,
        status_code: meta.res.statusCode,
        response_time: meta.responseTime
      };
    }

    // Add error context if available
    if (meta.error || level === 'error') {
      logEntry.error = {
        type: meta.error?.name || 'Error',
        message: meta.error?.message || message,
        stack: meta.error?.stack,
        code: meta.error?.code
      };
    }

    // Add performance context if available
    if (meta.performance) {
      logEntry.performance = {
        duration: meta.performance.duration,
        memory_usage: process.memoryUsage().heapUsed,
        cpu_usage: process.cpuUsage()
      };
    }

    // Add security context for security events
    if (meta.security) {
      logEntry.event_type = 'security';
      logEntry.security = meta.security;
    }

    return JSON.stringify(logEntry);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMsg = `${timestamp} [${level}]: ${message}`;

    if (meta.correlation_id) {
      logMsg += ` [${meta.correlation_id}]`;
    }

    if (Object.keys(meta).length > 0) {
      logMsg += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return logMsg;
  })
);

// Create logger configuration
const createLogger = () => {
  const transports = [];

  // Console transport for development
  if (process.env.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: process.env.LOG_LEVEL || 'debug'
      })
    );
  }

  // File transports for all environments
  transports.push(
    // General application logs
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || './logs', 'app.log'),
      format: logFormat,
      level: process.env.LOG_LEVEL || 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),

    // Error logs
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || './logs', 'error.log'),
      format: logFormat,
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),

    // Security audit logs
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || './logs', 'security.log'),
      format: logFormat,
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 15,
      tailable: true,
      // Only log security events
      filter: (log) => log.event_type === 'security'
    }),

    // Performance logs
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || './logs', 'performance.log'),
      format: logFormat,
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 7,
      tailable: true,
      // Only log performance events
      filter: (log) => log.performance || log.event_type === 'performance'
    })
  );

  // Elasticsearch transport for production
  if (process.env.NODE_ENV === 'production' && process.env.ELASTICSEARCH_HOST) {
    transports.push(
      new ElasticsearchTransport({
        level: 'info',
        clientOpts: {
          node: process.env.ELASTICSEARCH_HOST,
          auth: process.env.ELASTICSEARCH_AUTH ? {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD
          } : undefined
        },
        index: 'certnode-logs',
        typeName: '_doc',
        mappingTemplate: require('./elasticsearch-mapping.json'),
        flushInterval: 2000,
        waitForActiveShards: 1,
        waitForStatus: 'green',
        handleExceptions: false,
        handleRejections: false
      })
    );
  }

  // TCP transport for Logstash
  if (process.env.LOGSTASH_HOST) {
    transports.push(
      new winston.transports.Http({
        host: process.env.LOGSTASH_HOST.split(':')[0] || 'localhost',
        port: parseInt(process.env.LOGSTASH_HOST.split(':')[1]) || 5000,
        path: '/',
        format: logFormat
      })
    );
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exceptionHandlers: [
      new winston.transports.File({
        filename: path.join(process.env.LOG_DIR || './logs', 'exceptions.log'),
        format: logFormat,
        maxsize: 10485760,
        maxFiles: 3
      })
    ],
    rejectionHandlers: [
      new winston.transports.File({
        filename: path.join(process.env.LOG_DIR || './logs', 'rejections.log'),
        format: logFormat,
        maxsize: 10485760,
        maxFiles: 3
      })
    ],
    exitOnError: false
  });
};

// Create and configure logger
const logger = createLogger();

// Helper methods for structured logging
logger.logRequest = (req, res, responseTime) => {
  logger.info('HTTP Request', {
    event_type: 'http_request',
    req,
    res,
    responseTime,
    correlation_id: req.id
  });
};

logger.logError = (error, context = {}) => {
  logger.error('Application Error', {
    error,
    ...context
  });
};

logger.logSecurity = (event, context = {}) => {
  logger.warn('Security Event', {
    event_type: 'security',
    security: event,
    ...context
  });
};

logger.logPerformance = (operation, duration, context = {}) => {
  logger.info('Performance Metric', {
    event_type: 'performance',
    operation,
    performance: {
      duration,
      memory_usage: process.memoryUsage().heapUsed,
      ...context
    }
  });
};

logger.logDatabase = (query, duration, context = {}) => {
  logger.debug('Database Query', {
    event_type: 'database',
    database: {
      query: query.substring(0, 500), // Truncate long queries
      query_duration: duration,
      ...context
    }
  });
};

logger.logAuthentication = (userId, action, success, context = {}) => {
  logger.info('Authentication Event', {
    event_type: 'authentication',
    user_id: userId,
    action,
    success,
    ...context
  });
};

// Stream interface for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;