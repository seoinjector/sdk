/**
 * SEOInjector Client - Unit Tests
 */

import { SEOInjector } from '../../src/client';
import { MemoryCache } from '../../src/cache/memory';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock navigator for language detection
Object.defineProperty(global, 'navigator', {
  value: { language: 'en-US' },
  configurable: true,
});

describe('SEOInjector', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Initialization', () => {
    it('should initialize with API key', () => {
      const seo = new SEOInjector('test_key');
      expect(seo).toBeDefined();
    });

    it('should accept custom options', () => {
      const cache = new MemoryCache();
      const seo = new SEOInjector('test_key', {
        apiUrl: 'https://custom.api.com',
        cache: true,
        cacheDuration: 7200,
        cacheStore: cache,
        debug: true,
      });
      expect(seo).toBeDefined();
    });
  });

  describe('Chainable API', () => {
    it('should chain setUrl', () => {
      const seo = new SEOInjector('test_key');
      const result = seo.setUrl('/about');
      expect(result).toBe(seo);
    });

    it('should chain setLanguage', () => {
      const seo = new SEOInjector('test_key');
      const result = seo.setLanguage('en');
      expect(result).toBe(seo);
    });

    it('should chain setContext', () => {
      const seo = new SEOInjector('test_key');
      const result = seo.setContext({ product: { name: 'Test' } });
      expect(result).toBe(seo);
    });

    it('should chain multiple setters', () => {
      const seo = new SEOInjector('test_key');
      const result = seo
        .setUrl('/products/:id')
        .setLanguage('fr')
        .setContext({ product: { name: 'Test' } });
      expect(result).toBe(seo);
    });
  });

  describe('Static Metadata', () => {
    it('should fetch metadata and convert to array', async () => {
      const mockResponse = {
        metaTags: [
          { name: 'description', content: 'Test description' },
          { name: 'author', content: 'Test Author' },
          { property: 'og:title', content: 'Test Title' },
        ],
        hreflangTags: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const seo = new SEOInjector('test_key');
      const metadata = await seo.setUrl('/about').get();

      expect(metadata).toBeDefined();
      expect(metadata?.description).toBe('Test description');
      expect(metadata?.author).toBe('Test Author');
      expect(metadata?.og_title).toBe('Test Title');
    });

    it('should render metadata as HTML', async () => {
      const mockResponse = {
        metaTags: [
          { name: 'title', content: 'Test Page' },
          { name: 'description', content: 'Test description' },
        ],
        hreflangTags: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const seo = new SEOInjector('test_key');
      const html = await seo.setUrl('/about').render();

      expect(html).toContain('<title>Test Page</title>');
      expect(html).toContain('name="description"');
      expect(html).toContain('Test description');
    });

    it('should handle null metadata gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const seo = new SEOInjector('test_key');
      const metadata = await seo.setUrl('/notfound').get();

      expect(metadata).toBeNull();
    });
  });

  describe('Dynamic Metadata', () => {
    it('should fetch dynamic metadata with context', async () => {
      const mockResponse = {
        metaTags: [
          { name: 'title', content: 'Blue Shoes' },
          { name: 'description', content: 'High-quality athletic shoes' },
        ],
        hreflangTags: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const seo = new SEOInjector('test_key');
      const metadata = await seo
        .setUrl('/products/:id')
        .setContext({
          product: {
            name: 'Blue Shoes',
            description: 'High-quality athletic shoes',
          },
        })
        .getDynamic();

      expect(metadata).toBeDefined();
      expect(metadata?.title).toBe('Blue Shoes');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamic-meta/'),
        expect.any(Object)
      );
    });

    it('should send context as POST body', async () => {
      const mockResponse = {
        metaTags: [],
        hreflangTags: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const context = { product: { id: 123 } };
      const seo = new SEOInjector('test_key');
      await seo
        .setUrl('/products/:id')
        .setContext(context)
        .getDynamic();

      // Verify POST was called
      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1]?.method).toBe('POST');
      expect(callArgs[1]?.body).toContain('product');
    });
  });

  describe('Language Detection', () => {
    it('should use explicit language if set', async () => {
      const mockResponse = {
        metaTags: [{ name: 'title', content: 'Test' }],
        hreflangTags: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const seo = new SEOInjector('test_key');
      await seo.setUrl('/about').setLanguage('fr').get();

      // Check URL contains lang parameter
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('lang=fr');
    });

    it('should fall back to detected language', async () => {
      const mockResponse = {
        metaTags: [],
        hreflangTags: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const seo = new SEOInjector('test_key');
      await seo.setUrl('/about').get();

      // navigator.language is 'en-US', should use 'en'
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('lang=en');
    });

    it('should default to "en" if no language detected', async () => {
      // Temporarily override navigator
      const originalNavigator = global.navigator;
      Object.defineProperty(global, 'navigator', {
        value: {},
        configurable: true,
      });

      const mockResponse = {
        metaTags: [],
        hreflangTags: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const seo = new SEOInjector('test_key');
      await seo.setUrl('/about').get();

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('lang=en');

      // Restore navigator
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
      });
    });
  });

  describe('Caching', () => {
    it('should cache metadata', async () => {
      const mockResponse = {
        metaTags: [{ name: 'title', content: 'Test' }],
        hreflangTags: [],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const seo = new SEOInjector('test_key', {
        cache: true,
        cacheDuration: 3600,
      });

      // First call
      await seo.setUrl('/about').get();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call (should hit cache)
      const metadata = await seo.setUrl('/about').get();
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1, not 2
      expect(metadata?.title).toBe('Test');
    });

    it('should disable caching when cache option is false', async () => {
      const mockResponse = {
        metaTags: [],
        hreflangTags: [],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const seo = new SEOInjector('test_key', {
        cache: false,
      });

      // Multiple calls should hit API each time
      await seo.setUrl('/about').get();
      await seo.setUrl('/about').get();

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should clear cache', async () => {
      const mockResponse = {
        metaTags: [{ name: 'title', content: 'Test' }],
        hreflangTags: [],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const seo = new SEOInjector('test_key', { cache: true });

      // First call
      await seo.setUrl('/about').get();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear cache
      seo.clearCache('/about');

      // Second call should hit API again
      await seo.setUrl('/about').get();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', async () => {
      const mockResponse = {
        metaTags: [],
        hreflangTags: [],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const seo = new SEOInjector('test_key', { cache: true });

      // Multiple URLs
      await seo.setUrl('/about').get();
      await seo.setUrl('/contact').get();
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Clear all
      seo.clearAllCache();

      // Repeat calls should hit API again
      await seo.setUrl('/about').get();
      await seo.setUrl('/contact').get();
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const seo = new SEOInjector('test_key');
      const metadata = await seo.setUrl('/about').get();

      expect(metadata).toBeNull();
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      const seo = new SEOInjector('test_key');
      const metadata = await seo.setUrl('/notfound').get();

      expect(metadata).toBeNull();
    });

    it('should handle invalid JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Invalid JSON');
        },
      });

      const seo = new SEOInjector('test_key');
      const metadata = await seo.setUrl('/about').get();

      expect(metadata).toBeNull();
    });
  });

  describe('hreflang Tags', () => {
    it('should include hreflang tags in HTML', async () => {
      const mockResponse = {
        metaTags: [{ name: 'title', content: 'Test' }],
        hreflangTags: [
          { rel: 'alternate', hreflang: 'en', href: '/en/about' },
          { rel: 'alternate', hreflang: 'fr', href: '/fr/about' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const seo = new SEOInjector('test_key');
      const html = await seo.setUrl('/about').render();

      expect(html).toContain('hreflang="en"');
      expect(html).toContain('hreflang="fr"');
      expect(html).toContain('/en/about');
      expect(html).toContain('/fr/about');
    });

    it('should include hreflang in metadata object', async () => {
      const mockResponse = {
        metaTags: [{ name: 'title', content: 'Test' }],
        hreflangTags: [
          { rel: 'alternate', hreflang: 'en', href: '/en/about' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const seo = new SEOInjector('test_key');
      const metadata = await seo.setUrl('/about').get();

      expect(metadata?.hreflang).toBeDefined();
      expect(Array.isArray(metadata?.hreflang)).toBe(true);
      expect(metadata?.hreflang[0].hreflang).toBe('en');
    });
  });

  describe('Open Graph Tags', () => {
    it('should include OG tags in HTML', async () => {
      const mockResponse = {
        metaTags: [
          { property: 'og:title', content: 'Test Title' },
          { property: 'og:description', content: 'Test Description' },
          { property: 'og:image', content: 'https://example.com/image.jpg' },
        ],
        hreflangTags: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const seo = new SEOInjector('test_key');
      const html = await seo.setUrl('/about').render();

      expect(html).toContain('property="og:title"');
      expect(html).toContain('Test Title');
      expect(html).toContain('og:image');
    });

    it('should convert OG tags to metadata object', async () => {
      const mockResponse = {
        metaTags: [
          { property: 'og:title', content: 'OG Title' },
          { property: 'og:image', content: 'https://example.com/img.jpg' },
        ],
        hreflangTags: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const seo = new SEOInjector('test_key');
      const metadata = await seo.setUrl('/about').get();

      expect(metadata?.og_title).toBe('OG Title');
      expect(metadata?.og_image).toBe('https://example.com/img.jpg');
    });
  });

  describe('JSON-LD Schema', () => {
    it('should include schema in HTML', async () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        title: 'Test Article',
      };

      const mockResponse = {
        metaTags: [{ name: 'title', content: 'Test' }],
        hreflangTags: [],
        schemaJson: schema,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const seo = new SEOInjector('test_key');
      const html = await seo.setUrl('/article').render();

      expect(html).toContain('<script type="application/ld+json">');
      expect(html).toContain('Test Article');
    });

    it('should include schema in metadata object', async () => {
      const schema = { '@type': 'Article' };

      const mockResponse = {
        metaTags: [],
        hreflangTags: [],
        schemaJson: schema,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const seo = new SEOInjector('test_key');
      const metadata = await seo.setUrl('/article').get();

      expect(metadata?.schema).toBeDefined();
      expect(metadata?.schema['@type']).toBe('Article');
    });
  });
});
