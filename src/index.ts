#!/usr/bin/env bun
// Initialize OpenTelemetry FIRST (before any other imports)
import { initializeOTel, shutdownOTel } from './observability.js';
const sdk = initializeOTel();

import { app } from './app.js';
import { logger } from './logger.js';

// Get port from environment
const port = Number(process.env.PORT) || 3000;

// Only start the server when this is the main module
if (import.meta.main) {
  // Log startup information
  logger.info(
    {
      port,
      environment: process.env.NODE_ENV || 'development',
      tracing_enabled: process.env.OTEL_TRACING_ENABLED !== 'false',
      service_name:
        process.env.OTEL_SERVICE_NAME || process.env.npm_package_name || 'ts-backend-template',
    },
    'Server starting'
  );

  // Start the server
  app.listen(port);

  logger.info(`Server running at http://localhost:${port}`);
}

// Graceful shutdown logic (testable)
export async function gracefulShutdown(
  signal: string,
  otelSdk: ReturnType<typeof initializeOTel>
): Promise<void> {
  logger.info(`${signal} received, shutting down gracefully`);
  await shutdownOTel(otelSdk);
}

// Process exit wrapper (testable)
export function exitProcess(code: number = 0): void {
  process.exit(code);
}

// Handle shutdown signals (wiring)
async function handleShutdown(signal: string): Promise<void> {
  await gracefulShutdown(signal, sdk);
  exitProcess(0);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Export for testing
export { app };
