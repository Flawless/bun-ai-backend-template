/**
 * Unit tests for observability error handling and edge cases
 *
 * Tests OpenTelemetry initialization errors, cleanup procedures, and trace context edge cases
 */

import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';

describe('Observability Unit Tests', () => {
  let originalEnv: Record<string, string | undefined>;
  let consoleLogSpy: ReturnType<typeof spyOn>;
  let consoleWarnSpy: ReturnType<typeof spyOn>;
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Store original environment variables
    originalEnv = {
      OTEL_TRACING_ENABLED: process.env.OTEL_TRACING_ENABLED,
      OTEL_SERVICE_NAME: process.env.OTEL_SERVICE_NAME,
      OTEL_SERVICE_VERSION: process.env.OTEL_SERVICE_VERSION,
      OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
      OTEL_CONSOLE_EXPORTER: process.env.OTEL_CONSOLE_EXPORTER,
      NODE_ENV: process.env.NODE_ENV,
      npm_package_name: process.env.npm_package_name,
      npm_package_version: process.env.npm_package_version,
    };

    // Mock console methods to avoid spam during tests
    consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {
      /* no-op */
    });
    consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {
      /* no-op */
    });
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {
      /* no-op */
    });
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

    // Restore console methods
    consoleLogSpy?.mockRestore();
    consoleWarnSpy?.mockRestore();
    consoleErrorSpy?.mockRestore();

    // Clear module cache to ensure fresh imports
    // Note: Module cache clearing not available in Bun ESM context
  });

  describe('OpenTelemetry Initialization', () => {
    it('should return null when tracing is disabled', async () => {
      process.env.OTEL_TRACING_ENABLED = 'false';

      const { initializeOTel } = await import('../../src/observability.js');
      const sdk = initializeOTel();

      expect(sdk).toBeNull();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'OpenTelemetry tracing disabled via OTEL_TRACING_ENABLED=false'
      );
    });

    it('should use console exporter when no exporters are configured', async () => {
      process.env.OTEL_TRACING_ENABLED = 'true';
      delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
      process.env.OTEL_CONSOLE_EXPORTER = 'false';
      process.env.NODE_ENV = 'production';

      const { initializeOTel } = await import('../../src/observability.js');
      const sdk = initializeOTel();

      expect(sdk).not.toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'No OpenTelemetry exporters configured, falling back to console exporter'
      );
    });

    it('should add OTLP exporter when endpoint is configured', async () => {
      process.env.OTEL_TRACING_ENABLED = 'true';
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = 'http://localhost:4318/v1/traces';
      process.env.OTEL_CONSOLE_EXPORTER = 'false';

      const { initializeOTel } = await import('../../src/observability.js');
      const sdk = initializeOTel();

      expect(sdk).not.toBeNull();
    });

    it('should handle SDK initialization errors gracefully', async () => {
      process.env.OTEL_TRACING_ENABLED = 'true';

      // Mock NodeSDK to throw error during start
      const { NodeSDK } = await import('@opentelemetry/sdk-node');
      const originalStart = NodeSDK.prototype.start;
      NodeSDK.prototype.start = function () {
        throw new Error('SDK initialization failed');
      };

      try {
        const { initializeOTel } = await import('../../src/observability.js');
        const sdk = initializeOTel();

        expect(sdk).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to initialize OpenTelemetry:',
          expect.any(Error)
        );
      } finally {
        // Restore original start method
        NodeSDK.prototype.start = originalStart;
      }
    });

    it('should use default service name and version when env vars are missing', async () => {
      process.env.OTEL_TRACING_ENABLED = 'true';
      delete process.env.OTEL_SERVICE_NAME;
      delete process.env.OTEL_SERVICE_VERSION;
      delete process.env.npm_package_name;
      delete process.env.npm_package_version;

      const { initializeOTel } = await import('../../src/observability.js');
      const sdk = initializeOTel();

      expect(sdk).not.toBeNull();
    });

    it('should configure console exporter in development environment', async () => {
      process.env.OTEL_TRACING_ENABLED = 'true';
      process.env.NODE_ENV = 'development';
      delete process.env.OTEL_CONSOLE_EXPORTER;

      const { initializeOTel } = await import('../../src/observability.js');
      const sdk = initializeOTel();

      expect(sdk).not.toBeNull();
    });

    it('should enable console exporter when explicitly set to true', async () => {
      process.env.OTEL_TRACING_ENABLED = 'true';
      process.env.OTEL_CONSOLE_EXPORTER = 'true';
      process.env.NODE_ENV = 'production';

      const { initializeOTel } = await import('../../src/observability.js');
      const sdk = initializeOTel();

      expect(sdk).not.toBeNull();
    });
  });

  describe('OpenTelemetry Shutdown', () => {
    it('should handle null SDK gracefully', async () => {
      const { shutdownOTel } = await import('../../src/observability.js');

      // Should not throw with null SDK
      await expect(shutdownOTel(null)).resolves.toBeUndefined();
    });

    it('should handle SDK shutdown errors gracefully', async () => {
      // Create a mock SDK that throws on shutdown
      const mockSdk = {
        shutdown: () => {
          throw new Error('Shutdown failed');
        },
      } as { shutdown: () => void };

      const { shutdownOTel } = await import('../../src/observability.js');

      // Should not throw even when shutdown fails
      await expect(shutdownOTel(mockSdk)).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error shutting down OpenTelemetry SDK:',
        expect.any(Error)
      );
    });

    it('should handle successful shutdown', async () => {
      // Create a mock SDK that succeeds
      const mockSdk = {
        shutdown: async () => {
          return Promise.resolve();
        },
      } as { shutdown: () => void };

      const { shutdownOTel } = await import('../../src/observability.js');

      await expect(shutdownOTel(mockSdk)).resolves.toBeUndefined();
      expect(consoleLogSpy).toHaveBeenCalledWith('OpenTelemetry SDK shutdown completed');
    });

    it('should handle shutdown promise rejection', async () => {
      // Create a mock SDK that rejects shutdown promise
      const mockSdk = {
        shutdown: async () => {
          return Promise.reject(new Error('Async shutdown failed'));
        },
      } as { shutdown: () => void };

      const { shutdownOTel } = await import('../../src/observability.js');

      await expect(shutdownOTel(mockSdk)).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error shutting down OpenTelemetry SDK:',
        expect.any(Error)
      );
    });
  });

  describe('Trace Context Retrieval', () => {
    it('should return undefined when no active span', async () => {
      // Mock trace.getActiveSpan to return undefined
      const { trace } = await import('@opentelemetry/api');
      const getActiveSpanSpy = spyOn(trace, 'getActiveSpan').mockReturnValue(undefined);

      const { getTraceContext } = await import('../../src/observability.js');
      const context = getTraceContext();

      expect(context).toBeUndefined();

      getActiveSpanSpy.mockRestore();
    });

    it('should return trace context when active span exists', async () => {
      // Mock active span with context
      const mockSpanContext = {
        traceId: 'test-trace-id-123456789abcdef',
        spanId: 'test-span-id-abcdef',
        traceFlags: 1,
        isRemote: false,
      };

      const mockSpan = {
        spanContext: () => mockSpanContext,
      };

      const { trace } = await import('@opentelemetry/api');
      const getActiveSpanSpy = spyOn(trace, 'getActiveSpan').mockReturnValue(
        mockSpan as { spanContext: () => unknown }
      );

      const { getTraceContext } = await import('../../src/observability.js');
      const context = getTraceContext();

      expect(context).toEqual({
        traceId: 'test-trace-id-123456789abcdef',
        spanId: 'test-span-id-abcdef',
      });

      getActiveSpanSpy.mockRestore();
    });

    it('should handle errors in trace context retrieval gracefully', async () => {
      // Mock trace.getActiveSpan to throw error
      const { trace } = await import('@opentelemetry/api');
      const getActiveSpanSpy = spyOn(trace, 'getActiveSpan').mockImplementation(() => {
        throw new Error('Trace API error');
      });

      const { getTraceContext } = await import('../../src/observability.js');
      const context = getTraceContext();

      expect(context).toBeUndefined();

      getActiveSpanSpy.mockRestore();
    });

    it('should handle span context retrieval errors', async () => {
      // Mock span that throws error when getting context
      const mockSpan = {
        spanContext: () => {
          throw new Error('Span context error');
        },
      };

      const { trace } = await import('@opentelemetry/api');
      const getActiveSpanSpy = spyOn(trace, 'getActiveSpan').mockReturnValue(
        mockSpan as { spanContext: () => unknown }
      );

      const { getTraceContext } = await import('../../src/observability.js');
      const context = getTraceContext();

      expect(context).toBeUndefined();

      getActiveSpanSpy.mockRestore();
    });

    it('should handle span with null context', async () => {
      // Mock span that returns null context
      const mockSpan = {
        spanContext: () => null,
      };

      const { trace } = await import('@opentelemetry/api');
      const getActiveSpanSpy = spyOn(trace, 'getActiveSpan').mockReturnValue(
        mockSpan as { spanContext: () => unknown }
      );

      const { getTraceContext } = await import('../../src/observability.js');
      const context = getTraceContext();

      // When spanContext returns null, getTraceContext returns undefined
      expect(context).toBeUndefined();

      getActiveSpanSpy.mockRestore();
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle various NODE_ENV values', async () => {
      process.env.NODE_ENV = 'staging';
      process.env.OTEL_TRACING_ENABLED = 'true';

      const { initializeOTel } = await import('../../src/observability.js');
      const sdk = initializeOTel();

      expect(sdk).not.toBeNull();
    });

    it('should handle missing NODE_ENV', async () => {
      delete process.env.NODE_ENV;
      process.env.OTEL_TRACING_ENABLED = 'true';

      const { initializeOTel } = await import('../../src/observability.js');
      const sdk = initializeOTel();

      expect(sdk).not.toBeNull();
    });

    it('should handle empty string environment variables', async () => {
      process.env.OTEL_SERVICE_NAME = '';
      process.env.OTEL_SERVICE_VERSION = '';
      process.env.OTEL_TRACING_ENABLED = 'true';

      const { initializeOTel } = await import('../../src/observability.js');
      const sdk = initializeOTel();

      expect(sdk).not.toBeNull();
    });

    it('should handle OTEL_TRACING_ENABLED with various values', async () => {
      const testValues = ['true', 'TRUE', '1', 'yes', 'false', 'FALSE', '0', 'no'];

      for (const value of testValues) {
        process.env.OTEL_TRACING_ENABLED = value;

        const { initializeOTel } = await import('../../src/observability.js');
        const sdk = initializeOTel();

        if (value === 'false') {
          expect(sdk).toBeNull();
        } else {
          expect(sdk).not.toBeNull();
        }

        // Clear module cache for next iteration
        // Note: Module cache clearing not available in Bun ESM context
      }
    });
  });
});
