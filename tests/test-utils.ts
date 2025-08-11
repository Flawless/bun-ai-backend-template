import { Elysia } from 'elysia';

/**
 * Test utilities for the TypeScript Backend Template
 * Supporting the Testing Trophy approach with emphasis on integration tests
 */

// Mock environment setup
export const setupTestEnv = () => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0'; // Use random port for tests
};

// Common test data
export const testData = {
  healthResponse: {
    status: 'ok',
    environment: 'test',
    version: '1.0.0',
  },
  errorResponse: {
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  },
};

// Helper function to make test requests
export const makeRequest = async (
  app: Elysia,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  path: string,
  body?: unknown,
  headers?: Record<string, string>
) => {
  const request = new Request(`http://localhost${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return await app.handle(request);
};

// Test server instance helper
export const createTestApp = async (): Promise<Elysia> => {
  // Dynamic import to ensure fresh instance for each test
  const { app } = await import('../src/index');
  return app;
};

// Performance testing helper
export const measureResponseTime = async (fn: () => Promise<unknown>): Promise<number> => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

// Mock external dependencies
export const mockExternalServices = () => {
  // Add mocks for external services here
  // Example: database, third-party APIs, etc.
};

// Cleanup helpers
export const cleanup = () => {
  // Reset mocks, clear test data, etc.
  // Add cleanup logic here as needed
};

// Test data generators
export const generateTestData = {
  user: (overrides?: Partial<{ id: string; name: string; email: string }>) => ({
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    ...overrides,
  }),

  request: (overrides?: Partial<{ endpoint: string; method: string }>) => ({
    endpoint: '/test',
    method: 'GET',
    ...overrides,
  }),
};
