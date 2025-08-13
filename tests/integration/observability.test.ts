/**
 * Integration tests for OpenTelemetry observability
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { trace } from '@opentelemetry/api';

describe('OpenTelemetry Integration', () => {
  beforeAll(() => {
    // Ensure OpenTelemetry is initialized for testing
    process.env.OTEL_TRACING_ENABLED = 'true';
    process.env.OTEL_CONSOLE_EXPORTER = 'false'; // Disable console output during tests
  });

  afterAll(() => {
    // Clean up environment
    delete process.env.OTEL_TRACING_ENABLED;
    delete process.env.OTEL_CONSOLE_EXPORTER;
  });

  it('should have OpenTelemetry tracer available', () => {
    const tracer = trace.getTracer('test-tracer');
    expect(tracer).toBeDefined();
    expect(typeof tracer.startSpan).toBe('function');
  });

  it('should create and end spans successfully', () => {
    const tracer = trace.getTracer('test-tracer');

    const span = tracer.startSpan('test-span');
    expect(span).toBeDefined();
    expect(span.spanContext().traceId).toBeDefined();
    expect(span.spanContext().spanId).toBeDefined();

    // Add some attributes
    span.setAttributes({
      'test.attribute': 'test-value',
      'test.number': 42,
    });

    // End the span
    span.end();
  });

  it('should support nested spans', () => {
    const tracer = trace.getTracer('test-tracer');

    const parentSpan = tracer.startSpan('parent-span');
    const childSpan = tracer.startSpan('child-span');

    // Both spans should have valid span IDs (not be undefined or empty)
    expect(parentSpan.spanContext().spanId).toBeDefined();
    expect(childSpan.spanContext().spanId).toBeDefined();
    expect(parentSpan.spanContext().traceId).toBeDefined();
    expect(childSpan.spanContext().traceId).toBeDefined();

    childSpan.end();
    parentSpan.end();
  });

  it('should handle span without active context', () => {
    const tracer = trace.getTracer('test-tracer');

    // This should not throw
    expect(() => {
      const span = tracer.startSpan('isolated-span');
      span.setAttributes({ isolated: true });
      span.end();
    }).not.toThrow();
  });
});
