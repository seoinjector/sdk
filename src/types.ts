/**
 * SEO Injector SDK - Type Definitions
 */

/**
 * Represents SEO metadata returned from API or resolved locally
 */
export interface Metadata {
  title?: string;
  description?: string;
  [key: string]: any;
}

/**
 * Individual meta tag from API response
 */
export interface MetaTag {
  name?: string;
  property?: string;
  rel?: string;
  href?: string;
  hreflang?: string;
  content?: string;
}

/**
 * hreflang tag for multi-language support
 */
export interface HreflangTag {
  hreflang: string;
  rel: string;
  href: string;
}

/**
 * Complete API response structure
 */
export interface APIResponse {
  metaTags: MetaTag[];
  hreflangTags?: HreflangTag[];
  schemaJson?: string | Record<string, any>;
  error?: string;
  status?: number;
}

/**
 * Cache entry with expiration
 */
export interface CacheEntry {
  data: APIResponse;
  expiresAt: number;
}

/**
 * Abstract cache storage interface
 */
export interface CacheStore {
  get(key: string): Promise<APIResponse | null>;
  set(key: string, value: APIResponse, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Retry configuration for failed requests
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Initial delay in milliseconds
   * @default 100
   */
  baseDelay?: number;

  /**
   * Maximum delay in milliseconds
   * @default 5000
   */
  maxDelay?: number;

  /**
   * Exponential backoff multiplier
   * @default 2
   */
  backoffMultiplier?: number;
}

/**
 * Logger interface for custom logging
 */
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

/**
 * Configuration options for SEOInjector
 */
export interface SEOInjectorOptions {
  /**
   * API endpoint URL
   * @default "https://api.seoinjector.com/api"
   */
  apiUrl?: string;

  /**
   * Enable caching
   * @default true
   */
  cache?: boolean;

  /**
   * Cache duration in seconds
   * @default 3600 (1 hour)
   */
  cacheDuration?: number;

  /**
   * Custom cache store implementation
   * @default MemoryCache
   */
  cacheStore?: CacheStore;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * Custom logger implementation
   * @default ConsoleLogger (if debug=true) or NoOpLogger (if debug=false)
   */
  logger?: Logger;

  /**
   * Retry configuration for failed requests
   * @default { maxRetries: 3, baseDelay: 100, maxDelay: 5000, backoffMultiplier: 2 }
   */
  retry?: RetryConfig;
}

/**
 * Parsed URL structure
 */
export interface ParsedUrl {
  path: string;
  query: Record<string, string>;
}

/**
 * Dynamic metadata fetch options
 */
export interface DynamicMetadataOptions {
  url: string;
  context: Record<string, any>;
  language?: string;
}

/**
 * Environment detection flags
 */
export interface EnvironmentInfo {
  isBrowser: boolean;
  isNode: boolean;
  supportsLocalStorage: boolean;
  supportsIndexedDB: boolean;
}
