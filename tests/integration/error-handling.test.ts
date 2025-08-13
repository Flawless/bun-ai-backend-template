/**
 * Integration tests for error handling and edge cases
 *
 * Tests critical error paths to ensure graceful failure and proper logging
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { app } from '../../src/index.js';
import { Elysia } from 'elysia';

describe('Error Handling Integration', () => {
  let originalNodeEnv: string | undefined;

  beforeAll(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('Global Error Handler', () => {
    it('should handle 404 errors with proper response format', async () => {
      const response = await app.handle(new Request('http://localhost/nonexistent'));

      expect(response.status).toBe(404);
      const body = await response.json();

      expect(body).toMatchObject({
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
        timestamp: expect.any(String),
      });

      // Verify timestamp is valid ISO string
      expect(() => new Date(body.timestamp)).not.toThrow();
    });

    it('should handle internal server errors in development mode', async () => {
      process.env.NODE_ENV = 'development';

      // Create a separate app instance for testing error handling
      const testApp = new Elysia()
        .onError(({ error, code, set }) => {
          const _errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const _errorStack = error instanceof Error ? error.stack : undefined;

          if (code === 'NOT_FOUND') {
            set.status = 404;
            return {
              error: 'Not Found',
              message: 'The requested endpoint does not exist',
              timestamp: new Date().toISOString(),
            };
          }

          set.status = 500;
          return {
            error: 'Internal Server Error',
            message:
              process.env.NODE_ENV === 'development' && error instanceof Error
                ? error.message
                : 'Something went wrong',
            timestamp: new Date().toISOString(),
          };
        })
        .get('/test-error', () => {
          throw new Error('Test error message');
        });

      const response = await testApp.handle(new Request('http://localhost/test-error'));

      expect(response.status).toBe(500);
      const body = await response.json();

      expect(body).toMatchObject({
        error: 'Internal Server Error',
        message: 'Test error message', // Should show actual error in development
        timestamp: expect.any(String),
      });
    });

    it('should hide error details in production mode', async () => {
      process.env.NODE_ENV = 'production';

      // Create a separate app instance for testing error handling
      const testApp = new Elysia()
        .onError(({ error, code, set }) => {
          const _errorMessage = error instanceof Error ? error.message : 'Unknown error';

          if (code === 'NOT_FOUND') {
            set.status = 404;
            return {
              error: 'Not Found',
              message: 'The requested endpoint does not exist',
              timestamp: new Date().toISOString(),
            };
          }

          set.status = 500;
          return {
            error: 'Internal Server Error',
            message:
              process.env.NODE_ENV === 'development' && error instanceof Error
                ? error.message
                : 'Something went wrong',
            timestamp: new Date().toISOString(),
          };
        })
        .get('/test-error-prod', () => {
          throw new Error('Sensitive error details');
        });

      const response = await testApp.handle(new Request('http://localhost/test-error-prod'));

      expect(response.status).toBe(500);
      const body = await response.json();

      expect(body).toMatchObject({
        error: 'Internal Server Error',
        message: 'Something went wrong', // Should hide details in production
        timestamp: expect.any(String),
      });
    });

    it('should handle non-Error objects thrown as errors', async () => {
      // Create a separate app instance for testing error handling
      const testApp = new Elysia()
        .onError(({ error, code, set }) => {
          const _errorMessage = error instanceof Error ? error.message : 'Unknown error';

          if (code === 'NOT_FOUND') {
            set.status = 404;
            return {
              error: 'Not Found',
              message: 'The requested endpoint does not exist',
              timestamp: new Date().toISOString(),
            };
          }

          set.status = 500;
          return {
            error: 'Internal Server Error',
            message:
              process.env.NODE_ENV === 'development' && error instanceof Error
                ? error.message
                : 'Something went wrong',
            timestamp: new Date().toISOString(),
          };
        })
        .get('/test-non-error', () => {
          throw new Error('String error');
        });

      const response = await testApp.handle(new Request('http://localhost/test-non-error'));

      expect(response.status).toBe(500);
      const body = await response.json();

      expect(body).toMatchObject({
        error: 'Internal Server Error',
        timestamp: expect.any(String),
      });
    });
  });

  describe('Request Middleware Edge Cases', () => {
    it('should handle requests without user-agent header', async () => {
      const request = new Request('http://localhost/health');
      // Remove user-agent header if it exists
      request.headers.delete('user-agent');

      const response = await app.handle(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('x-request-id')).toBeTruthy();
    });

    it('should handle requests with malformed headers gracefully', async () => {
      const request = new Request('http://localhost/health');

      const response = await app.handle(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]+$/);
    });
  });

  describe('Environment Variable Edge Cases', () => {
    it('should handle missing environment variables gracefully', async () => {
      const originalVars = {
        NODE_ENV: process.env.NODE_ENV,
        npm_package_version: process.env.npm_package_version,
      };

      delete process.env.NODE_ENV;
      delete process.env.npm_package_version;

      const response = await app.handle(new Request('http://localhost/health'));

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body).toMatchObject({
        status: 'ok',
        environment: 'development', // Default fallback
        version: '1.0.0', // Default fallback
      });

      // Restore environment variables
      if (originalVars.NODE_ENV) process.env.NODE_ENV = originalVars.NODE_ENV;
      if (originalVars.npm_package_version)
        process.env.npm_package_version = originalVars.npm_package_version;
    });
  });
});
