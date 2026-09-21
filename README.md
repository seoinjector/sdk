# SEO Injector SDK

Universal JavaScript/TypeScript SDK for SEO Injector - Dynamic SEO metadata management for any JavaScript framework.

**Status:** Alpha 1.0  
**Coverage:** 70%+

---

## What is SEO Injector?

SEO Injector is a centralized infrastructure for managing SEO metadata across millions of dynamic URLs. Instead of embedding SEO logic in your application code, define rules once in SEO Injector's dashboard and apply them across your entire site.

**Perfect for:**
- E-commerce platforms (100k+ product URLs)
- Marketplaces (listings, searches, profiles)
- Job boards (millions of job postings)
- Publishing platforms (content at scale)

---

## Installation

```bash
npm install @seoinjector/sdk
```

or

```bash
yarn add @seoinjector/sdk
```

---

## Quick Start

### Static Metadata

```typescript
import { SEOInjector } from '@seoinjector/sdk';

const seo = new SEOInjector('your_api_key');

// Fetch metadata as object
const metadata = await seo
  .setUrl('/about')
  .get();

// Use it
document.title = metadata?.title || 'Default Title';
document.querySelector('meta[name="description"]')?.setAttribute(
  'content',
  metadata?.description || ''
);
```

### Dynamic Metadata

```typescript
const metadata = await seo
  .setUrl('/products/:id')
  .setContext({
    product: {
      id: 12345,
      name: 'Blue Running Shoes',
      description: 'High-performance athletic shoes',
      image: 'https://example.com/shoe.jpg',
    },
  })
  .getDynamic();
```

### Render as HTML

```typescript
const html = await seo
  .setUrl('/about')
  .render();

// Insert into <head>
document.head.insertAdjacentHTML('beforeend', html);
```

---

## API

### Constructor

```typescript
const seo = new SEOInjector(apiKey, options?);
```

**Options:**
```typescript
{
  apiUrl?: string;              // Default: 'https://api.seoinjector.com/api'
  cache?: boolean;              // Default: true
  cacheDuration?: number;       // Default: 3600 (seconds)
  cacheStore?: CacheStore;      // Default: MemoryCache
  debug?: boolean;              // Default: false
}
```

### Methods

#### `setUrl(url: string): this`
Set the page URL or path to fetch metadata for.

```typescript
seo.setUrl('/products/123');
seo.setUrl('/about');
```

#### `setLanguage(language: string): this`
Override language for metadata resolution.

```typescript
seo.setLanguage('en');
seo.setLanguage('en-US');
```

#### `setContext(context: Record<string, any>): this`
Provide application context for dynamic metadata resolution.

```typescript
seo.setContext({
  product: { name: 'Shoes', price: 99.99 },
  user: { id: 123, plan: 'premium' },
});
```

#### `async get(): Promise<Metadata | null>`
Fetch static metadata as an object.

```typescript
const metadata = await seo.setUrl('/about').get();
// { title: 'About Us', description: '...', og_image: '...' }
```

#### `async render(): Promise<string>`
Render static metadata as HTML meta tags.

```typescript
const html = await seo.setUrl('/about').render();
// Returns: <title>About Us</title>\n<meta name="description" content="...">\n...
```

#### `async getDynamic(): Promise<Metadata | null>`
Fetch dynamic metadata (with context) as an object.

```typescript
const metadata = await seo
  .setUrl('/products/:id')
  .setContext({ product: { name: 'Shoes' } })
  .getDynamic();
```

#### `async renderDynamic(): Promise<string>`
Render dynamic metadata as HTML meta tags.

```typescript
const html = await seo
  .setUrl('/products/:id')
  .setContext({ product: { name: 'Shoes' } })
  .renderDynamic();
```

#### `clearCache(url?: string): void`
Clear cached metadata for a specific URL.

```typescript
seo.clearCache('/about');
```

#### `clearAllCache(): void`
Clear all cached metadata.

```typescript
seo.clearAllCache();
```

---

## Chainable API

All methods return `this` for chaining:

```typescript
const metadata = await seo
  .setUrl('/products/:id')
  .setLanguage('fr')
  .setContext({ product: { name: 'Shoes' } })
  .getDynamic();
```

---

## Metadata Object

