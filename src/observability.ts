/**
 * OpenTelemetry Configuration for TypeScript Backend Template
 *
 * Provides minimal, production-ready observability setup with:
 * - HTTP request auto-instrumentation
 * - Configurable exporters (console for dev, OTLP for production)
 * - Trace correlation support for logging
 * - Environment-based configuration
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConsoleSpanExporter, BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { trace } from '@opentelemetry/api';

/**
 * Environment configuration for OpenTelemetry
 */
interface OTelConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  otlpEndpoint: string | undefined;
  enableTracing: boolean;
  consoleExporter: boolean;
}

/**
 * Get OpenTelemetry configuration from environment variables
 */
function getOTelConfig(): OTelConfig {
  return {
    serviceName:
      process.env.OTEL_SERVICE_NAME || process.env.npm_package_name || 'ts-backend-template',
    serviceVersion: process.env.OTEL_SERVICE_VERSION || process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
    enableTracing: process.env.OTEL_TRACING_ENABLED !== 'false',
    consoleExporter:
      process.env.OTEL_CONSOLE_EXPORTER === 'true' || process.env.NODE_ENV === 'development',
  };
}

/**
 * Initialize OpenTelemetry SDK with auto-instrumentation
 *
 * This should be called BEFORE importing any other modules that need to be instrumented.
 * For Bun/Node.js applications, call this at the very beginning of your entry point.
 */
export function initializeOTel(): NodeSDK | null {
  const config = getOTelConfig();

  // Skip initialization if tracing is disabled
  if (!config.enableTracing) {
    // eslint-disable-next-line no-console
    console.log('OpenTelemetry tracing disabled via OTEL_TRACING_ENABLED=false');
    return null;
  }

  // Configure span exporters based on environment
  const spanExporters = [];

  // Add console exporter for development or when explicitly enabled
  if (config.consoleExporter) {
    spanExporters.push(new ConsoleSpanExporter());
  }

  // Add OTLP exporter for production or when endpoint is configured
  if (config.otlpEndpoint) {
    spanExporters.push(
      new OTLPTraceExporter({
        url: config.otlpEndpoint,
        headers: {
          // Add authentication headers if needed
          // 'Authorization': `Bearer ${process.env.OTEL_API_KEY}`,
        },
      })
    );
  }

  // Fallback to console exporter if no exporters configured
  if (spanExporters.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('No OpenTelemetry exporters configured, falling back to console exporter');
    spanExporters.push(new ConsoleSpanExporter());
  }

  // Create resource with service information
  const resource = new Resource({
    [ATTR_SERVICE_NAME]: config.serviceName,
    [ATTR_SERVICE_VERSION]: config.serviceVersion,
    'service.environment': config.environment,
  });

  // Initialize SDK with auto-instrumentations and span processors
  const spanProcessors = spanExporters.map((exporter) => new BatchSpanProcessor(exporter));

  const sdk = new NodeSDK({
    resource,
    spanProcessors,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable instrumentations not needed for basic HTTP tracing
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
        '@opentelemetry/instrumentation-net': { enabled: false },
        // Enable HTTP instrumentation (most important for web APIs)
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-fastify': { enabled: true },
      }),
    ],
  });

  // Start the SDK
  try {
    sdk.start();
    // eslint-disable-next-line no-console
    console.log(
      `OpenTelemetry initialized for service: ${config.serviceName}@${config.serviceVersion}`
    );
    return sdk;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize OpenTelemetry:', error);
    return null;
  }
}

/**
 * Gracefully shutdown OpenTelemetry SDK
 * Call this during application shutdown to ensure all spans are exported
 */
export async function shutdownOTel(sdk: NodeSDK | null): Promise<void> {
  if (!sdk) return;

  try {
    await sdk.shutdown();
    // eslint-disable-next-line no-console
    console.log('OpenTelemetry SDK shutdown completed');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error shutting down OpenTelemetry SDK:', error);
  }
}

/**
 * Get current trace and span IDs for log correlation
 * Returns undefined if no active span
 */
export function getTraceContext(): { traceId?: string; spanId?: string } | undefined {
  try {
    const activeSpan = trace.getActiveSpan();

    if (activeSpan) {
      const spanContext = activeSpan.spanContext();
      return {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
      };
    }
  } catch {
    // Silently fail if OpenTelemetry API is not available
  }

  return undefined;
}
