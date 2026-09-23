/**
 * SEO Injector SDK - Main Entry Point
 */

export { SEOInjector } from './client';

// Types
export type {
  Metadata,
  MetaTag,
  HreflangTag,
  APIResponse,
  CacheStore,
  CacheEntry,
  SEOInjectorOptions,
  ParsedUrl,
  DynamicMetadataOptions,
  EnvironmentInfo,
  RetryConfig,
  Logger,
} from './types';

// Error classes
export {
  SEOInjectorError,
  APIError,
  NetworkError,
  CacheError,
  InvalidConfigError,
} from './errors';

// Logger
export { getLogger } from './logger';

// Cache implementations
export { MemoryCache } from './cache/memory';


// React Integration
export { useMetadata } from './integrations/react/useMetadata';
export type { UseMetadataOptions, UseMetadataReturn } from './integrations/react/useMetadata';

// Next.js Integration
export { getMetadata, withMetadata, resetSEOInstance } from './integrations/nextjs/getMetadata';
export type {
  GetMetadataOptions,
  GetMetadataWithApiKeyOptions
} from './integrations/nextjs/getMetadata';


// Utilities (for advanced usage)
export {
  convertToHtml,
  convertToArray,
  hasExistingSeoInjectorTags,
  removeExistingSeoInjectorTags,
} from './utils/html';

export {
  detectLanguage,
  getPrimaryLanguage,
  languageMatches,
} from './utils/language';

export {
  getCurrentUrl,
  parseUrl,
  normalizePath,
  isPattern,
} from './utils/url';

// HTTP client (for advanced usage)
export { HTTPClient } from './http/client';
