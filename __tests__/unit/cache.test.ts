/**
 * MemoryCache - Unit Tests
 */

import { MemoryCache } from '../../src/cache/memory';
import { APIResponse } from '../../src/types';

describe('MemoryCache', () => {
  let cache: MemoryCache;
  let mockData: APIResponse;

  beforeEach(() => {
    cache = new MemoryCache();
    mockData = {
      metaTags: [
        { name: 'title', content: 'Test' },
        { name: 'description', content: 'Test Description' },
      ],
      hreflangTags: [],
    };
  });

  describe('Basic Operations', () => {
    it('should set and get data', async () => {
      const key = 'test_key';
      await cache.set(key, mockData, 3600);

      const result = await cache.get(key);
      expect(result).toEqual(mockData);
    });

    it('should return null for non-existent key', async () => {
      const result = await cache.get('non_existent');
      expect(result).toBeNull();
    });

    it('should delete data', async () => {
      const key = 'test_key';
      await cache.set(key, mockData, 3600);
      await cache.delete(key);

      const result = await cache.get(key);
      expect(result).toBeNull();
    });

    it('should clear all data', async () => {
      await cache.set('key1', mockData, 3600);
      await cache.set('key2', mockData, 3600);

      await cache.clear();

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
    });
  });

  describe('TTL and Expiration', () => {
    it('should expire data after TTL', async () => {
      const key = 'test_key';
      jest.useFakeTimers();

      await cache.set(key, mockData, 1); // 1 second TTL

      // Data should exist immediately
      let result = await cache.get(key);
      expect(result).toEqual(mockData);

      // Move time forward 2 seconds
      jest.advanceTimersByTime(2000);

      // Data should be expired
      result = await cache.get(key);
      expect(result).toBeNull();

      jest.useRealTimers();
    });

    it('should not expire data before TTL', async () => {
      const key = 'test_key';
      jest.useFakeTimers();

      await cache.set(key, mockData, 10); // 10 second TTL

      // Move time forward 5 seconds
      jest.advanceTimersByTime(5000);

      // Data should still exist
      const result = await cache.get(key);
      expect(result).toEqual(mockData);

      jest.useRealTimers();
    });

    it('should handle different TTL values', async () => {
      jest.useFakeTimers();

      const key1 = 'short_ttl';
      const key2 = 'long_ttl';

      await cache.set(key1, mockData, 1); // 1 second
      await cache.set(key2, mockData, 10); // 10 seconds

      // Move forward 2 seconds
      jest.advanceTimersByTime(2000);

      expect(await cache.get(key1)).toBeNull(); // Expired
      expect(await cache.get(key2)).toEqual(mockData); // Still valid

      jest.useRealTimers();
    });
  });

  describe('Data Integrity', () => {
    it('should not modify original data on set', async () => {
      const key = 'test_key';
      const originalData = { ...mockData };

      await cache.set(key, mockData, 3600);
      mockData.metaTags[0].content = 'Modified';

      const result = await cache.get(key);
      expect(result?.metaTags[0].content).toBe('Test'); // Should be original
    });

    it('should handle complex nested data', async () => {
      const key = 'complex_key';
      const complexData: APIResponse = {
        metaTags: [
          {
            name: 'title',
            content: 'Test',
          },
        ],
        hreflangTags: [
          {
            rel: 'alternate',
            hreflang: 'en',
            href: '/en',
          },
          {
            rel: 'alternate',
            hreflang: 'fr',
            href: '/fr',
          },
        ],
        schemaJson: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          author: {
            '@type': 'Person',
            name: 'John Doe',
          },
        },
      };

      await cache.set(key, complexData, 3600);
      const result = await cache.get(key);

      expect(result?.hreflangTags).toHaveLength(2);
      expect(result?.schemaJson).toBeDefined();
      expect((result?.schemaJson as any)?.author?.name).toBe('John Doe');
    });
  });

  describe('Multiple Keys', () => {
    it('should handle multiple independent keys', async () => {
      const data1 = { ...mockData, metaTags: [{ name: 'title', content: 'Page 1' }] };
      const data2 = { ...mockData, metaTags: [{ name: 'title', content: 'Page 2' }] };

      await cache.set('page1', data1, 3600);
      await cache.set('page2', data2, 3600);

      expect(await cache.get('page1')).toEqual(data1);
      expect(await cache.get('page2')).toEqual(data2);
    });

    it('should delete only specified key', async () => {
      await cache.set('key1', mockData, 3600);
      await cache.set('key2', mockData, 3600);

      await cache.delete('key1');

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toEqual(mockData);
    });

    it('should clear all keys', async () => {
      await cache.set('key1', mockData, 3600);
      await cache.set('key2', mockData, 3600);
      await cache.set('key3', mockData, 3600);

      await cache.clear();

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
      expect(await cache.get('key3')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty metaTags array', async () => {
      const key = 'empty_tags';
      const data: APIResponse = {
        metaTags: [],
        hreflangTags: [],
      };

      await cache.set(key, data, 3600);
      const result = await cache.get(key);

      expect(result?.metaTags).toHaveLength(0);
    });

    it('should handle null hreflangTags', async () => {
      const key = 'null_hreflang';
      const data: APIResponse = {
        metaTags: [{ name: 'title', content: 'Test' }],
      };

      await cache.set(key, data, 3600);
      const result = await cache.get(key);

      expect(result?.hreflangTags).toBeUndefined();
    });

    it('should handle zero TTL (immediate expiration)', async () => {
      jest.useFakeTimers();

      const key = 'zero_ttl';
      await cache.set(key, mockData, 0); // 0 second TTL

      // Should expire immediately
      jest.advanceTimersByTime(1);
      const result = await cache.get(key);

      expect(result).toBeNull();

      jest.useRealTimers();
    });

    it('should handle very long TTL', async () => {
      const key = 'long_ttl';
      await cache.set(key, mockData, 365 * 24 * 60 * 60); // 1 year

      const result = await cache.get(key);
      expect(result).toEqual(mockData);
    });
  });

  describe('Performance', () => {
    it('should handle many cache entries', async () => {
      const entries = 1000;

      for (let i = 0; i < entries; i++) {
        await cache.set(`key_${i}`, mockData, 3600);
      }

      for (let i = 0; i < entries; i++) {
        const result = await cache.get(`key_${i}`);
        expect(result).toBeDefined();
      }
    });

    it('should efficiently clear large cache', async () => {
      for (let i = 0; i < 100; i++) {
        await cache.set(`key_${i}`, mockData, 3600);
      }

      const startTime = Date.now();
      await cache.clear();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should be fast
      expect(await cache.get('key_0')).toBeNull();
    });
  });
});
