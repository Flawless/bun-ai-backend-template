import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { makeRequest, setupTestEnv, createTestApp, measureResponseTime } from '../test-utils';
import type { Elysia } from 'elysia';

/**
 * Integration Tests for API Endpoints
 * Focus: Multiple components working together, request/response flows
 * Coverage: 45-50% of total test suite (Testing Trophy emphasis)
 *
 * "Write tests. Not too many. Mostly integration." - Kent C. Dodds
 */

describe('API Integration Tests', () => {
  let app: Elysia;

  beforeAll(async () => {
    setupTestEnv();
    app = await createTestApp();
  });

  afterAll(() => {
    // Cleanup resources if needed
  });

  describe('Application Flow', () => {
    test('should handle complete request-response cycle for root endpoint', async () => {
      const response = await makeRequest(app, 'GET', '/');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('documentation');
      expect(data).toHaveProperty('timestamp');
      expect(data.message).toContain('TypeScript Backend Template');
    });

    test('should maintain consistent response format across endpoints', async () => {
      const rootResponse = await makeRequest(app, 'GET', '/');
      const healthResponse = await makeRequest(app, 'GET', '/health');

      const rootData = await rootResponse.json();
      const healthData = await healthResponse.json();

      // Both should have timestamps
      expect(rootData).toHaveProperty('timestamp');
      expect(healthData).toHaveProperty('timestamp');

      // Both should return valid JSON
      expect(typeof rootData).toBe('object');
      expect(typeof healthData).toBe('object');
    });

    test('should handle sequential requests correctly', async () => {
      const endpoints = ['/', '/health', '/non-existent'];
      const expectedStatuses = [200, 200, 404];

      for (let i = 0; i < endpoints.length; i++) {
        const response = await makeRequest(app, 'GET', endpoints[i]);
        expect(response.status).toBe(expectedStatuses[i]);
      }
    });
  });

  describe('Performance and Reliability', () => {
    test('should respond to health checks within acceptable time', async () => {
      const responseTime = await measureResponseTime(async () => {
        await makeRequest(app, 'GET', '/health');
      });

      // Should respond within 100ms for health checks
      expect(responseTime).toBeLessThan(100);
    });

    test('should handle concurrent requests without issues', async () => {
      const concurrentRequests = 20;
      const promises = Array.from({ length: concurrentRequests }, () =>
        makeRequest(app, 'GET', '/health')
      );

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Should maintain response structure under load
      const data = await responses[0].json();
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('ok');
    });

    test('should maintain state consistency across requests', async () => {
      // Make multiple requests and verify state doesn't leak
      const responses = await Promise.all([
        makeRequest(app, 'GET', '/health'),
        makeRequest(app, 'GET', '/'),
        makeRequest(app, 'GET', '/health'),
      ]);

      const healthData1 = await responses[0].json();
      const healthData2 = await responses[2].json();

      // Environment should remain consistent
      expect(healthData1.environment).toBe(healthData2.environment);
      expect(healthData1.status).toBe(healthData2.status);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle error propagation correctly', async () => {
      const response = await makeRequest(app, 'POST', '/non-existent');
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe('Not Found');
      expect(data.message).toBe('The requested endpoint does not exist');
    });

    test('should maintain proper content-type headers across error scenarios', async () => {
      const errorRoutes = ['/404', '/invalid', '/missing'];

      for (const route of errorRoutes) {
        const response = await makeRequest(app, 'GET', route);
        expect(response.headers.get('content-type')).toContain('application/json');
      }
    });
  });

  describe('Cross-cutting Concerns', () => {
    test('should handle different HTTP methods appropriately', async () => {
      // Valid endpoints should work with GET
      const getResponse = await makeRequest(app, 'GET', '/health');
      expect(getResponse.status).toBe(200);

      // Invalid methods on existing endpoints should still route to 404
      const postResponse = await makeRequest(app, 'POST', '/health');
      expect(postResponse.status).toBe(404);
    });

    test('should provide consistent timestamp format across all endpoints', async () => {
      const endpoints = ['/', '/health', '/non-existent'];
      const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

      for (const endpoint of endpoints) {
        const response = await makeRequest(app, 'GET', endpoint);
        const data = await response.json();

        expect(data.timestamp).toMatch(timestampRegex);
      }
    });
  });

  describe('Environment Integration', () => {
    test('should reflect test environment in responses', async () => {
      const response = await makeRequest(app, 'GET', '/health');
      const data = await response.json();

      expect(data.environment).toBe('test');
    });

    test('should handle environment variables correctly', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Re-import to get fresh instance with new env
      const { app: prodApp } = await import('../../src/index');
      const response = await makeRequest(prodApp, 'GET', '/health');
      const data = await response.json();

      expect(data.environment).toBe('production');

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});
