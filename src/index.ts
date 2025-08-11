import { Elysia } from 'elysia';

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

// Root endpoint
app.get('/', () => ({
  message: 'Welcome to the TypeScript Backend Template',
  documentation: '/health for health checks',
  timestamp: new Date().toISOString(),
}));

// Global error handler
app.onError(({ error, code, set }) => {
  console.error('Application error:', error);

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
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
  };
});

const port = Number(process.env.PORT) || 3000;

console.log(`🚀 Server starting on http://localhost:${port}`);

// Start server
app.listen(port);

export default app;
export { app };
