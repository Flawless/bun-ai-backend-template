import { describe, test, expect, beforeAll } from 'bun:test';
import { makeRequest, setupTestEnv, createTestApp } from '../test-utils';
import type { Elysia } from 'elysia';

/**
 * Unit Tests for Error Handling
 * Focus: Error boundary behavior and 404 handling
 * Coverage: Part of 25-30% unit test allocation (Testing Trophy)
 */

describe('Error Handling Unit Tests', () => {
  let app: Elysia;

  beforeAll(async () => {
    setupTestEnv();
    app = await createTestApp();
  });

  describe('404 Not Found Handler', () => {
    test('should return 404 for non-existent routes', async () => {
      const response = await makeRequest(app, 'GET', '/non-existent');
      expect(response.status).toBe(404);
    });

    test('should return JSON error response', async () => {
      const response = await makeRequest(app, 'GET', '/non-existent');
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('timestamp');
    });

    test('should have consistent 404 error structure', async () => {
      const response = await makeRequest(app, 'GET', '/non-existent');
      const data = await response.json();

      expect(data.error).toBe('Not Found');
      expect(data.message).toBe('The requested endpoint does not exist');
      expect(typeof data.timestamp).toBe('string');
    });

    test('should handle different HTTP methods on non-existent routes', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE'] as const;

      for (const method of methods) {
        const response = await makeRequest(app, method, '/non-existent');
        expect(response.status).toBe(404);

        const data = await response.json();
        expect(data.error).toBe('Not Found');
      }
    });
  });

  describe('Response Headers', () => {
    test('should set correct content-type for 404 responses', async () => {
      const response = await makeRequest(app, 'GET', '/non-existent');
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    test('should include timestamp in 404 responses', async () => {
      const response = await makeRequest(app, 'GET', '/non-existent');
      const data = await response.json();

      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(data.timestamp).getTime()).not.toBeNaN();
    });
  });

  describe('Edge Cases', () => {
    test('should handle routes with special characters', async () => {
      const specialRoutes = ['/test%20space', '/test@symbol', '/test#hash'];

      for (const route of specialRoutes) {
        const response = await makeRequest(app, 'GET', route);
        expect(response.status).toBe(404);
      }
    });

    test('should handle very long route paths', async () => {
      const longPath = `/${'a'.repeat(1000)}`;
      const response = await makeRequest(app, 'GET', longPath);
      expect(response.status).toBe(404);
    });
  });
});
