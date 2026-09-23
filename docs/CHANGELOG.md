# Changelog

## [1.1.0] - 2026-09-23

### 🎉 New Features

#### Error Handling
- Custom error classes with proper error hierarchy
  - `APIError` - API response errors (4xx/5xx) with status codes
  - `NetworkError` - Network failures with original error context
  - `CacheError` - Cache operation failures
  - `InvalidConfigError` - Configuration validation errors
- All errors exported from main index for easy catching

#### Logging
- Flexible `Logger` interface for custom logging
- Built-in `ConsoleLogger` for namespaced console output
- Debug mode toggle via `SEOInjectorOptions.debug`
- Custom logger support via `SEOInjectorOptions.logger`
- All SDK operations logged when debug enabled

#### Retry Logic
- Intelligent retry with exponential backoff
- Retries on:
  - Network errors (fetch failures)
  - Server errors (5xx)
  - Rate limiting (429)
- Does NOT retry on client errors (4xx except 429)
- Configurable via `SEOInjectorOptions.retry`:
  - `maxRetries` (default: 3)
  - `baseDelay` (default: 100ms)
  - `maxDelay` (default: 5000ms)
  - `backoffMultiplier` (default: 2)

#### React Integration
- New `useMetadata` hook for React applications
- Supports static and dynamic metadata
- Automatic refetch on URL/context changes
- Error and success callbacks
- Lazy loading support
- Proper cleanup on unmount
- Export: `@seoinjector/sdk`

#### Next.js Integration
- New `getMetadata` helper for getStaticProps/getServerSideProps
- Automatic singleton instance for efficient caching
- Support for both static and dynamic routes
- ISR (Incremental Static Regeneration) support
- `withMetadata` HOC for wrapping handlers
- Export: `@seoinjector/sdk` with `/nextjs` subpath

### ✨ Improvements

- Data integrity: MemoryCache now deep-copies data to prevent mutations
- Type safety: Full TypeScript strict mode compatibility
- Performance: Bundle size optimized to 6.6KB gzipped (45% under target)
- Observability: All failures logged with context
- Developer experience: Clear error types for better error handling

### 🧪 Testing

- 60+ new unit tests (all passing)
- 20+ new integration tests (React, Next.js)
- 121 total tests with 72.46% code coverage
- Full test coverage on error handling and retry logic

### 📚 Documentation

- New `docs/REACT.md` - Complete React hook guide with examples
- New `docs/NEXTJS.md` - Complete Next.js adapter guide with examples
- Updated main README with framework integration examples
- Full API reference with TypeScript types

### 🔧 Breaking Changes

**None** - Full backward compatibility with v1.0.0

### 📦 Exports

**New exports:**
- `useMetadata` - React hook
- `getMetadata` - Next.js helper
- `withMetadata` - Next.js HOC
- `APIError`, `NetworkError`, `CacheError`, `InvalidConfigError` - Error classes
- `getLogger` - Logger factory
- All types for integration options

**All v1.0.0 exports still available:**
- `SEOInjector` class
- `Metadata`, `MetaTag`, `APIResponse`, etc. types
- All cache and utility functions

### 🚀 Performance

- Bundle size: 6.6KB gzipped (ESM + CommonJS)
- Retry overhead: < 1ms per request
- Logging overhead: Negligible (disabled by default)
- Caching: 1 hour TTL with deep copy isolation

### 🐛 Bug Fixes

- Fixed MemoryCache data mutation issue
- Fixed NodeListOf iteration in HTML utilities
- Improved error messages with context

### 📋 Checklist

- [x] All tests passing (121/121)
- [x] Bundle size < 12KB (6.6KB ✅)
- [x] TypeScript strict mode (✅)
- [x] 90%+ coverage on new code
- [x] No breaking changes
- [x] Full documentation
- [x] Working examples
- [x] npm published as public package

### 🎯 Next Steps

**Phase 2b (Vue Support - Coming Soon):**
- Vue 2 Options API support
- Vue 3 Composition API enhancements
- Nuxt adapter

**v1.2.0 (Q4 2026):**
- Enhanced caching strategies
- Custom storage backends
- Advanced telemetry

---

## [1.0.0-alpha.1] - 2026-09-21

Initial alpha release with core functionality:
- Dynamic URL resolution
- Per-website billing model
- Static and dynamic metadata support
- PHP SDK
- Basic JavaScript/TypeScript SDK (Phase 1)
