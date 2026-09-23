# React Hook: useMetadata

Fetch SEO metadata in React applications with the `useMetadata` hook.

## Installation

```bash
npm install @seoinjector/sdk
```

## Basic Usage

```jsx
import { SEOInjector, useMetadata } from '@seoinjector/sdk'

// Create a singleton instance
const seo = new SEOInjector(process.env.REACT_APP_SEO_API_KEY)

export function AboutPage() {
  const { metadata, loading, error } = useMetadata(seo, {
    url: '/about'
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <>
      <head>
        <title>{metadata?.title}</title>
        <meta name="description" content={metadata?.description} />
      </head>
      <h1>{metadata?.title}</h1>
    </>
  )
}
```

## Hook API

```typescript
useMetadata(seo, options?) → { metadata, loading, error }
```

### Parameters

**seo** (SEOInjector)
- Required. SEOInjector instance to use for fetching metadata

**options** (UseMetadataOptions)
- `url?: string` — Page URL/path (defaults to current location)
- `language?: string` — Language code like 'en', 'fr' (defaults to browser language)
- `context?: Record<string, any>` — Dynamic metadata context
- `enabled?: boolean` — Enable/disable fetching (default: true)
- `onSuccess?: (metadata) => void` — Called when fetch succeeds
- `onError?: (error) => void` — Called when fetch fails

### Return Value

```typescript
{
  metadata: Metadata | null      // Fetched metadata or null
  loading: boolean               // True while fetching
  error: Error | null            // Error if fetch failed
}
```

## Static Metadata

For pages with the same metadata regardless of props:

```jsx
export function ProductListingPage() {
  const { metadata } = useMetadata(seo, {
    url: '/products'
  })

  return (
    <div>
      <head>
        <title>{metadata?.title}</title>
        <meta name="description" content={metadata?.description} />
      </head>
      {/* ... */}
    </div>
  )
}
```

## Dynamic Metadata

For pages where metadata changes based on props (products, blog posts, etc.):

```jsx
export function ProductPage({ productId }) {
  const { metadata, loading } = useMetadata(seo, {
    url: `/products/${productId}`,
    context: {
      id: productId,
      // Add any data the API needs to generate metadata
    }
  })

  return (
    <div>
      {loading && <div>Loading metadata...</div>}
      <head>
        <title>{metadata?.title}</title>
        <meta name="description" content={metadata?.description} />
        {metadata?.tags?.map(tag => (
          <meta key={tag.name} {...tag} />
        ))}
      </head>
      {/* ... */}
    </div>
  )
}
```

## Error Handling

```jsx
export function Page() {
  const { metadata, error } = useMetadata(seo, {
    url: '/page',
    onError: (err) => {
      console.error('Failed to fetch metadata:', err)
      // Could send to error tracking service
    }
  })

  if (error) {
    return <div>Metadata error: {error.message}</div>
  }

  return <div>{metadata?.title}</div>
}
```

## Callbacks

Use callbacks to react to fetch completion:

```jsx
export function Page() {
  const { metadata } = useMetadata(seo, {
    url: '/page',
    onSuccess: (meta) => {
      // Update page title, og:image, etc.
      if (meta) {
        document.title = meta.title || 'My Site'
      }
    },
    onError: (err) => {
      // Log to monitoring service
      Sentry.captureException(err)
    }
  })

  return <div>{metadata?.title}</div>
}
```

## Lazy Loading

Skip fetching until needed:

```jsx
export function Page({ showAdvanced }) {
  const { metadata } = useMetadata(seo, {
    url: '/advanced',
    enabled: showAdvanced,  // Only fetch when true
  })

  return showAdvanced ? <div>{metadata?.title}</div> : null
}
```

## Language Support

Specify language for multi-language sites:

```jsx
export function Page({ language = 'en' }) {
  const { metadata } = useMetadata(seo, {
    url: '/page',
    language,  // 'en', 'fr', 'es', etc.
  })

  return <div>{metadata?.title}</div>
}
```

## Multiple Languages

Fetch metadata for different languages:

```jsx
export function LanguageSwitcher({ productId }) {
  const en = useMetadata(seo, {
    url: `/products/${productId}`,
    language: 'en',
    context: { id: productId }
  })

  const fr = useMetadata(seo, {
    url: `/products/${productId}`,
    language: 'fr',
    context: { id: productId }
  })

  return (
    <div>
      <h1>English: {en.metadata?.title}</h1>
      <h1>French: {fr.metadata?.title}</h1>
    </div>
  )
}
```

## Best Practices

### 1. Create a Singleton

```jsx
// lib/seo.ts
import { SEOInjector } from '@seoinjector/sdk'

export const seo = new SEOInjector(
  process.env.REACT_APP_SEO_API_KEY || 'default_key'
)
```

Then import and reuse:

```jsx
import { seo } from './lib/seo'

export function Page() {
  const { metadata } = useMetadata(seo, { url: '/page' })
  return <div>{metadata?.title}</div>
}
```

### 2. Use with React Helmet or Next.js Head

```jsx
import Head from 'next/head'
import { useMetadata } from '@seoinjector/sdk'

export function Page() {
  const { metadata } = useMetadata(seo, { url: '/page' })

  return (
    <>
      <Head>
        <title>{metadata?.title}</title>
        <meta name="description" content={metadata?.description} />
        {metadata?.tags?.map(tag => (
          <meta key={`${tag.name}-${tag.content}`} {...tag} />
        ))}
      </Head>
      <h1>{metadata?.title}</h1>
    </>
  )
}
```

### 3. Handle Loading States

```jsx
export function Page() {
  const { metadata, loading } = useMetadata(seo, { url: '/page' })

  return (
    <div>
      {loading ? (
        <div className="skeleton" />
      ) : (
        <h1>{metadata?.title}</h1>
      )}
    </div>
  )
}
```

### 4. Set Error Boundaries

```jsx
export function Page() {
  const { metadata, error } = useMetadata(seo, {
    url: '/page',
    onError: (err) => {
      // Notify user or log
      console.error('Metadata fetch failed:', err)
    }
  })

  return (
    <div>
      {error && (
        <div className="error">
          Failed to load page metadata
        </div>
      )}
      <h1>{metadata?.title || 'Untitled'}</h1>
    </div>
  )
}
```

## Performance Tips

### 1. Caching

The hook automatically caches metadata for 1 hour. Subsequent requests for the same URL/language return cached data instantly.

### 2. Avoid Multiple Instances

Create one SEOInjector instance and reuse it:

```jsx
// ❌ Bad - creates new instance on every render
export function Page() {
  const seo = new SEOInjector(apiKey)  // 🔴 Don't do this
  const { metadata } = useMetadata(seo)
  return <div>{metadata?.title}</div>
}

// ✅ Good - singleton instance
const seo = new SEOInjector(apiKey)
export function Page() {
  const { metadata } = useMetadata(seo)
  return <div>{metadata?.title}</div>
}
```

### 3. Prefetch Metadata

Prefetch metadata for links before user navigates:

```jsx
export function Link({ to, label }) {
  const prefetch = () => {
    useMetadata(seo, { url: to })
  }

  return (
    <a href={to} onMouseEnter={prefetch}>
      {label}
    </a>
  )
}
```

## Troubleshooting

### Metadata is null

- Verify API key is correct
- Check that URL matches what you configured in SEO Injector
- Inspect browser console for error messages
- Ensure `enabled: true` (default)

### Fetch is slow

- First fetch is normal (hits API)
- Subsequent requests should be instant (from cache)
- Check API health at SEO Injector dashboard

### Fetch fails after successful requests

- API might be rate-limited (429 status)
- SDK retries automatically with exponential backoff
- Check SEO Injector logs for errors

### Hook re-fetches too often

- This happens when `context` object reference changes
- Memoize context: `useMemo(() => ({ id }), [id])`
- Or stringify context in dependencies

```jsx
const [id, setId] = useState('123')
const context = useMemo(() => ({ id }), [id])

const { metadata } = useMetadata(seo, {
  url: `/products/${id}`,
  context,
})
```

## Examples

See the full example app at `examples/react-example/`.

```bash
cd examples/react-example
npm install
npm start
```

Then visit http://localhost:3000 to see the hook in action.