The `get()` and `getDynamic()` methods return a `Metadata` object:

```typescript
interface Metadata {
  title?: string;
  description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_card?: string;
  twitter_title?: string;
  canonical?: string;
  hreflang?: Array<{
    rel: string;
    hreflang: string;
    href: string;
  }>;
  schema?: Record<string, any>;
  [key: string]: any;
}
```

---

## Backwards Compatibility

If SEO Injector doesn't have metadata for a page, the SDK automatically falls back to existing meta tags in your document. This means:

1. You can deploy incrementally
2. Pages without SEO Injector rules keep their existing metadata
3. No blank meta tags or broken pages

Example:
```html
<head>
  <!-- Existing meta tags -->
  <title>My Site</title>
  <meta name="description" content="Existing description">
</head>
```

When you call `await seo.render()`:
- If SEO Injector has rules → use them
- If not → keep the existing tags
- No duplication, no loss of metadata

---

## Language Detection

The SDK automatically detects language from the browser:

```typescript
// Browser: Uses navigator.language (e.g., "en-US")
await seo.get(); // Automatically uses "en"

// Override
await seo.setLanguage('fr').get(); // Uses "fr"
```

---

## Caching

By default, metadata is cached in-memory for 1 hour:

```typescript
const seo = new SEOInjector('key', {
  cache: true,           // Enable caching
  cacheDuration: 3600,   // 1 hour (in seconds)
});

// Disable caching
const seo = new SEOInjector('key', { cache: false });

// Clear cache
seo.clearCache('/about');
seo.clearAllCache();
```

---

## Error Handling

The SDK handles errors gracefully:

```typescript
try {
  const metadata = await seo.setUrl('/about').get();
  if (!metadata) {
    console.log('No metadata found (falling back to existing)');
  }
} catch (error) {
  console.error('Error fetching metadata:', error);
  // Falls back to existing meta tags automatically
}
```

---

## Debug Mode

Enable debug logging:

```typescript
const seo = new SEOInjector('key', { debug: true });

// Logs:
// [SEO Injector] Fetching metadata for /about
// [SEO Injector] Cache hit for /about
// [SEO Injector] Error fetching metadata: Network error
```

---

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import {
  SEOInjector,
  Metadata,
  APIResponse,
  SEOInjectorOptions,
  CacheStore,
} from '@seoinjector/sdk';

const seo = new SEOInjector('key');
const metadata: Metadata | null = await seo.get();
```

---

## Usage with Frameworks

### React (Coming in v1.1)
```typescript
import { useMetadata } from '@seoinjector/sdk/react';

function Page() {
  const { metadata } = useMetadata('/about');
  
  useEffect(() => {
    if (metadata?.title) {
      document.title = metadata.title;
    }
  }, [metadata]);
}
```

### Next.js
```typescript
// app/products/[id]/page.tsx
import { SEOInjector } from '@seoinjector/sdk';

export async function generateMetadata({ params }) {
  const seo = new SEOInjector(process.env.SEO_INJECTOR_KEY);
  const metadata = await seo
    .setUrl(`/products/${params.id}`)
    .setContext({ productId: params.id })
    .getDynamic();

  return {
    title: metadata?.title,
    description: metadata?.description,
  };
}
```

---

## Performance

- **Bundle size:** ~8KB (gzipped)
- **API latency:** Typically <100ms with cache hit
- **Cache:** In-memory, no overhead
- **Zero dependencies:** Only uses native JavaScript

---

## Support

- **Documentation:** https://github.com/seoinjector/sdk
- **Issues:** https://github.com/seoinjector/sdk/issues
- **Email:** support@seoinjector.com

---

## License

MIT

---

## Roadmap

**v1.0 (Current)**
- ✓ Core SDK (static + dynamic metadata)
- ✓ MemoryCache
- ✓ TypeScript support

**v1.1**
- React hook (useMetadata)
- localStorage cache
- Vue 3 composable
- Framework helpers

**v1.2+**
- IndexedDB cache
- Advanced error retry
- Performance metrics
- OpenTelemetry support

---

## Changelog

### v1.0-alpha.1 (Sept 21, 2026)
- Initial release
- Core SDK with static and dynamic metadata
- MemoryCache
- Full TypeScript support
- 70%+ test coverage
