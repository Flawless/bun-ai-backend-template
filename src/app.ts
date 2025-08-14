import { Elysia } from 'elysia';
import { logger, createChildLogger } from './logger.js';
import { randomUUID } from 'crypto';

// Create and configure Elysia app
export const app = new Elysia()
  // Request logging middleware with trace correlation
  .onRequest(({ request, set }) => {
    const requestId = randomUUID();
    const requestLogger = createChildLogger({
      request_id: requestId,
      method: request.method,
      url: request.url,
      user_agent: request.headers.get('user-agent'),
    });

    // Store logger in context for use in handlers
    set.headers['x-request-id'] = requestId;

    requestLogger.info('Incoming request');
  })
  .onAfterHandle(({ request, set }) => {
    const requestLogger = createChildLogger({
      method: request.method,
      url: request.url,
      status: set.status || 200,
    });
    requestLogger.info('Request completed');
  })
  // Health check endpoint - simple OK response
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  }))
  // Readiness check endpoint - returns ready with empty dependencies
  .get('/ready', () => ({
    status: 'ready',
    timestamp: new Date().toISOString(),
    dependencies: {},
  }))
  // Root endpoint
  .get('/', () => ({
    message: 'Welcome to the TypeScript Backend Template',
    documentation: '/health for health checks, /ready for readiness checks',
    timestamp: new Date().toISOString(),
  }))
  // Global error handler
  .onError(({ error, code, set }) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error({ error: errorMessage, code, stack: errorStack }, 'Application error');

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return {
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
        timestamp: new Date().toISOString(),
      };
    }

    set.status = 500;
    return {
      error: 'Internal Server Error',
      message:
        process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : 'Something went wrong',
      timestamp: new Date().toISOString(),
    };
  });

export default app;
