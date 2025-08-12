import { Elysia } from 'elysia';

/**
 * Minimal test utilities for template demonstration
 */

// Helper function to make test requests
export const makeRequest = async (
  app: Elysia,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  path: string,
  body?: unknown
) => {
  const request = new Request(`http://localhost${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return await app.handle(request);
};

// Create test app instance
export const createTestApp = async (): Promise<Elysia> => {
  process.env.NODE_ENV = 'test';
  const { app } = await import('../src/index');
  return app;
};
