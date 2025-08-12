import { describe, test, expect } from 'bun:test';
import { makeRequest, createTestApp } from '../test-utils';

/**
 * Contract Test Example
 * Testing Trophy: 10-15% of test suite
 */

describe('API Contract Test', () => {
  test('should conform to health endpoint contract', async () => {
    const app = await createTestApp();
    const response = await makeRequest(app, 'GET', '/health');
    const data = await response.json();

    // Verify API contract compliance
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    // Verify required fields and types
    expect(data.status).toBe('ok');
    expect(typeof data.timestamp).toBe('string');
    expect(typeof data.uptime).toBe('number');
    expect(typeof data.environment).toBe('string');
  });
});
