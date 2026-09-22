/**
 * Tests for Error Classes
 */

import {
  SEOInjectorError,
  APIError,
  NetworkError,
  CacheError,
  InvalidConfigError,
} from '../../src/errors';

describe('Error Classes', () => {
  describe('SEOInjectorError', () => {
    it('should create a base SEOInjectorError', () => {
      const error = new SEOInjectorError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(SEOInjectorError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('SEOInjectorError');
    });

    it('should have proper prototype chain for instanceof', () => {
      const error = new SEOInjectorError('Test');
      expect(error instanceof SEOInjectorError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('APIError', () => {
    it('should create an APIError with status info', () => {
      const error = new APIError('API failed', 500, 'Internal Server Error', 'http://api.example.com/meta');
      expect(error).toBeInstanceOf(APIError);
      expect(error).toBeInstanceOf(SEOInjectorError);
      expect(error.message).toBe('API failed');
      expect(error.name).toBe('APIError');
      expect(error.status).toBe(500);
      expect(error.statusText).toBe('Internal Server Error');
      expect(error.url).toBe('http://api.example.com/meta');
    });

    it('should handle 404 errors', () => {
      const error = new APIError('Not found', 404, 'Not Found', 'http://api.example.com/meta');
      expect(error.status).toBe(404);
      expect(error.statusText).toBe('Not Found');
    });

    it('should handle 429 rate limit errors', () => {
      const error = new APIError('Too many requests', 429, 'Too Many Requests', 'http://api.example.com/meta');
      expect(error.status).toBe(429);
    });

    it('should have proper instanceof checks', () => {
      const error = new APIError('Test', 500, 'Error', 'url');
      expect(error instanceof APIError).toBe(true);
      expect(error instanceof SEOInjectorError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('NetworkError', () => {
    it('should create a NetworkError with original error', () => {
      const originalError = new Error('Network timeout');
      const error = new NetworkError('Network failed', originalError);
      expect(error).toBeInstanceOf(NetworkError);
      expect(error).toBeInstanceOf(SEOInjectorError);
      expect(error.message).toBe('Network failed');
      expect(error.name).toBe('NetworkError');
      expect(error.originalError).toBe(originalError);
      expect(error.originalError.message).toBe('Network timeout');
    });

    it('should handle TypeError as original error', () => {
      const typeError = new TypeError('fetch is not defined');
      const error = new NetworkError('Network error', typeError);
      expect(error.originalError).toBeInstanceOf(TypeError);
    });

    it('should have proper instanceof checks', () => {
      const error = new NetworkError('Test', new Error());
      expect(error instanceof NetworkError).toBe(true);
      expect(error instanceof SEOInjectorError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('CacheError', () => {
    it('should create a CacheError for get operation', () => {
      const error = new CacheError('Cache get failed', 'get', 'cache_key_123');
      expect(error).toBeInstanceOf(CacheError);
      expect(error).toBeInstanceOf(SEOInjectorError);
      expect(error.message).toBe('Cache get failed');
      expect(error.name).toBe('CacheError');
      expect(error.operation).toBe('get');
      expect(error.key).toBe('cache_key_123');
    });

    it('should create a CacheError for set operation', () => {
      const error = new CacheError('Cache set failed', 'set', 'cache_key_123');
      expect(error.operation).toBe('set');
    });

    it('should create a CacheError for delete operation', () => {
      const error = new CacheError('Cache delete failed', 'delete', 'cache_key_123');
      expect(error.operation).toBe('delete');
    });

    it('should create a CacheError for clear operation', () => {
      const error = new CacheError('Cache clear failed', 'clear');
      expect(error.operation).toBe('clear');
      expect(error.key).toBeUndefined();
    });

    it('should have proper instanceof checks', () => {
      const error = new CacheError('Test', 'get');
      expect(error instanceof CacheError).toBe(true);
      expect(error instanceof SEOInjectorError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('InvalidConfigError', () => {
    it('should create an InvalidConfigError with config info', () => {
      const error = new InvalidConfigError(
        'Invalid API key',
        'apiKey',
        123
      );
      expect(error).toBeInstanceOf(InvalidConfigError);
      expect(error).toBeInstanceOf(SEOInjectorError);
      expect(error.message).toBe('Invalid API key');
      expect(error.name).toBe('InvalidConfigError');
      expect(error.configKey).toBe('apiKey');
      expect(error.receivedValue).toBe(123);
    });

    it('should handle various invalid values', () => {
      const nullError = new InvalidConfigError('Invalid', 'option', null);
      expect(nullError.receivedValue).toBeNull();

      const undefinedError = new InvalidConfigError('Invalid', 'option', undefined);
      expect(undefinedError.receivedValue).toBeUndefined();

      const objError = new InvalidConfigError('Invalid', 'option', { invalid: true });
      expect(typeof objError.receivedValue).toBe('object');
    });

    it('should have proper instanceof checks', () => {
      const error = new InvalidConfigError('Test', 'key', 'value');
      expect(error instanceof InvalidConfigError).toBe(true);
      expect(error instanceof SEOInjectorError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('Error hierarchy', () => {
    it('should distinguish between error types', () => {
      const apiError = new APIError('API error', 500, 'Error', 'url');
      const networkError = new NetworkError('Network error', new Error());
      const cacheError = new CacheError('Cache error', 'get');
      const configError = new InvalidConfigError('Config error', 'key', 'value');

      expect(apiError instanceof APIError).toBe(true);
      expect(apiError instanceof NetworkError).toBe(false);
      expect(apiError instanceof CacheError).toBe(false);
      expect(apiError instanceof InvalidConfigError).toBe(false);

      expect(networkError instanceof NetworkError).toBe(true);
      expect(networkError instanceof APIError).toBe(false);
    });

    it('should all be instances of SEOInjectorError', () => {
      const apiError = new APIError('Test', 500, 'Error', 'url');
      const networkError = new NetworkError('Test', new Error());
      const cacheError = new CacheError('Test', 'get');
      const configError = new InvalidConfigError('Test', 'key', 'value');

      expect(apiError instanceof SEOInjectorError).toBe(true);
      expect(networkError instanceof SEOInjectorError).toBe(true);
      expect(cacheError instanceof SEOInjectorError).toBe(true);
      expect(configError instanceof SEOInjectorError).toBe(true);
    });
  });
});
