import { describe, test, expect } from 'bun:test';
import { makeRequest, createTestApp } from '../test-utils';

/**
 * Basic End-to-End Tests
 * Focus: Application-level behavior and user journeys
 * Coverage: 10-15% of total test suite (Testing Trophy)
 */

describe('Basic E2E Application Tests', () => {
  describe('User Journey Simulation', () => {
    test('should complete a typical health check journey', async () => {
      const app = await createTestApp();

      // User visits health endpoint
      const healthResponse = await makeRequest(app, 'GET', '/health');
      expect(healthResponse.status).toBe(200);

      const healthData = await healthResponse.json();
      expect(healthData.status).toBe('ok');
    });

    test('should handle complete application workflow', async () => {
      const app = await createTestApp();

      // Simulate user exploring the API
      const rootResponse = await makeRequest(app, 'GET', '/');
      expect(rootResponse.status).toBe(200);

      const rootData = await rootResponse.json();
      expect(rootData.message).toContain('TypeScript Backend Template');

      // User then checks health
      const healthResponse = await makeRequest(app, 'GET', '/health');
      expect(healthResponse.status).toBe(200);

      // User tries invalid endpoint
      const invalidResponse = await makeRequest(app, 'GET', '/invalid');
      expect(invalidResponse.status).toBe(404);
    });
  });

  describe('Application State Consistency', () => {
    test('should maintain consistent behavior across requests', async () => {
      const app = await createTestApp();

      const requests = ['/health', '/', '/health'];
      const responses = [];

      for (const endpoint of requests) {
        const response = await makeRequest(app, 'GET', endpoint);
        responses.push({
          endpoint,
          status: response.status,
          data: await response.json(),
        });
      }

      // Health endpoints should be consistent
      const healthResponses = responses.filter((r) => r.endpoint === '/health');
      expect(healthResponses).toHaveLength(2);

      healthResponses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.data.status).toBe('ok');
      });
    });
  });

  describe('Error Handling Scenarios', () => {
    test('should gracefully handle various error conditions', async () => {
      const app = await createTestApp();

      const errorScenarios = [
        { path: '/404', expectedStatus: 404 },
        { path: '/missing', expectedStatus: 404 },
        { path: '/nonexistent', expectedStatus: 404 },
      ];

      for (const scenario of errorScenarios) {
        const response = await makeRequest(app, 'GET', scenario.path);
        expect(response.status).toBe(scenario.expectedStatus);

        const data = await response.json();
        expect(data.error).toBe('Not Found');
      }
    });
  });
});
