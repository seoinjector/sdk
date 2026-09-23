/**
 * SEO Injector - Main client class
 * Provides chainable API for static and dynamic metadata resolution
 */

import { HTTPClient } from './http/client';
import { MemoryCache } from './cache/memory';
import {
  APIResponse,
  CacheStore,
  Metadata,
  SEOInjectorOptions,
  Logger,
  RetryConfig,
} from './types';
import {
  detectLanguage,
  getPrimaryLanguage,
} from './utils/language';
import {
  getCurrentUrl,
  normalizePath,
} from './utils/url';
import {
  convertToHtml,
  convertToArray,
  removeExistingSeoInjectorTags,
} from './utils/html';
import { getLogger } from './logger';

export class SEOInjector {
  private apiKey: string;
  private apiUrl: string;
  private url?: string;
  private language?: string;
  private context?: Record<string, any>;
  private cache: boolean;
  private cacheDuration: number;
  private debug: boolean;
  private logger: Logger;
  private httpClient: HTTPClient;
  private cacheStore: CacheStore;

  /**
   * Initialize SEO Injector
   * @param apiKey Your SEO Injector API key
   * @param options Configuration options
   */
  constructor(apiKey: string, options: SEOInjectorOptions = {}) {
    this.apiKey = apiKey;
    this.apiUrl = options.apiUrl || 'https://api.seoinjector.com/api';
    this.cache = options.cache !== false; // Default: true
    this.cacheDuration = options.cacheDuration || 3600; // 1 hour
    this.debug = options.debug || false;
    this.logger = getLogger(this.debug, options.logger);
    this.httpClient = new HTTPClient(options.retry, this.logger);
    this.cacheStore = options.cacheStore || new MemoryCache();

    this.logger.debug(
      `SEOInjector initialized with apiKey: ${this.apiKey.slice(0, 8)}...`
    );
  }

  /**
   * Set the URL to fetch metadata for
   * @param url Page URL or path
   * @returns this (for chaining)
   */
  setUrl(url: string): this {
    this.url = normalizePath(url);
    return this;
  }

  /**
   * Set the language for metadata resolution
   * @param language Language code (e.g., "en", "en-US", "fr")
   * @returns this (for chaining)
   */
  setLanguage(language: string): this {
    this.language = language;
    return this;
  }

  /**
   * Set context for dynamic URL resolution
   * The context contains application data that SEO Injector uses when resolving dynamic templates
   * @param context Context object with application data
   * @returns this (for chaining)
   */
  setContext(context: Record<string, any>): this {
    this.context = context;
    return this;
  }

  /**
   * Render meta tags as HTML string
   * For static metadata
   * @returns HTML meta tags string
   */
  async render(): Promise<string> {
    const url = this.url || getCurrentUrl();
    const metadata = await this.fetchMetadata(url);
    const existingHtml = this.getExistingMetaTags();

    return convertToHtml(metadata, existingHtml);
  }

  /**
   * Render meta tags as HTML string
   * For dynamic metadata with context
   * @returns HTML meta tags string
   */
  async renderDynamic(): Promise<string> {
    const url = this.url || getCurrentUrl();
    const metadata = await this.fetchDynamicMetadata(url, this.context || {});
    const existingHtml = this.getExistingMetaTags();

    return convertToHtml(metadata, existingHtml);
  }

  /**
   * Get metadata as object
   * For static metadata
   * @returns Metadata object or null if not found
   */
  async get(): Promise<Metadata | null> {
    const url = this.url || getCurrentUrl();
    const metadata = await this.fetchMetadata(url);
    return convertToArray(metadata);
  }

  /**
   * Get metadata as object
   * For dynamic metadata with context
   * @returns Metadata object or null if not found
   */
  async getDynamic(): Promise<Metadata | null> {
    const url = this.url || getCurrentUrl();
    const metadata = await this.fetchDynamicMetadata(url, this.context || {});
    return convertToArray(metadata);
  }

