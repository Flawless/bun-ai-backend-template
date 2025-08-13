/**
 * Enhanced Pino Logger with OpenTelemetry Trace Correlation
 *
 * Provides structured logging with automatic trace context injection
 * for correlating logs with distributed traces.
 */

import pino from 'pino';
import { getTraceContext } from './observability.js';

/**
 * Parse filename from full path
 * Exported for testing
 */
export function parseFileName(filePath: string | undefined): string {
  if (!filePath) return 'unknown';
  const fileName = filePath.split('/').pop();
  return fileName || 'unknown';
}

/**
 * Get caller information for debugging
 * Returns file name, function name, and line number
 * Exported for direct testing
 */
export function getCallerInfo(): string | undefined {
  try {
    const stack = new Error().stack;
    if (!stack) return undefined;

    const lines = stack.split('\n');
    // Skip first 3 lines: Error, getCallerInfo, mixin function
    for (let i = 3; i < lines.length; i++) {
      const line = lines.at(i);
      if (line && !line.includes('node_modules') && !line.includes('pino')) {
        // Extract file:line:column from stack trace
        const match = line.match(/\((.+):(\d+):(\d+)\)$/) || line.match(/at (.+):(\d+):(\d+)$/);
        if (match) {
          const [, file, lineNum] = match;
          // Get just the filename, not the full path
          const fileName = parseFileName(file);
          return `${fileName}:${lineNum}`;
        }
      }
    }
  } catch {
    // Silently fail if we can't get caller info
  }
  return undefined;
}

/**
 * Create mixin data with trace context and caller info
 * Exported for direct testing
 */
export function createLogMixin(includeLocation = true): Record<string, unknown> {
  const traceContext = getTraceContext();
  const mixinData: Record<string, unknown> = {};

  // Add trace context if available
  if (traceContext) {
    mixinData.trace_id = traceContext.traceId;
    mixinData.span_id = traceContext.spanId;
  }

  // Add caller location if enabled (useful for debugging)
  if (includeLocation) {
    const caller = getCallerInfo();
    if (caller) {
      mixinData.caller = caller;
    }
  }

  return mixinData;
}

/**
 * Create logger configuration object
 * Exported for testing
 */
export function createLoggerConfig(
  env: {
    NODE_ENV?: string;
    LOG_LEVEL?: string;
    LOG_INCLUDE_LOCATION?: string;
    OTEL_SERVICE_NAME?: string;
    npm_package_name?: string;
    OTEL_SERVICE_VERSION?: string;
    npm_package_version?: string;
  } = process.env
): pino.LoggerOptions {
  const isProduction = env.NODE_ENV === 'production';
  const includeLocation = env.LOG_INCLUDE_LOCATION !== 'false';

  return {
    level: env.LOG_LEVEL || 'info',
    // Enable pretty printing in development
    ...(isProduction
      ? {}
      : {
          transport: {
            target: 'pino-pretty',
            options: {
              // Show caller location in pretty format during development
              include: 'level,time,caller',
              translateTime: 'SYS:standard',
            },
          },
        }),
    // Custom mixin to automatically inject trace context and caller info
    mixin: () => createLogMixin(includeLocation),
    // Format timestamps consistently
    timestamp: pino.stdTimeFunctions.isoTime,
    // Add correlation ID for request tracking
    formatters: {
      level(label) {
        return { level: label };
      },
      bindings(bindings) {
        return {
          pid: bindings.pid,
          hostname: bindings.hostname,
          service: env.OTEL_SERVICE_NAME || env.npm_package_name || 'ts-backend-template',
          version: env.OTEL_SERVICE_VERSION || env.npm_package_version || '1.0.0',
        };
      },
    },
  };
}

/**
 * Create enhanced logger with trace correlation support
 * Exported for testing
 */
export function createLogger(config?: pino.LoggerOptions): pino.Logger {
  const loggerConfig = config || createLoggerConfig();
  return pino(loggerConfig);
}

/**
 * Logger factory with lazy initialization
 * Exported for testing
 */
export class LoggerFactory {
  private _logger: pino.Logger | null = null;
  private _config?: pino.LoggerOptions;

  constructor(config?: pino.LoggerOptions) {
    if (config !== undefined) {
      this._config = config;
    }
  }

  getLogger(): pino.Logger {
    if (!this._logger) {
      this._logger = createLogger(this._config);
    }
    return this._logger;
  }

  reset(): void {
    this._logger = null;
  }
}

// Global factory instance
const globalLoggerFactory = new LoggerFactory();

/**
 * Get the global logger instance with trace correlation
 */
export function getLogger(): pino.Logger {
  return globalLoggerFactory.getLogger();
}

/**
 * Global logger instance with trace correlation
 */
export const logger = getLogger();

/**
 * Create child logger with additional context
 * Useful for adding request-specific context while maintaining trace correlation
 */
export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

/**
 * Log with explicit trace context (useful for async operations)
 */
export function logWithTrace(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  data?: Record<string, unknown>
) {
  const traceContext = getTraceContext();
  const logData = traceContext
    ? { ...data, trace_id: traceContext.traceId, span_id: traceContext.spanId }
    : data;

  // Use bracket notation with proper validation
  switch (level) {
    case 'debug':
      logger.debug(logData, message);
      break;
    case 'info':
      logger.info(logData, message);
      break;
    case 'warn':
      logger.warn(logData, message);
      break;
    case 'error':
      logger.error(logData, message);
      break;
    default:
      logger.info(logData, message);
  }
}
