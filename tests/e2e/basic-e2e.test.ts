import { describe, test, expect } from 'bun:test';
import { makeRequest, createTestApp } from '../test-utils';

/**
 * E2E Test Example
 * Testing Trophy: 10-15% of test suite
 */

describe('Basic E2E Test', () => {
  test('should complete user journey', async () => {
    const app = await createTestApp();

    // Simulate complete user flow
    const rootResponse = await makeRequest(app, 'GET', '/');
    const healthResponse = await makeRequest(app, 'GET', '/health');
    const notFoundResponse = await makeRequest(app, 'GET', '/invalid');

    expect(rootResponse.status).toBe(200);
    expect(healthResponse.status).toBe(200);
    expect(notFoundResponse.status).toBe(404);

    const rootData = await rootResponse.json();
    expect(rootData.message).toContain('Template');
  });
});
