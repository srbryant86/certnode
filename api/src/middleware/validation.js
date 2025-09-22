const { createLogger } = require('../util/logger');

class ValidationError extends Error {
  constructor(message, field = null, code = 'validation_error') {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = code;
    this.field = field;
  }
}

class ValidationMiddleware {
  constructor(options = {}) {
    this.logger = createLogger('validation');
    this.options = {
      maxDepth: options.maxDepth || 10,
      maxKeys: options.maxKeys || 100,
      maxStringLength: options.maxStringLength || 10000,
      maxArrayLength: options.maxArrayLength || 1000,
      allowedMimeTypes: options.allowedMimeTypes || ['application/json'],
      ...options
    };
  }

  // Content-Type validation
  validateContentType(req) {
    const contentType = req.headers['content-type'];
    if (!contentType) {
      throw new ValidationError('Content-Type header is required', 'content-type', 'missing_content_type');
    }

    const mimeType = contentType.split(';')[0].trim().toLowerCase();
    if (!this.options.allowedMimeTypes.includes(mimeType)) {
      throw new ValidationError(
        `Unsupported Content-Type: ${mimeType}`,
        'content-type',
        'unsupported_media_type'
      );
    }
  }

  // Deep object validation with security checks
  validateObject(obj, path = '', depth = 0) {
    if (depth > this.options.maxDepth) {
      throw new ValidationError(
        `Object nesting too deep (max: ${this.options.maxDepth})`,
        path,
        'max_depth_exceeded'
      );
    }

    if (obj === null || obj === undefined) {
      return; // null/undefined are valid
    }

    if (Array.isArray(obj)) {
      if (obj.length > this.options.maxArrayLength) {
        throw new ValidationError(
          `Array too long (max: ${this.options.maxArrayLength})`,
          path,
          'max_array_length_exceeded'
        );
      }

      obj.forEach((item, index) => {
        this.validateObject(item, `${path}[${index}]`, depth + 1);
      });
      return;
    }

    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length > this.options.maxKeys) {
        throw new ValidationError(
          `Too many object keys (max: ${this.options.maxKeys})`,
          path,
          'max_keys_exceeded'
        );
      }

      // Check for prototype pollution attempts
      if (keys.includes('__proto__') || keys.includes('constructor') || keys.includes('prototype')) {
        throw new ValidationError(
          'Potentially dangerous object key detected',
          path,
          'dangerous_key'
        );
      }

      keys.forEach(key => {
        // Validate key name
        if (typeof key !== 'string' || key.length > 100) {
          throw new ValidationError(
            'Invalid object key',
            `${path}.${key}`,
            'invalid_key'
          );
        }

        this.validateObject(obj[key], path ? `${path}.${key}` : key, depth + 1);
      });
      return;
    }

    if (typeof obj === 'string') {
      if (obj.length > this.options.maxStringLength) {
        throw new ValidationError(
          `String too long (max: ${this.options.maxStringLength})`,
          path,
          'max_string_length_exceeded'
        );
      }

      // Check for potential XSS patterns
      if (this.containsSuspiciousPatterns(obj)) {
        this.logger.warn('Suspicious string pattern detected', {
          path,
          length: obj.length,
          sample: obj.substring(0, 100)
        });
      }
    }

    // Numbers, booleans are inherently safe
  }

  containsSuspiciousPatterns(str) {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /eval\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(str));
  }

  // Schema validation for specific endpoints
  validateSchema(obj, schema, path = '') {
    if (schema.type) {
      const actualType = Array.isArray(obj) ? 'array' : typeof obj;
      if (actualType !== schema.type && !(schema.type === 'object' && obj === null && schema.nullable)) {
        throw new ValidationError(
          `Expected ${schema.type}, got ${actualType}`,
          path,
          'type_mismatch'
        );
      }
    }

    if (schema.required && (obj === null || obj === undefined)) {
      throw new ValidationError(
        'Required field is missing',
        path,
        'required_field_missing'
      );
    }

    if (schema.enum && !schema.enum.includes(obj)) {
      throw new ValidationError(
        `Value must be one of: ${schema.enum.join(', ')}`,
        path,
        'invalid_enum_value'
      );
    }

    if (schema.pattern && typeof obj === 'string' && !new RegExp(schema.pattern).test(obj)) {
      throw new ValidationError(
        'String does not match required pattern',
        path,
        'pattern_mismatch'
      );
    }

    if (schema.properties && typeof obj === 'object' && obj !== null) {
      // Check for unknown properties
      if (schema.additionalProperties === false) {
        const allowedKeys = Object.keys(schema.properties);
        const actualKeys = Object.keys(obj);
        const unknownKeys = actualKeys.filter(key => !allowedKeys.includes(key));
        if (unknownKeys.length > 0) {
          throw new ValidationError(
            `Unknown properties: ${unknownKeys.join(', ')}`,
            path,
            'unknown_properties'
          );
        }
      }

      // Validate each property
      Object.entries(schema.properties).forEach(([key, subSchema]) => {
        const fieldPath = path ? `${path}.${key}` : key;
        this.validateSchema(obj[key], subSchema, fieldPath);
      });
    }

    if (schema.items && Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this.validateSchema(item, schema.items, `${path}[${index}]`);
      });
    }
  }

  // Express middleware factory
  middleware(schema = null) {
    return (req, res, next) => {
      try {
        // Skip validation for GET requests and OPTIONS
        if (req.method === 'GET' || req.method === 'OPTIONS') {
          return next();
        }

        // Validate Content-Type
        this.validateContentType(req);

        // If body exists, validate it
        if (req.body !== undefined) {
          this.validateObject(req.body);

          if (schema) {
            this.validateSchema(req.body, schema);
          }

          this.logger.debug('Request validation passed', {
            method: req.method,
            path: req.url,
            bodySize: JSON.stringify(req.body).length,
            request_id: req.id
          });
        }

        next();
      } catch (error) {
        if (error instanceof ValidationError) {
          this.logger.warn('Validation failed', {
            error: error.message,
            field: error.field,
            code: error.code,
            method: req.method,
            path: req.url,
            request_id: req.id
          });

          res.writeHead(error.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: error.code,
            message: error.message,
            field: error.field,
            timestamp: new Date().toISOString(),
            request_id: req.id
          }));
        } else {
          next(error);
        }
      }
    };
  }
}

// Predefined schemas for common endpoints
const SIGN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    payload: {
      // Allow any JSON-serializable payload
      required: true
    },
    headers: {
      type: 'object',
      additionalProperties: false,
      properties: {
        kid: {
          type: 'string',
          pattern: '^[A-Za-z0-9_-]{16,128}$'
        },
        tsr: {
          type: 'boolean'
        },
        require_tsr: {
          type: 'boolean'
        }
      }
    }
  }
};

// Export middleware factory and schemas
function createValidationMiddleware(options = {}) {
  return new ValidationMiddleware(options);
}

module.exports = {
  ValidationError,
  ValidationMiddleware,
  createValidationMiddleware,
  schemas: {
    SIGN_SCHEMA
  }
};