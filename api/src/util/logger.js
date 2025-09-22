class Logger {
  constructor(context = 'app') {
    this.context = context;
    this.enableColors = process.env.NODE_ENV !== 'production' && process.stdout.isTTY;
  }

  _formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const baseLog = {
      timestamp,
      level: level.toUpperCase(),
      context: this.context,
      message,
      ...meta
    };

    if (process.env.LOG_FORMAT === 'json') {
      return JSON.stringify(baseLog);
    }

    let prefix = `[${timestamp}] ${level.toUpperCase().padEnd(5)} [${this.context}]`;

    if (this.enableColors) {
      const colors = {
        info: '\x1b[36m',    // cyan
        warn: '\x1b[33m',    // yellow
        error: '\x1b[31m',   // red
        debug: '\x1b[90m',   // gray
        reset: '\x1b[0m'
      };
      prefix = `${colors[level] || ''}${prefix}${colors.reset}`;
    }

    let output = `${prefix} ${message}`;

    if (Object.keys(meta).length > 0) {
      const metaStr = Object.entries(meta)
        .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`)
        .join(' ');
      output += ` ${metaStr}`;
    }

    return output;
  }

  info(message, meta = {}) {
    console.log(this._formatMessage('info', message, meta));
  }

  warn(message, meta = {}) {
    console.warn(this._formatMessage('warn', message, meta));
  }

  error(message, meta = {}) {
    console.error(this._formatMessage('error', message, meta));
  }

  debug(message, meta = {}) {
    if (process.env.LOG_LEVEL === 'debug' || process.env.NODE_ENV === 'development') {
      console.log(this._formatMessage('debug', message, meta));
    }
  }

  child(context) {
    return new Logger(`${this.context}:${context}`);
  }

  // Request logging middleware
  middleware() {
    return (req, res, next) => {
      const start = Date.now();
      const requestId = req.id || 'unknown';

      this.info('Request started', {
        method: req.method,
        path: req.url,
        request_id: requestId,
        user_agent: req.headers['user-agent']
      });

      res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? 'warn' : 'info';

        this[level]('Request completed', {
          method: req.method,
          path: req.url,
          status: res.statusCode,
          duration_ms: duration,
          request_id: requestId
        });
      });

      next();
    };
  }
}

// Default logger instance
const logger = new Logger();

// Helper to create context-specific loggers
function createLogger(context) {
  return new Logger(context);
}

module.exports = { Logger, logger, createLogger };