  /**
   * Fetch metadata from API with caching
   */
  private async fetchMetadata(url: string): Promise<APIResponse | null> {
    const language = this.resolveLanguage();
    const cacheKey = this.generateCacheKey(url, language);

    // Check cache first
    if (this.cache) {
      try {
        const cached = await this.cacheStore.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for ${url}`);
          return cached;
        }
      } catch (error) {
        this.logger.warn(`Cache read error: ${(error as Error).message}`);
      }
    }

    // Fetch from API
    try {
      const apiUrl = `${this.apiUrl}/meta/${encodeURIComponent(
        this.apiKey
      )}?url=${encodeURIComponent(url)}&lang=${encodeURIComponent(language)}`;

      this.logger.debug(`Fetching metadata for ${url} (lang: ${language})`);

      const data = await this.httpClient.get<APIResponse>(apiUrl);

      // Cache the result
      if (this.cache && data && !data.error) {
        try {
          await this.cacheStore.set(cacheKey, data, this.cacheDuration);
          this.logger.debug(`Cached metadata for ${url}`);
        } catch (error) {
          this.logger.warn(`Cache write error: ${(error as Error).message}`);
        }
      }

      return data || null;
    } catch (error) {
      this.logger.error(`Error fetching metadata for ${url}: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Fetch metadata for a dynamic URL with context
   */
  private async fetchDynamicMetadata(
    url: string,
    context: Record<string, any>
  ): Promise<APIResponse | null> {
    const language = this.resolveLanguage();
    const contextHash = this.hashContext(context);
    const cacheKey = this.generateDynamicCacheKey(url, language, contextHash);

    // Check cache first
    if (this.cache) {
      try {
        const cached = await this.cacheStore.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for dynamic ${url}`);
          return cached;
        }
      } catch (error) {
        this.logger.warn(`Cache read error: ${(error as Error).message}`);
      }
    }

    // Fetch from API
    try {
      const apiUrl = `${this.apiUrl}/dynamic-meta/${encodeURIComponent(
        this.apiKey
      )}?url=${encodeURIComponent(url)}&lang=${encodeURIComponent(language)}`;

      this.logger.debug(
        `Fetching dynamic metadata for ${url} (lang: ${language}, context keys: ${Object.keys(context).join(', ')})`
      );

      const data = await this.httpClient.post<APIResponse>(
        apiUrl,
        { context },
        { 'Content-Type': 'application/json' }
      );

      // Cache the result
      if (this.cache && data && !data.error) {
        try {
          await this.cacheStore.set(cacheKey, data, this.cacheDuration);
          this.logger.debug(`Cached dynamic metadata for ${url}`);
        } catch (error) {
          this.logger.warn(`Cache write error: ${(error as Error).message}`);
        }
      }

      return data || null;
    } catch (error) {
      this.logger.error(`Error fetching dynamic metadata for ${url}: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Resolve language: explicit setting > browser detection > default to "en"
   */
  private resolveLanguage(): string {
    if (this.language) {
      return this.language;
    }

    const detected = detectLanguage();
    if (detected) {
      return getPrimaryLanguage(detected);
    }

    return 'en';
  }

  /**
   * Generate cache key for static metadata
   */
  private generateCacheKey(url: string, language: string): string {
    return `seoinjector_${this.apiKey}_${url}_${language}`;
  }

  /**
   * Generate cache key for dynamic metadata (includes context hash)
   */
  private generateDynamicCacheKey(
    url: string,
    language: string,
    contextHash: string
  ): string {
    return `seoinjector_dynamic_${this.apiKey}_${url}_${language}_${contextHash}`;
  }

  /**
   * Hash context object for cache key generation
   */
  private hashContext(context: Record<string, any>): string {
    const json = JSON.stringify(context, null, 0);
    // Simple hash using built-in crypto (available in modern JS)
    return simpleHash(json);
  }

  /**
   * Clear cache for specific URL
   */
  clearCache(url?: string): void {
    if (url) {
      const language = this.resolveLanguage();
      const cacheKey = this.generateCacheKey(url, language);
      this.cacheStore.delete(cacheKey);
    }
  }

  /**
   * Clear all cached data
   */
  clearAllCache(): void {
    this.cacheStore.clear();
  }

  /**
   * Get existing meta tags from document
   * For backwards compatibility: preserve tags not in API response
   */
  private getExistingMetaTags(): string {
    if (typeof document === 'undefined') {
      return '';
    }

    const head = document.querySelector('head');
    if (!head) return '';

    let html = '';

    // Get title
    const title = document.querySelector('title');
    if (title) {
      html += `<title>${title.textContent}</title>\n`;
    }

    // Get meta tags
    const metas = head.querySelectorAll('meta');
    Array.from(metas).forEach((meta) => {
      const name = meta.getAttribute('name');
      const property = meta.getAttribute('property');
      const content = meta.getAttribute('content');

      if (name && content) {
        html += `<meta name="${name}" content="${content}">\n`;
      } else if (property && content) {
        html += `<meta property="${property}" content="${content}">\n`;
      }
    });

    // Get link tags
    const links = head.querySelectorAll('link[rel], link[hreflang]');
    Array.from(links).forEach((link) => {
      const rel = link.getAttribute('rel');
      const hreflang = link.getAttribute('hreflang');
      const href = link.getAttribute('href');

      if (rel && href) {
        if (hreflang) {
          html += `<link rel="${rel}" hreflang="${hreflang}" href="${href}">\n`;
        } else {
          html += `<link rel="${rel}" href="${href}">\n`;
        }
      }
    });

    return html;
  }
}

/**
 * Simple hash function (not cryptographic)
 * Good enough for cache keys
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'h' + Math.abs(hash).toString(36);
}

export type { Metadata } from './types';