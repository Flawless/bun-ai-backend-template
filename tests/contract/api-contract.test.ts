import { describe, test, expect, beforeAll } from 'bun:test';
import { makeRequest, setupTestEnv, createTestApp } from '../test-utils';
import type { Elysia } from 'elysia';

/**
 * Contract Tests for API Specifications
 * Focus: API contract compliance, response schemas, interface agreements
 * Coverage: 10-15% of total test suite (Testing Trophy)
 *
 * These tests ensure the API adheres to its documented contract
 */

describe('API Contract Tests', () => {
  let app: Elysia;

  beforeAll(async () => {
    setupTestEnv();
    app = await createTestApp();
  });

  describe('Health Check Contract', () => {
    test('should conform to health check response schema', async () => {
      const response = await makeRequest(app, 'GET', '/health');
      const data = await response.json();

      // Required fields
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('version');

      // Field types
      expect(typeof data.status).toBe('string');
      expect(typeof data.timestamp).toBe('string');
      expect(typeof data.uptime).toBe('number');
      expect(typeof data.environment).toBe('string');
      expect(typeof data.version).toBe('string');

      // Field values
      expect(data.status).toBe('ok');
      expect(data.uptime).toBeGreaterThanOrEqual(0);
    });

    test('should return ISO 8601 timestamp format', async () => {
      const response = await makeRequest(app, 'GET', '/health');
      const data = await response.json();

      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(data.timestamp).toMatch(iso8601Regex);

      // Should be a valid date
      const date = new Date(data.timestamp);
      expect(date.getTime()).not.toBeNaN();
    });

    test('should have consistent response structure', async () => {
      const responses = await Promise.all([
        makeRequest(app, 'GET', '/health'),
        makeRequest(app, 'GET', '/health'),
        makeRequest(app, 'GET', '/health'),
      ]);

      const [data1, data2, data3] = await Promise.all(responses.map((r) => r.json()));

      // All responses should have same keys
      const keys1 = Object.keys(data1).sort();
      const keys2 = Object.keys(data2).sort();
      const keys3 = Object.keys(data3).sort();

      expect(keys1).toEqual(keys2);
      expect(keys2).toEqual(keys3);
    });
  });

  describe('Root Endpoint Contract', () => {
    test('should conform to welcome response schema', async () => {
      const response = await makeRequest(app, 'GET', '/');
      const data = await response.json();

      // Required fields
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('documentation');
      expect(data).toHaveProperty('timestamp');

      // Field types
      expect(typeof data.message).toBe('string');
      expect(typeof data.documentation).toBe('string');
      expect(typeof data.timestamp).toBe('string');

      // Content validation
      expect(data.message).toContain('TypeScript Backend Template');
      expect(data.documentation).toContain('/health');
    });

    test('should maintain documentation reference format', async () => {
      const response = await makeRequest(app, 'GET', '/');
      const data = await response.json();

      // Documentation should reference health endpoint
      expect(data.documentation).toMatch(/\/health/);
      expect(data.documentation).toContain('health checks');
    });
  });

  describe('Error Response Contract', () => {
    test('should conform to error response schema', async () => {
      const response = await makeRequest(app, 'GET', '/non-existent');
      expect(response.status).toBe(404);

      const data = await response.json();

      // Required error fields
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('timestamp');

      // Field types
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
      expect(typeof data.timestamp).toBe('string');

      // Standard error format
      expect(data.error).toBe('Not Found');
      expect(data.message).toBe('The requested endpoint does not exist');
    });

    test('should maintain consistent error structure across different 404s', async () => {
      const endpoints = ['/404', '/missing', '/invalid'];

      for (const endpoint of endpoints) {
        const response = await makeRequest(app, 'GET', endpoint);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Not Found');
        expect(data.message).toBe('The requested endpoint does not exist');
        expect(data).toHaveProperty('timestamp');
      }
    });
  });

  describe('HTTP Headers Contract', () => {
    test('should return proper content-type headers', async () => {
      const endpoints = ['/', '/health', '/non-existent'];

      for (const endpoint of endpoints) {
        const response = await makeRequest(app, 'GET', endpoint);
        const contentType = response.headers.get('content-type');

        expect(contentType).toContain('application/json');
      }
    });

    test('should maintain header consistency', async () => {
      const response = await makeRequest(app, 'GET', '/health');

      // Should have proper headers
      expect(response.headers.get('content-type')).toContain('application/json');

      // Should not have unexpected headers
      expect(response.headers.get('x-powered-by')).toBeNull();
    });
  });

  describe('Status Code Contract', () => {
    test('should return correct HTTP status codes', async () => {
      const testCases = [
        { endpoint: '/', expectedStatus: 200 },
        { endpoint: '/health', expectedStatus: 200 },
        { endpoint: '/non-existent', expectedStatus: 404 },
        { endpoint: '/invalid-route', expectedStatus: 404 },
      ];

      for (const testCase of testCases) {
        const response = await makeRequest(app, 'GET', testCase.endpoint);
        expect(response.status).toBe(testCase.expectedStatus);
      }
    });

    test('should handle different HTTP methods consistently', async () => {
      const methods = ['POST', 'PUT', 'DELETE'] as const;

      for (const method of methods) {
        // These methods should return 404 for existing GET-only endpoints
        const response = await makeRequest(app, method, '/health');
        expect(response.status).toBe(404);
      }
    });
  });

  describe('Response Time Contract', () => {
    test('should meet response time SLA', async () => {
      const start = performance.now();
      const response = await makeRequest(app, 'GET', '/health');
      const end = performance.now();

      const responseTime = end - start;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500); // 500ms SLA
    });

    test('should handle concurrent requests within SLA', async () => {
      const concurrentRequests = 10;
      const start = performance.now();

      const promises = Array.from({ length: concurrentRequests }, () =>
        makeRequest(app, 'GET', '/health')
      );

      const responses = await Promise.all(promises);
      const end = performance.now();

      const totalTime = end - start;
      const averageTime = totalTime / concurrentRequests;

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Average response time should meet SLA
      expect(averageTime).toBeLessThan(200); // 200ms average for concurrent requests
    });
  });
});
