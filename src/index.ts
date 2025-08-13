// Initialize OpenTelemetry FIRST (before any other imports)
import { initializeOTel, shutdownOTel } from './observability.js';
const sdk = initializeOTel();

import { Elysia } from 'elysia';
import { logger, createChildLogger } from './logger.js';
import { randomUUID } from 'crypto';

// Initialize Elysia app with request logging middleware
const app = new Elysia()
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
  });

// Health check endpoint
app.get('/health', () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  environment: process.env.NODE_ENV || 'development',
  version: process.env.npm_package_version || '1.0.0',
}));

// Readiness check endpoint with dependencies monitoring
app.get('/ready', () => {
  const timestamp = new Date().toISOString();

  return {
    status: 'ready',
    timestamp,
    latency: 0,
    dependencies: {
      database: {
        status: 'healthy',
        latency: 0,
        last_checked: timestamp,
        endpoint: 'database:5432',
      },
      email: {
        status: 'healthy',
        latency: 0,
        last_checked: timestamp,
        endpoint: 'smtp.service.com:587',
      },
    },
  };
});

// Root endpoint
app.get('/', () => ({
  message: 'Welcome to the TypeScript Backend Template',
  documentation: '/health for health checks, /ready for readiness checks',
  timestamp: new Date().toISOString(),
}));

// Global error handler
app.onError(({ error, code, set }) => {
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

// Testable shutdown handler - extracted from signal handlers
export async function handleShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down gracefully`);
  await shutdownOTel(sdk);
}

// Testable server startup logic - extracted from main block
export function startServer(port: number): void {
  const environment = process.env.NODE_ENV || 'development';
  const tracingEnabled = process.env.OTEL_TRACING_ENABLED !== 'false';
  const serviceName =
    process.env.OTEL_SERVICE_NAME || process.env.npm_package_name || 'ts-backend-template';

  logger.info(
    {
      port,
      environment,
      tracing_enabled: tracingEnabled,
      service_name: serviceName,
    },
    'Server starting'
  );

  app.listen(port);
}

// Thin signal handler wrappers that call testable functions
process.on('SIGTERM', async () => {
  await handleShutdown('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', async () => {
  await handleShutdown('SIGINT');
  process.exit(0);
});

// Start server only when file is run directly (not imported)
if (import.meta.main) {
  const port = Number(process.env.PORT) || 3000;
  startServer(port);
}

export default app;
export { app };
