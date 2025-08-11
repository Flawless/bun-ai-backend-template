import { describe, test, expect, beforeAll } from 'bun:test';
import { makeRequest, setupTestEnv, createTestApp } from '../test-utils';
import type { Elysia } from 'elysia';

/**
 * Unit Tests for Health Check Endpoint
 * Focus: Individual function/component behavior
 * Coverage: 25-30% of total test suite (Testing Trophy)
 */

describe('Health Check Unit Tests', () => {
  let app: Elysia;

  beforeAll(async () => {
    setupTestEnv();
    app = await createTestApp();
  });

  describe('GET /health', () => {
    test('should return 200 status', async () => {
      const response = await makeRequest(app, 'GET', '/health');
      expect(response.status).toBe(200);
    });

    test('should return JSON content-type', async () => {
      const response = await makeRequest(app, 'GET', '/health');
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    test('should include required health check fields', async () => {
      const response = await makeRequest(app, 'GET', '/health');
      const data = await response.json();

      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('version');
    });

    test('should return status "ok"', async () => {
      const response = await makeRequest(app, 'GET', '/health');
      const data = await response.json();

      expect(data.status).toBe('ok');
    });

    test('should return test environment', async () => {
      const response = await makeRequest(app, 'GET', '/health');
      const data = await response.json();

      expect(data.environment).toBe('test');
    });

    test('should return valid ISO timestamp', async () => {
      const response = await makeRequest(app, 'GET', '/health');
      const data = await response.json();

      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(data.timestamp).getTime()).not.toBeNaN();
    });

    test('should return numeric uptime', async () => {
      const response = await makeRequest(app, 'GET', '/health');
      const data = await response.json();

      expect(typeof data.uptime).toBe('number');
      expect(data.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Response validation', () => {
    test('should have consistent response structure', async () => {
      const response1 = await makeRequest(app, 'GET', '/health');
      const response2 = await makeRequest(app, 'GET', '/health');

      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(Object.keys(data1).sort()).toEqual(Object.keys(data2).sort());
    });

    test('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, () => makeRequest(app, 'GET', '/health'));
      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});
