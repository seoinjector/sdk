# Next.js Adapter: getMetadata

Fetch SEO metadata in Next.js pages with the `getMetadata` helper.

## Installation

```bash
npm install @seoinjector/sdk
```

## Basic Usage

### getStaticProps (Static Generation)

```typescript
// pages/about.tsx
import { getMetadata } from '@seoinjector/sdk/nextjs'
import type { GetStaticProps } from 'next'
import type { Metadata } from '@seoinjector/sdk'

interface Props {
  metadata: Metadata | null
}

export default function AboutPage({ metadata }: Props) {
  return (
    <>
      <head>
        <title>{metadata?.title}</title>
        <meta name="description" content={metadata?.description} />
      </head>
      <h1>{metadata?.title}</h1>
      <p>About us...</p>
    </>
  )
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const metadata = await getMetadata(process.env.SEO_API_KEY!, {
    url: '/about',
    revalidate: 3600,  // ISR: revalidate every hour
  })

  return {
    props: { metadata },
    revalidate: 3600,  // ISR revalidation
  }
}
```

### getServerSideProps (Server-Side Rendering)

```typescript
// pages/blog/[slug].tsx
import { getMetadata } from '@seoinjector/sdk/nextjs'
import type { GetServerSideProps } from 'next'
import type { Metadata } from '@seoinjector/sdk'

interface Props {
  slug: string
  metadata: Metadata | null
}

export default function BlogPost({ slug, metadata }: Props) {
  return (
    <>
      <head>
        <title>{metadata?.title}</title>
        <meta name="description" content={metadata?.description} />
        <meta property="og:image" content={metadata?.ogImage} />
      </head>
      <h1>{metadata?.title}</h1>
      <article>Blog post for {slug}...</article>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const { slug } = context.params as { slug: string }

  const metadata = await getMetadata(process.env.SEO_API_KEY!, {
    url: `/blog/${slug}`,
    context: { slug },  // Pass context to API
  })

  return {
    props: { slug, metadata },
  }
}
```

## API Reference

```typescript
getMetadata(apiKey, options) → Promise<Metadata | null>
```

### Parameters

**apiKey** (string)
- Required. Your SEO Injector API key

**options** (GetMetadataOptions)
- `url` (required) — Page URL/path like '/products/123'
- `language?` — Language code like 'en', 'fr' (defaults to 'en')
- `context?` — Dynamic metadata context object
- `revalidate?` — ISR revalidation time in seconds

### Return Value

- `Metadata | null` — Metadata object or null if fetch fails

## Static Generation (ISR)

Incrementally Static Regeneration (ISR) for best performance:

```typescript
export const getStaticProps: GetStaticProps = async () => {
  const metadata = await getMetadata(process.env.SEO_API_KEY!, {
    url: '/products',
    revalidate: 3600,  // Regenerate page every hour
  })

  return {
    props: { metadata },
    revalidate: 3600,
  }
}
```

ISR benefits:
- Pages regenerated in background (no user impact)
- Old content served while new version generates
- Scales better than SSR or on-demand generation
- Perfect for content that changes infrequently

## Dynamic Routes

```typescript
// pages/products/[id].tsx
import { getMetadata } from '@seoinjector/sdk/nextjs'
import type { GetStaticProps, GetStaticPaths } from 'next'

export const getStaticPaths: GetStaticPaths = async () => {
  // Get list of product IDs to pre-render
  const products = await fetch('/api/products')
    .then(r => r.json())
    .then(data => data.products)

  const paths = products.map(p => ({
    params: { id: p.id }
  }))

  return {
    paths,
    fallback: 'blocking',  // SSR other routes on-demand
  }
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { id } = context.params as { id: string }

  const metadata = await getMetadata(process.env.SEO_API_KEY!, {
    url: `/products/${id}`,
    context: { id },
    revalidate: 3600,
  })

  return {
    props: { metadata, id },
    revalidate: 3600,
  }
}

export default function ProductPage({ metadata, id }: Props) {
  return (
    <>
      <head>
        <title>{metadata?.title}</title>
      </head>
      <h1>{metadata?.title}</h1>
    </>
  )
}
```

## Higher-Order Component: withMetadata

Wrap your getStaticProps or getServerSideProps to automatically add metadata:

```typescript
import { withMetadata } from '@seoinjector/sdk/nextjs'
import type { GetStaticProps } from 'next'

const baseHandler: GetStaticProps = async (context) => {
  const product = await fetchProduct(context.params!.id as string)
  return { props: { product } }
}

export const getStaticProps = withMetadata(
  baseHandler,
  (context, props) => ({
    apiKey: process.env.SEO_API_KEY!,
    url: `/products/${context.params!.id}`,
    context: props.product,
    revalidate: 3600,
  })
)

export default function ProductPage({ product, metadata }: Props) {
  return (
    <>
      <head>
        <title>{metadata?.title}</title>
      </head>
      <h1>{metadata?.title}</h1>
      <p>{product.description}</p>
    </>
  )
}
```

