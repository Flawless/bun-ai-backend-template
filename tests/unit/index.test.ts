/**
 * Unit tests for main application functions
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import type { MockedFunction } from 'bun:test';
import { handleShutdown, startServer, app } from '../../src/index.js';

// Mock the observability module
const mockShutdownOTel = mock(() => Promise.resolve());
mock.module('../../src/observability.js', () => ({
  initializeOTel: mock(() => ({})),
  shutdownOTel: mockShutdownOTel,
}));

// Mock the logger module
const mockLogger = {
  info: mock(() => {
    // Mock logger info method
  }),
  error: mock(() => {
    // Mock logger error method
  }),
  warn: mock(() => {
    // Mock logger warn method
  }),
  debug: mock(() => {
    // Mock logger debug method
  }),
};

const mockCreateChildLogger = mock(() => mockLogger);

mock.module('../../src/logger.js', () => ({
  logger: mockLogger,
  createChildLogger: mockCreateChildLogger,
}));

describe('Main Application Functions', () => {
  let originalEnv: typeof process.env;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Reset all mocks
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();
    mockCreateChildLogger.mockClear();
    mockShutdownOTel.mockClear();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('handleShutdown', () => {
    it('should log shutdown message for SIGTERM', async () => {
      await handleShutdown('SIGTERM');

      expect(mockLogger.info).toHaveBeenCalledWith('SIGTERM received, shutting down gracefully');
      expect(mockShutdownOTel).toHaveBeenCalledTimes(1);
    });

    it('should log shutdown message for SIGINT', async () => {
      await handleShutdown('SIGINT');

      expect(mockLogger.info).toHaveBeenCalledWith('SIGINT received, shutting down gracefully');
      expect(mockShutdownOTel).toHaveBeenCalledTimes(1);
    });

    it('should handle custom signal names', async () => {
      await handleShutdown('CUSTOM_SIGNAL');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'CUSTOM_SIGNAL received, shutting down gracefully'
      );
      expect(mockShutdownOTel).toHaveBeenCalledTimes(1);
    });

    it('should handle OpenTelemetry shutdown errors gracefully', async () => {
      const error = new Error('Shutdown failed');
      mockShutdownOTel.mockRejectedValueOnce(error);

      await expect(handleShutdown('SIGTERM')).rejects.toThrow('Shutdown failed');
      expect(mockLogger.info).toHaveBeenCalledWith('SIGTERM received, shutting down gracefully');
    });
  });

  describe('startServer', () => {
    let mockAppListen: MockedFunction<(port: number) => void>;

    beforeEach(() => {
      mockAppListen = mock(() => {
        // Mock app.listen method
      });
      app.listen = mockAppListen;
    });

    it('should start server with default environment variables', () => {
      // Clear environment variables that might affect the test
      delete process.env.NODE_ENV;
      delete process.env.OTEL_TRACING_ENABLED;
      delete process.env.OTEL_SERVICE_NAME;
      delete process.env.npm_package_name;

      startServer(3000);

      expect(mockAppListen).toHaveBeenCalledWith(3000);
      expect(mockLogger.info).toHaveBeenCalledWith(
        {
          port: 3000,
          environment: 'development',
          tracing_enabled: true,
          service_name: 'ts-backend-template',
        },
        'Server starting'
      );
    });

    it('should start server with production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.OTEL_TRACING_ENABLED = 'true';
      process.env.OTEL_SERVICE_NAME = 'my-service';

      startServer(8080);

      expect(mockAppListen).toHaveBeenCalledWith(8080);
      expect(mockLogger.info).toHaveBeenCalledWith(
        {
          port: 8080,
          environment: 'production',
          tracing_enabled: true,
          service_name: 'my-service',
        },
        'Server starting'
      );
    });

    it('should handle tracing disabled', () => {
      delete process.env.NODE_ENV;
      process.env.OTEL_TRACING_ENABLED = 'false';
      process.env.npm_package_name = 'test-package';

      startServer(4000);

      expect(mockAppListen).toHaveBeenCalledWith(4000);
      expect(mockLogger.info).toHaveBeenCalledWith(
        {
          port: 4000,
          environment: 'development',
          tracing_enabled: false,
          service_name: 'test-package',
        },
        'Server starting'
      );
    });

    it('should handle custom port numbers', () => {
      startServer(9999);

      expect(mockAppListen).toHaveBeenCalledWith(9999);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 9999,
        }),
        'Server starting'
      );
    });

    it('should use npm_package_name over default service name', () => {
      process.env.npm_package_name = 'custom-package';
      delete process.env.OTEL_SERVICE_NAME;

      startServer(3000);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          service_name: 'custom-package',
        }),
        'Server starting'
      );
    });

    it('should prioritize OTEL_SERVICE_NAME over npm_package_name', () => {
      process.env.OTEL_SERVICE_NAME = 'otel-service';
      process.env.npm_package_name = 'npm-package';

      startServer(3000);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          service_name: 'otel-service',
        }),
        'Server starting'
      );
    });
  });

  describe('Application Health', () => {
    it('should export app instance', () => {
      expect(app).toBeDefined();
      expect(typeof app.listen).toBe('function');
    });

    it('should handle health endpoint', async () => {
      const response = await app
        .handle(new Request('http://localhost/health'))
        .then((res) => res.json());

      expect(response).toMatchObject({
        status: 'ok',
        environment: expect.any(String),
        version: expect.any(String),
      });
      expect(response.timestamp).toBeDefined();
      expect(response.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should handle readiness endpoint', async () => {
      const response = await app
        .handle(new Request('http://localhost/ready'))
        .then((res) => res.json());

      expect(response).toMatchObject({
        status: 'ready',
        latency: 0,
        dependencies: {
          database: {
            status: 'healthy',
            latency: 0,
            endpoint: 'database:5432',
          },
          email: {
            status: 'healthy',
            latency: 0,
            endpoint: 'smtp.service.com:587',
          },
        },
      });
      expect(response.timestamp).toBeDefined();
    });

    it('should handle root endpoint', async () => {
      const response = await app.handle(new Request('http://localhost/')).then((res) => res.json());

      expect(response).toMatchObject({
        message: 'Welcome to the TypeScript Backend Template',
        documentation: '/health for health checks, /ready for readiness checks',
      });
      expect(response.timestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const response = await app.handle(new Request('http://localhost/nonexistent'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toMatchObject({
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
      });
      expect(data.timestamp).toBeDefined();
    });
  });
});
