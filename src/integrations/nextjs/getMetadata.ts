/**
 * Next.js Integration for SEO Injector SDK
 *
 * Provides helpers for use in getStaticProps, getServerSideProps, and as a HOC wrapper.
 *
 * @example
 * // Direct usage in getStaticProps
 * export async function getStaticProps({ params }) {
 *   const metadata = await getMetadata(process.env.SEO_API_KEY, {
 *     url: `/products/${params.id}`,
 *     context: { id: params.id },
 *     revalidate: 3600
 *   })
 *
 *   return {
 *     props: { metadata },
 *     revalidate: 3600
 *   }
 * }
 *
 * @example
 * // Using withMetadata HOC
 * export const getStaticProps = withMetadata(
 *   async (context) => {
 *     const product = await fetchProduct(context.params.id)
 *     return { props: { product } }
 *   },
 *   (context, props) => ({
 *     apiKey: process.env.SEO_API_KEY,
 *     url: `/products/${context.params.id}`,
 *     context: { id: context.params.id }
 *   })
 * )
 */

import type { SEOInjector, Metadata } from '../../index'
import { SEOInjector as SEOInjectorClient } from '../../client'

/**
 * Options for getMetadata helper
 */
export interface GetMetadataOptions {
  /**
   * Page URL or path to fetch metadata for
   */
  url: string

  /**
   * Language code (e.g., 'en', 'en-US', 'fr')
   */
  language?: string

  /**
   * Dynamic context for metadata resolution
   */
  context?: Record<string, any>

  /**
   * ISR revalidation time in seconds
   */
  revalidate?: number
}

/**
 * Options including API key for getMetadata
 */
export interface GetMetadataWithApiKeyOptions extends GetMetadataOptions {
  apiKey: string
}

// Singleton SEOInjector instance
// Persists across requests for efficient caching
let seoInstance: SEOInjector | null = null

/**
 * Get or create a SEOInjector instance
 * Uses singleton pattern to maintain cache across requests
 *
 * @param apiKey - SEO Injector API key
 * @returns SEOInjector instance
 */
function getSEOInstance(apiKey: string): SEOInjector {
  if (!seoInstance) {
    seoInstance = new SEOInjectorClient(apiKey, {
      cache: true,
      cacheDuration: 3600, // 1 hour cache
      debug: process.env.NODE_ENV === 'development',
    })
  }
  return seoInstance
}

/**
 * Fetch metadata for use in getStaticProps or getServerSideProps
 *
 * Returns metadata that can be passed as a prop to the page component.
 * Handles both static and dynamic metadata based on context presence.
 *
 * @param apiKey - SEO Injector API key
 * @param options - Metadata fetch options
 * @returns Metadata object or null if fetch fails
 *
 * @example
 * export async function getStaticProps({ params }) {
 *   const metadata = await getMetadata(process.env.SEO_API_KEY, {
 *     url: `/products/${params.id}`,
 *     context: { id: params.id },
 *     revalidate: 3600
 *   })
 *
 *   return {
 *     props: { metadata },
 *     revalidate: 3600
 *   }
 * }
 */
export async function getMetadata(
  apiKey: string,
  options: GetMetadataOptions
): Promise<Metadata | null> {
  const seo = getSEOInstance(apiKey)

  try {
    if (options.context) {
      // Dynamic metadata with context
      return await seo
        .setUrl(options.url)
        .setLanguage(options.language || '')
        .setContext(options.context)
        .getDynamic()
    } else {
      // Static metadata
      return await seo
        .setUrl(options.url)
        .setLanguage(options.language || '')
        .get()
    }
  } catch (error) {
    // Log error but don't throw
    // Allows graceful degradation - page renders without metadata
    console.error(
      `[SEO Injector] Failed to fetch metadata for ${options.url}:`,
      error
    )
    return null
  }
}

/**
 * Reset the SEO Injector singleton
 * Useful for testing or when you need a fresh instance
 *
 * @internal
 */
export function resetSEOInstance(): void {
  seoInstance = null
}

/**
 * Higher-order component to wrap getStaticProps or getServerSideProps
 * Automatically fetches metadata and adds it to props
 *
 * @param handler - Original getStaticProps/getServerSideProps handler
 * @param getOptions - Function to compute metadata options from context and props
 * @returns Wrapped handler that includes metadata in props
 *
 * @example
 * export const getStaticProps = withMetadata(
 *   async (context) => {
 *     const product = await fetchProduct(context.params.id)
 *     return { props: { product } }
 *   },
 *   (context, props) => ({
 *     apiKey: process.env.SEO_API_KEY,
 *     url: `/products/${context.params.id}`,
 *     context: { id: context.params.id },
 *     revalidate: 3600
 *   })
 * )
 */
export function withMetadata<P extends Record<string, any>>(
  handler: (context: any) => Promise<{ props: P; revalidate?: number }>,
  getOptions: (
    context: any,
    props: P
  ) => GetMetadataWithApiKeyOptions & { revalidate?: number }
): (context: any) => Promise<{ props: P & { metadata: Metadata | null }; revalidate?: number }> {
  return async (context: any) => {
    const result = await handler(context)
    const options = getOptions(context, result.props)
    const { apiKey, ...metadataOptions } = options

    const metadata = await getMetadata(apiKey, metadataOptions)

    return {
      ...result,
      props: {
        ...result.props,
        metadata,
      },
    }
  }
}