The HOC:
1. Calls your handler first
2. Passes props to getOptions function
3. Fetches metadata automatically
4. Merges metadata into props
5. Returns complete props

## Error Handling

Metadata fetch failures don't fail the page build (graceful degradation):

```typescript
export const getStaticProps: GetStaticProps = async () => {
  // If this fails, metadata is null, but page still builds
  const metadata = await getMetadata(process.env.SEO_API_KEY!, {
    url: '/page',
  })

  return {
    props: { metadata },  // metadata might be null
    revalidate: 3600,
  }
}

export default function Page({ metadata }: Props) {
  return (
    <>
      <head>
        <title>{metadata?.title || 'Default Title'}</title>
      </head>
      <h1>{metadata?.title || 'Untitled'}</h1>
    </>
  )
}
```

## Multiple Languages

Support multiple languages with different metadata:

```typescript
interface Props {
  slug: string
  language: string
  metadata: Metadata | null
}

export const getStaticProps: GetStaticProps<Props> = async (context) => {
  const { slug, language } = context.params as { slug: string; language: string }

  const metadata = await getMetadata(process.env.SEO_API_KEY!, {
    url: `/blog/${slug}`,
    language,  // en, fr, es, etc.
    context: { slug },
    revalidate: 3600,
  })

  return {
    props: { slug, language, metadata },
    revalidate: 3600,
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const languages = ['en', 'fr', 'es']
  const slugs = await fetchBlogSlugs()

  const paths = []
  for (const lang of languages) {
    for (const slug of slugs) {
      paths.push({ params: { language: lang, slug } })
    }
  }

  return { paths, fallback: 'blocking' }
}
```

## App Router (Next.js 13+)

In App Router, use in server components:

```typescript
// app/products/[id]/page.tsx
import { getMetadata } from '@seoinjector/sdk/nextjs'
import type { Metadata } from 'next'

interface Props {
  params: { id: string }
}

// Metadata function (built-in Next.js pattern)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const seoMetadata = await getMetadata(process.env.SEO_API_KEY!, {
    url: `/products/${params.id}`,
    context: { id: params.id },
  })

  return {
    title: seoMetadata?.title,
    description: seoMetadata?.description,
    openGraph: {
      title: seoMetadata?.title,
      description: seoMetadata?.description,
      images: seoMetadata?.ogImage ? [seoMetadata.ogImage] : [],
    },
  }
}

export default function ProductPage({ params }: Props) {
  return <h1>Product {params.id}</h1>
}
```

## Caching Strategy

The SDK maintains a singleton instance that:
1. Caches metadata for 1 hour (by default)
2. Reuses the same instance across requests
3. Significantly reduces API calls during builds

Metadata is cached at two levels:
1. **In-memory cache** — During the same build/request
2. **ISR revalidation** — Between page regenerations

## Performance Best Practices

### 1. Use ISR for Most Pages

```typescript
// ✅ Good - Regenerates in background
export const getStaticProps: GetStaticProps = async () => {
  const metadata = await getMetadata(apiKey, {
    url: '/page',
    revalidate: 3600,
  })
  return { props: { metadata }, revalidate: 3600 }
}

// ❌ Avoid - SSR every request
export const getServerSideProps: GetServerSideProps = async () => {
  const metadata = await getMetadata(apiKey, { url: '/page' })
  return { props: { metadata } }
}
```

### 2. Pre-render Dynamic Routes

```typescript
// ✅ Good - Pre-render popular products
export const getStaticPaths: GetStaticPaths = async () => {
  const popularIds = await getPopularProductIds(1000)
  const paths = popularIds.map(id => ({ params: { id } }))
  return { paths, fallback: 'blocking' }
}

// Fallback to SSR for less popular products
```

### 3. Set Appropriate ISR Times

```typescript
// Homepage - changes daily
revalidate: 86400  // 24 hours

// Product pages - changes weekly
revalidate: 604800  // 7 days

// Blog posts - rarely changes
revalidate: 2592000  // 30 days

// User-generated - changes often
revalidate: 3600  // 1 hour
```

## Troubleshooting

### Metadata is null

- Verify API key via environment variable
- Check URL matches what you configured
- Inspect Next.js build logs

### Build is slow

- ISR revalidate too frequent? Increase from 3600 to 86400
- Using getServerSideProps? Switch to getStaticProps + ISR
- Pre-render fewer dynamic routes

### Stale metadata served

- ISR respects revalidate setting
- Request new page build from dashboard
- Force rebuild: `next build && next start`

## Examples

See the full example app at `examples/nextjs-example/`.

```bash
cd examples/nextjs-example
npm install
npm run dev
```

Then visit http://localhost:3000 to see the adapter in action.
