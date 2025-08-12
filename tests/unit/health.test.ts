import { describe, test, expect } from 'bun:test';
import { makeRequest, createTestApp } from '../test-utils';

/**
 * Unit Test Example
 * Testing Trophy: 25-30% of test suite
 */

describe('Health Endpoint Unit Test', () => {
  test('should return health status', async () => {
    const app = await createTestApp();
    const response = await makeRequest(app, 'GET', '/health');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data).toHaveProperty('timestamp');
  });

  test('should return readiness status with dependencies', async () => {
    const app = await createTestApp();
    const response = await makeRequest(app, 'GET', '/ready');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ready');
    expect(data).toHaveProperty('dependencies');
    expect(data.dependencies).toHaveProperty('database');
    expect(data.dependencies).toHaveProperty('email');
  });
});
