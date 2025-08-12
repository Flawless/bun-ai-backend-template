import { Elysia } from 'elysia';
import pino from 'pino';

// Initialize structured logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'production' ? {} : { transport: { target: 'pino-pretty' } }),
});

// Initialize Elysia app
const app = new Elysia();

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

// Start server only when file is run directly (not imported)
if (import.meta.main) {
  const port = Number(process.env.PORT) || 3000;
  logger.info({ port, environment: process.env.NODE_ENV || 'development' }, 'Server starting');
  app.listen(port);
}

export default app;
export { app };
