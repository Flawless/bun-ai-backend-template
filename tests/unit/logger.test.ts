/**
 * Unit tests for logger module
 * Tests all exported functions and logger functionality
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  logger,
  createChildLogger,
  logWithTrace,
  getCallerInfo,
  createLogMixin,
} from '../../src/logger.js';
import * as otelApi from '@opentelemetry/api';

describe('Logger', () => {
  describe('logger instance', () => {
    test('should be defined', () => {
      expect(logger).toBeDefined();
    });

    test('should have standard log methods', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    test('should log messages at different levels', () => {
      // These don't throw, just verify they can be called
      expect(() => logger.info('Info message')).not.toThrow();
      expect(() => logger.warn('Warning message')).not.toThrow();
      expect(() => logger.error('Error message')).not.toThrow();
      expect(() => logger.debug('Debug message')).not.toThrow();
    });

    test('should handle structured logging', () => {
      expect(() => logger.info({ userId: 123 }, 'User action')).not.toThrow();
      expect(() => logger.error({ error: new Error('Test') }, 'Error occurred')).not.toThrow();
    });
  });

  describe('getCallerInfo', () => {
    test('should return caller information', () => {
      const result = getCallerInfo();
      // May return undefined or string depending on stack availability
      if (result) {
        expect(typeof result).toBe('string');
        // Should contain test file reference if available
        expect(result).toContain('.ts');
      }
    });

    test('should handle various stack scenarios', () => {
      function testFunction() {
        return getCallerInfo();
      }
      const result = testFunction();
      // May be undefined or string
      if (result) {
        expect(typeof result).toBe('string');
      }
    });
  });

  describe('createLogMixin', () => {
    let originalGetActiveSpan: typeof otelApi.trace.getActiveSpan;

    beforeEach(() => {
      originalGetActiveSpan = otelApi.trace.getActiveSpan;
    });

    afterEach(() => {
      otelApi.trace.getActiveSpan = originalGetActiveSpan;
    });

    test('should create mixin object', () => {
      const mixin = createLogMixin();
      expect(typeof mixin).toBe('object');
    });

    test('should return non-null object', () => {
      const mixin = createLogMixin();
      expect(mixin).not.toBeNull();
      expect(typeof mixin).toBe('object');
    });

    test('should include trace context when span is active', () => {
      const mockSpan = {
        spanContext: () => ({
          traceId: 'test-trace-123',
          spanId: 'test-span-456',
          traceFlags: 1,
          isRemote: false,
        }),
      };

      // Mock getActiveSpan to return our mock span
      otelApi.trace.getActiveSpan = () => mockSpan as otelApi.Span;

      const result = createLogMixin(false); // Disable location to isolate trace testing

      expect(result.trace_id).toBe('test-trace-123');
      expect(result.span_id).toBe('test-span-456');
    });

    test('should not include trace context when no span is active', () => {
      // Mock getActiveSpan to return undefined
      otelApi.trace.getActiveSpan = () => undefined;

      const result = createLogMixin(false);

      expect(result.trace_id).toBeUndefined();
      expect(result.span_id).toBeUndefined();
    });

    test('should include caller info when enabled', () => {
      otelApi.trace.getActiveSpan = () => undefined;

      const result = createLogMixin(true);

      expect(result.caller).toBeDefined();
      expect(typeof result.caller).toBe('string');
    });

    test('should not include caller info when disabled', () => {
      otelApi.trace.getActiveSpan = () => undefined;

      const result = createLogMixin(false);

      expect(result.caller).toBeUndefined();
    });

    test('should handle both trace and caller together', () => {
      const mockSpan = {
        spanContext: () => ({
          traceId: 'combined-trace',
          spanId: 'combined-span',
          traceFlags: 1,
          isRemote: false,
        }),
      };

      otelApi.trace.getActiveSpan = () => mockSpan as otelApi.Span;

      const result = createLogMixin(true);

      expect(result.trace_id).toBe('combined-trace');
      expect(result.span_id).toBe('combined-span');
      expect(result.caller).toBeDefined();
    });

    test('should handle span with invalid context', () => {
      const mockSpan = {
        spanContext: () => ({
          traceId: '00000000000000000000000000000000', // Invalid trace ID
          spanId: '0000000000000000', // Invalid span ID
          traceFlags: 0,
          isRemote: false,
        }),
      };

      otelApi.trace.getActiveSpan = () => mockSpan as otelApi.Span;

      const result = createLogMixin(false);

      // Current implementation doesn't filter invalid IDs, it passes them through
      expect(result.trace_id).toBe('00000000000000000000000000000000');
      expect(result.span_id).toBe('0000000000000000');
    });
  });

  describe('createChildLogger', () => {
    test('should create child logger with context', () => {
      const child = createChildLogger({ requestId: 'req-123' });
      expect(child).toBeDefined();
      expect(typeof child.info).toBe('function');
    });

    test('should create child with multiple context fields', () => {
      const child = createChildLogger({
        userId: 'user-456',
        sessionId: 'session-789',
        action: 'login',
      });
      expect(child).toBeDefined();
      expect(() => child.info('Child logger test')).not.toThrow();
    });

    test('should handle empty context', () => {
      const child = createChildLogger({});
      expect(child).toBeDefined();
      expect(typeof child.info).toBe('function');
    });

    test('should handle nested objects in context', () => {
      const child = createChildLogger({
        user: {
          id: 123,
          name: 'Test User',
        },
        metadata: {
          timestamp: Date.now(),
        },
      });
      expect(child).toBeDefined();
      expect(() => child.info('Nested context test')).not.toThrow();
    });
  });

  describe('logWithTrace', () => {
    let originalGetActiveSpan: typeof otelApi.trace.getActiveSpan;

    beforeEach(() => {
      originalGetActiveSpan = otelApi.trace.getActiveSpan;
    });

    afterEach(() => {
      otelApi.trace.getActiveSpan = originalGetActiveSpan;
    });

    test('should log with trace context', () => {
      const mockSpan = {
        spanContext: () => ({
          traceId: 'log-trace-123',
          spanId: 'log-span-456',
          traceFlags: 1,
          isRemote: false,
        }),
      };

      otelApi.trace.getActiveSpan = () => mockSpan as otelApi.Span;

      expect(() => logWithTrace('info', 'Test message with trace')).not.toThrow();
    });

    test('should log without trace context', () => {
      otelApi.trace.getActiveSpan = () => undefined;

      expect(() => logWithTrace('info', 'Test message without trace')).not.toThrow();
    });

    test('should log at different levels', () => {
      otelApi.trace.getActiveSpan = () => undefined;

      expect(() => logWithTrace('info', 'Info message')).not.toThrow();
      expect(() => logWithTrace('warn', 'Warning message')).not.toThrow();
      expect(() => logWithTrace('error', 'Error message')).not.toThrow();
      expect(() => logWithTrace('debug', 'Debug message')).not.toThrow();
    });

    test('should handle invalid log level', () => {
      otelApi.trace.getActiveSpan = () => undefined;

      // Invalid level should default to info
      expect(() =>
        logWithTrace(
          'invalid' as unknown as 'info' | 'warn' | 'error' | 'debug',
          'Message with invalid level'
        )
      ).not.toThrow();
    });

    test('should log with additional data', () => {
      otelApi.trace.getActiveSpan = () => undefined;

      expect(() =>
        logWithTrace('info', 'Message with data', {
          userId: 123,
          action: 'test',
        })
      ).not.toThrow();
    });

    test('should handle null additional data', () => {
      otelApi.trace.getActiveSpan = () => undefined;

      expect(() =>
        logWithTrace('info', 'Message with null data', null as unknown as Record<string, unknown>)
      ).not.toThrow();
    });

    test('should handle undefined additional data', () => {
      otelApi.trace.getActiveSpan = () => undefined;

      expect(() => logWithTrace('info', 'Message with undefined data', undefined)).not.toThrow();
    });

    test('should log with trace and additional data', () => {
      const mockSpan = {
        spanContext: () => ({
          traceId: 'full-trace',
          spanId: 'full-span',
          traceFlags: 1,
          isRemote: false,
        }),
      };

      otelApi.trace.getActiveSpan = () => mockSpan as otelApi.Span;

      expect(() =>
        logWithTrace('error', 'Full context error', {
          error: new Error('Test error'),
          code: 'TEST_ERROR',
          timestamp: Date.now(),
        })
      ).not.toThrow();
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle logger initialization errors gracefully', () => {
      // Logger uses lazy initialization, should not throw on access
      expect(() => logger.info).not.toThrow();
      expect(() => logger.error).not.toThrow();
    });

    test('should handle circular references in log data', () => {
      const circular: Record<string, unknown> = { name: 'test' };
      circular.self = circular;

      expect(() => logger.info(circular, 'Circular reference test')).not.toThrow();
    });

    test('should handle very long messages', () => {
      const longMessage = 'x'.repeat(10000);
      expect(() => logger.info(longMessage)).not.toThrow();
    });

    test('should handle special characters in messages', () => {
      expect(() => logger.info('Message with special chars: \n\t\r\0')).not.toThrow();
      expect(() => logger.info('Unicode: 你好世界 🌍')).not.toThrow();
    });

    test('should handle error objects', () => {
      const error = new Error('Test error');
      expect(() => logger.error(error)).not.toThrow();
      expect(() => logger.error({ err: error }, 'Error with context')).not.toThrow();
    });
  });
});
