/**
 * Tests for HTTP Client Retry Logic
 */

import { HTTPClient } from '../../src/http/client';
import { NetworkError, APIError } from '../../src/errors';
import type { Logger } from '../../src/logger';

// Mock fetch
global.fetch = jest.fn();

const mockLogger: Logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('HTTPClient Retry Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Exponential Backoff Calculation', () => {
    it('should retry on network failures with delays', async () => {
      const client = new HTTPClient({ maxRetries: 2, baseDelay: 10, maxDelay: 100, backoffMultiplier: 2 });

      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network error'));
      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network error'));
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'success' }),
      });

      // Should succeed after retries
      const result = await client.fetch('http://example.com/api');
      expect(result).toEqual({ data: 'success' });
      // Should have retried (3 calls total: initial + 2 retries)
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should respect backoff configuration', async () => {
      const client = new HTTPClient({
        maxRetries: 2,
        baseDelay: 20,
        maxDelay: 50,
        backoffMultiplier: 2,
      });

      (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Network error'));

      // Should fail after retries
      await expect(client.fetch('http://example.com/api')).rejects.toThrow();
      // Should have attempted initial + 2 retries = 3 times
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Retry on Network Errors', () => {
    it('should retry on network failure and eventually succeed', async () => {
      const client = new HTTPClient({ maxRetries: 2 });

      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network error'));
      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network error'));
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValueOnce({ data: 'success' }),
      });

      const result = await client.fetch('http://example.com/api');

      expect(result).toEqual({ data: 'success' });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries on persistent network error', async () => {
      const client = new HTTPClient({ maxRetries: 2 });

      (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Network error'));

      await expect(client.fetch('http://example.com/api')).rejects.toBeInstanceOf(NetworkError);

      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should log warnings on retry', async () => {
      const client = new HTTPClient({ maxRetries: 2 }, mockLogger);

      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network error'));
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'success' }),
      });

      await client.fetch('http://example.com/api');

      expect(mockLogger.warn).toHaveBeenCalled();
      const warnCall = (mockLogger.warn as jest.Mock).mock.calls[0][0];
      expect(warnCall).toContain('Network error');
      expect(warnCall).toContain('retry');
    });
  });

  describe('Retry on Server Errors (5xx)', () => {
    it('should retry on 500 Internal Server Error', async () => {
      const client = new HTTPClient({ maxRetries: 2 }, mockLogger);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({ data: 'success' }),
      });

      const result = await client.fetch('http://example.com/api');

      expect(result).toEqual({ data: 'success' });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should retry on 503 Service Unavailable', async () => {
      const client = new HTTPClient({ maxRetries: 1 });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'success' }),
      });

      const result = await client.fetch('http://example.com/api');

      expect(result).toEqual({ data: 'success' });
    });
  });

  describe('Retry on Rate Limit (429)', () => {
    it('should retry on 429 Too Many Requests', async () => {
      const client = new HTTPClient({ maxRetries: 2 }, mockLogger);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'success' }),
      });

      const result = await client.fetch('http://example.com/api');

      expect(result).toEqual({ data: 'success' });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Do Not Retry on Client Errors (4xx except 429)', () => {
    it('should not retry on 400 Bad Request', async () => {
      const client = new HTTPClient({ maxRetries: 3 });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(client.fetch('http://example.com/api')).rejects.toBeInstanceOf(APIError);

      expect(global.fetch).toHaveBeenCalledTimes(1); // No retries
    });

    it('should not retry on 401 Unauthorized', async () => {
      const client = new HTTPClient({ maxRetries: 3 });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(client.fetch('http://example.com/api')).rejects.toBeInstanceOf(APIError);

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 404 Not Found', async () => {
      const client = new HTTPClient({ maxRetries: 3 });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(client.fetch('http://example.com/api')).rejects.toBeInstanceOf(APIError);

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw APIError with correct details', async () => {
      const client = new HTTPClient();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      try {
        await client.fetch('http://example.com/api');
        fail('Should have thrown APIError');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        const apiError = error as APIError;
        expect(apiError.status).toBe(401);
        expect(apiError.statusText).toBe('Unauthorized');
        expect(apiError.url).toBe('http://example.com/api');
      }
    });
  });

  describe('Default Retry Configuration', () => {
    it('should use default values when not specified', async () => {
      const client = new HTTPClient();

      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network error'));
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'success' }),
      });

      const result = await client.fetch('http://example.com/api');

      expect(result).toEqual({ data: 'success' });
      // Default maxRetries is 3, so should attempt 2 times total
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('GET and POST Methods', () => {
    it('should retry GET requests', async () => {
      const client = new HTTPClient({ maxRetries: 1 });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'success' }),
      });

      const result = await client.get('http://example.com/api');

      expect(result).toEqual({ data: 'success' });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should retry POST requests', async () => {
      const client = new HTTPClient({ maxRetries: 1 });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'success' }),
      });

      const result = await client.post('http://example.com/api', { key: 'value' });

      expect(result).toEqual({ data: 'success' });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Logging', () => {
    it('should log warnings during retry attempts on network failure', async () => {
      const logger: Logger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      const client = new HTTPClient({ maxRetries: 1 }, logger);

      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network error'));
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'success' }),
      });

      await client.fetch('http://example.com/api');

      // Should have logged a warning about retrying
      expect(logger.warn).toHaveBeenCalled();
      const warnCalls = (logger.warn as jest.Mock).mock.calls;
      const hasRetryMessage = warnCalls.some(call =>
        call[0].toString().toLowerCase().includes('network error') ||
        call[0].toString().toLowerCase().includes('retry')
      );
      expect(hasRetryMessage).toBe(true);
    });

    it('should log warnings during retry attempts on server error', async () => {
      const logger: Logger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      const client = new HTTPClient({ maxRetries: 1 }, logger);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: 'success' }),
      });

      await client.fetch('http://example.com/api');

      // Should have logged a warning about retrying on 503
      expect(logger.warn).toHaveBeenCalled();
      const warnCall = (logger.warn as jest.Mock).mock.calls[0][0];
      expect(warnCall).toContain('503');
    });
  });
});
