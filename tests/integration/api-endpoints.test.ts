import { describe, test, expect } from 'bun:test';
import { makeRequest, createTestApp } from '../test-utils';

/**
 * Integration Test Example
 * Testing Trophy: 45-50% of test suite (primary focus)
 */

describe('API Integration Test', () => {
  test('should handle complete request flow', async () => {
    const app = await createTestApp();

    // Test multiple endpoints working together
    const healthResponse = await makeRequest(app, 'GET', '/health');
    const readyResponse = await makeRequest(app, 'GET', '/ready');
    const rootResponse = await makeRequest(app, 'GET', '/');
    const notFoundResponse = await makeRequest(app, 'GET', '/invalid');

    expect(healthResponse.status).toBe(200);
    expect(readyResponse.status).toBe(200);
    expect(rootResponse.status).toBe(200);
    expect(notFoundResponse.status).toBe(404);

    // Verify response formats
    const healthData = await healthResponse.json();
    const readyData = await readyResponse.json();
    const rootData = await rootResponse.json();

    expect(healthData).toHaveProperty('status');
    expect(readyData).toHaveProperty('status');
    expect(readyData).toHaveProperty('dependencies');
    expect(rootData).toHaveProperty('message');
  });
});
