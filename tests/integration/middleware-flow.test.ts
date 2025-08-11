import { describe, test, expect, beforeAll } from 'bun:test';
import { makeRequest, setupTestEnv, createTestApp } from '../test-utils';
import type { Elysia } from 'elysia';

/**
 * Integration Tests for Middleware Flow
 * Focus: Request/response middleware chain, error handling integration
 * Coverage: Part of 45-50% integration test allocation (Testing Trophy)
 */

describe('Middleware Flow Integration Tests', () => {
  let app: Elysia;

  beforeAll(async () => {
    setupTestEnv();
    app = await createTestApp();
  });

  describe('Request Processing Pipeline', () => {
    test('should process requests through complete middleware stack', async () => {
      const response = await makeRequest(app, 'GET', '/health');

      // Verify request went through middleware chain
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const data = await response.json();
      expect(data).toHaveProperty('status');
    });

    test('should handle middleware errors gracefully', async () => {
      // Test with invalid JSON in request body (should not crash app)
      const response = await makeRequest(app, 'POST', '/health', 'invalid-json');

      // Should still handle the request (even though endpoint returns 404)
      expect(response.status).toBe(404);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    test('should maintain request context through middleware chain', async () => {
      const response = await makeRequest(app, 'GET', '/health');
      const data = await response.json();

      // Verify context is maintained (timestamp should be recent)
      const timestamp = new Date(data.timestamp);
      const now = new Date();
      const timeDiff = now.getTime() - timestamp.getTime();

      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });
  });

  describe('Error Middleware Integration', () => {
    test('should integrate error handling with routing', async () => {
      const response = await makeRequest(app, 'GET', '/non-existent');

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe('Not Found');
      expect(data.message).toBe('The requested endpoint does not exist');
      expect(data).toHaveProperty('timestamp');
    });

    test('should handle different error types consistently', async () => {
      const errorScenarios = [
        { path: '/404-route', expectedStatus: 404 },
        { path: '/another-missing', expectedStatus: 404 },
      ];

      for (const scenario of errorScenarios) {
        const response = await makeRequest(app, 'GET', scenario.path);
        expect(response.status).toBe(scenario.expectedStatus);

        const data = await response.json();
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('message');
        expect(data).toHaveProperty('timestamp');
      }
    });
  });

  describe('Response Middleware Integration', () => {
    test('should apply response formatting consistently', async () => {
      const endpoints = ['/', '/health'];

      for (const endpoint of endpoints) {
        const response = await makeRequest(app, 'GET', endpoint);

        // All responses should be JSON
        expect(response.headers.get('content-type')).toContain('application/json');

        // All responses should parse as valid JSON
        const data = await response.json();
        expect(typeof data).toBe('object');
        expect(data).toHaveProperty('timestamp');
      }
    });

    test('should maintain response headers across different routes', async () => {
      const validResponse = await makeRequest(app, 'GET', '/health');
      const errorResponse = await makeRequest(app, 'GET', '/non-existent');

      // Both should have JSON content type
      expect(validResponse.headers.get('content-type')).toContain('application/json');
      expect(errorResponse.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Request Method Handling', () => {
    test('should route different methods through appropriate handlers', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE'] as const;

      // Test valid endpoint
      const healthGetResponse = await makeRequest(app, 'GET', '/health');
      expect(healthGetResponse.status).toBe(200);

      // Test other methods on existing endpoint (should 404 as they're not defined)
      for (const method of methods.slice(1)) {
        const response = await makeRequest(app, method, '/health');
        expect(response.status).toBe(404);
      }
    });

    test('should handle method-specific routing correctly', async () => {
      // GET should work for defined routes
      const getRoot = await makeRequest(app, 'GET', '/');
      const getHealth = await makeRequest(app, 'GET', '/health');

      expect(getRoot.status).toBe(200);
      expect(getHealth.status).toBe(200);

      // POST should go to 404 handler for undefined routes
      const postRoot = await makeRequest(app, 'POST', '/');
      const postHealth = await makeRequest(app, 'POST', '/health');

      expect(postRoot.status).toBe(404);
      expect(postHealth.status).toBe(404);
    });
  });

  describe('Content Type Handling', () => {
    test('should handle JSON request bodies appropriately', async () => {
      const validJson = { test: 'data' };
      const response = await makeRequest(app, 'POST', '/test-endpoint', validJson);

      // Should still process request even if endpoint doesn't exist
      expect(response.status).toBe(404);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    test('should maintain content-type consistency', async () => {
      const responses = await Promise.all([
        makeRequest(app, 'GET', '/health'),
        makeRequest(app, 'GET', '/'),
        makeRequest(app, 'GET', '/non-existent'),
      ]);

      responses.forEach((response) => {
        expect(response.headers.get('content-type')).toContain('application/json');
      });
    });
  });
});
