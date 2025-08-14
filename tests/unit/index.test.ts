/**
 * Unit tests for main application functions
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { app } from '../../src/app.js';

describe('Main Application Functions', () => {
  let originalEnv: typeof process.env;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
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

  describe('Shutdown Functions', () => {
    it('should export gracefulShutdown function', async () => {
      const { gracefulShutdown } = await import('../../src/index.js');
      expect(gracefulShutdown).toBeDefined();
      expect(typeof gracefulShutdown).toBe('function');
    });

    it('should export exitProcess function', async () => {
      const { exitProcess } = await import('../../src/index.js');
      expect(exitProcess).toBeDefined();
      expect(typeof exitProcess).toBe('function');
    });
  });
});
