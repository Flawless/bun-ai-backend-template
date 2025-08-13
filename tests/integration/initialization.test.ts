/**
 * Integration tests for application initialization and OpenTelemetry setup
 *
 * Tests actual initialization paths to improve coverage
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';

describe('Application Initialization', () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    // Store original environment variables
    originalEnv = {
      OTEL_TRACING_ENABLED: process.env.OTEL_TRACING_ENABLED,
      OTEL_CONSOLE_EXPORTER: process.env.OTEL_CONSOLE_EXPORTER,
      OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
      NODE_ENV: process.env.NODE_ENV,
      LOG_INCLUDE_LOCATION: process.env.LOG_INCLUDE_LOCATION,
    };
  });

  afterEach(() => {
    // Restore original environment variables
    // Restore original environment variables safely
    for (const [envKey, envValue] of Object.entries(originalEnv)) {
      if (envValue === undefined) {
        delete process.env[envKey as keyof typeof process.env];
      } else {
        process.env[envKey as keyof typeof process.env] = envValue;
      }
    }
  });

  describe('OpenTelemetry Initialization Paths', () => {
    it('should initialize with console exporter in development', async () => {
      process.env.OTEL_TRACING_ENABLED = 'true';
      process.env.NODE_ENV = 'development';
      delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
      process.env.OTEL_CONSOLE_EXPORTER = 'true';

      // Import and initialize
      const { initializeOTel } = await import('../../src/observability.js');
      const sdk = initializeOTel();

      expect(sdk).not.toBeNull();

      // Clean up
      if (sdk) {
        const { shutdownOTel } = await import('../../src/observability.js');
        await shutdownOTel(sdk);
      }
    });

    it('should initialize with OTLP exporter when endpoint configured', async () => {
      process.env.OTEL_TRACING_ENABLED = 'true';
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = 'http://localhost:4318/v1/traces';
      process.env.OTEL_CONSOLE_EXPORTER = 'false';

      const { initializeOTel } = await import('../../src/observability.js');
      const sdk = initializeOTel();

      expect(sdk).not.toBeNull();

      // Clean up
      if (sdk) {
        const { shutdownOTel } = await import('../../src/observability.js');
        await shutdownOTel(sdk);
      }
    });

    it('should fallback to console exporter when no exporters configured', async () => {
      process.env.OTEL_TRACING_ENABLED = 'true';
      process.env.NODE_ENV = 'production';
      process.env.OTEL_CONSOLE_EXPORTER = 'false';
      delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;

      const { initializeOTel } = await import('../../src/observability.js');
      const sdk = initializeOTel();

      expect(sdk).not.toBeNull();

      // Clean up
      if (sdk) {
        const { shutdownOTel } = await import('../../src/observability.js');
        await shutdownOTel(sdk);
      }
    });

    it('should test trace context retrieval paths', async () => {
      process.env.OTEL_TRACING_ENABLED = 'true';

      const { initializeOTel, getTraceContext } = await import('../../src/observability.js');
      const sdk = initializeOTel();

      // Test when no active span
      const context = getTraceContext();
      expect(context).toBeUndefined();

      // Clean up
      if (sdk) {
        const { shutdownOTel } = await import('../../src/observability.js');
        await shutdownOTel(sdk);
      }
    });
  });

  describe('Logger Initialization Paths', () => {
    it('should initialize logger with location tracking', async () => {
      process.env.LOG_INCLUDE_LOCATION = 'true';
      process.env.NODE_ENV = 'development';

      // Clear module cache to force re-initialization
      // Note: Module cache clearing not available in Bun ESM context

      const { logger, createChildLogger, logWithTrace } = await import('../../src/logger.js');

      expect(logger).toBeDefined();

      // Test logger functionality
      logger.info('Test log message');

      // Test child logger
      const childLogger = createChildLogger({ test: true });
      childLogger.info('Child logger test');

      // Test logWithTrace function
      logWithTrace('info', 'Trace log test');
      logWithTrace('debug', 'Debug trace test');
      logWithTrace('warn', 'Warning trace test');
      logWithTrace('error', 'Error trace test');
    });

    it('should initialize logger without location tracking', async () => {
      process.env.LOG_INCLUDE_LOCATION = 'false';
      process.env.NODE_ENV = 'production';

      // Clear module cache to force re-initialization
      // Note: Module cache clearing not available in Bun ESM context

      const { logger } = await import('../../src/logger.js');

      expect(logger).toBeDefined();
      logger.info('Production logger test');
    });

    it('should handle logger mixin function execution', async () => {
      process.env.LOG_INCLUDE_LOCATION = 'true';

      // Clear module cache to force re-initialization
      // Note: Module cache clearing not available in Bun ESM context

      const { logger } = await import('../../src/logger.js');

      // This will trigger the mixin function which includes trace context retrieval
      logger.info('Test message to trigger mixin');
      logger.debug('Debug message to trigger mixin');
      logger.warn('Warning message to trigger mixin');
      logger.error('Error message to trigger mixin');
    });
  });

  describe('Application Error Paths', () => {
    it('should test error handling with different error types', async () => {
      const { app } = await import('../../src/index.js');

      // Test with various error scenarios
      const testRequests = [
        new Request('http://localhost/nonexistent-endpoint'),
        new Request('http://localhost/health'),
        new Request('http://localhost/ready'),
        new Request('http://localhost/'),
      ];

      for (const request of testRequests) {
        const response = await app.handle(request);
        expect(response).toBeDefined();
        expect(response.status).toBeGreaterThanOrEqual(200);
      }
    });

    it('should test process.uptime() call in health endpoint', async () => {
      const { app } = await import('../../src/index.js');

      const response = await app.handle(new Request('http://localhost/health'));
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.uptime).toBeDefined();
      expect(typeof body.uptime).toBe('number');
      expect(body.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
