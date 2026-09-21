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
} from './types';

// Cache implementations
export { MemoryCache } from './cache/memory';

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
