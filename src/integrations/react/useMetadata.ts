/**
 * React Hook: useMetadata
 *
 * Fetches SEO metadata for the current page or a specified URL.
 * Supports both static and dynamic metadata with automatic refetching on URL/context changes.
 *
 * @example
 * const { metadata, loading, error } = useMetadata(seo, {
 *   url: '/products/123',
 *   context: { productId: '123' }
 * })
 */

import { useEffect, useState } from 'react'
import type { SEOInjector, Metadata } from '../../index'

/**
 * Options for useMetadata hook
 */
export interface UseMetadataOptions {
  /**
   * Page URL or path to fetch metadata for
   * @default window.location.pathname (in browser)
   */
  url?: string

  /**
   * Language code (e.g., 'en', 'en-US', 'fr')
   * @default navigator.language (in browser) or 'en'
   */
  language?: string

  /**
   * Dynamic context for metadata resolution
   * Used for dynamic URLs with template variables
   */
  context?: Record<string, any>

  /**
   * Enable/disable metadata fetching
   * Useful for lazy loading
   * @default true
   */
  enabled?: boolean

  /**
   * Callback when metadata fetch succeeds
   */
  onSuccess?: (metadata: Metadata | null) => void

  /**
   * Callback when metadata fetch fails
   */
  onError?: (error: Error) => void
}

/**
 * Return type of useMetadata hook
 */
export interface UseMetadataReturn {
  /**
   * The fetched metadata object
   * Null while loading or if fetch failed
   */
  metadata: Metadata | null

  /**
   * True while fetching metadata
   */
  loading: boolean

  /**
   * Error object if fetch failed, null otherwise
   */
  error: Error | null
}

/**
 * React hook to fetch and manage SEO metadata
 *
 * @param seo - SEOInjector instance
 * @param options - Hook configuration
 * @returns Object with metadata, loading state, and error
 *
 * @example
 * // Static metadata
 * const { metadata, loading } = useMetadata(seo, {
 *   url: '/about'
 * })
 *
 * @example
 * // Dynamic metadata with context
 * const { metadata, loading, error } = useMetadata(seo, {
 *   url: `/products/${productId}`,
 *   context: { product: { id: productId, name: productName } },
 *   onError: (err) => console.error(err)
 * })
 *
 * @example
 * // Lazy loading
 * const { metadata } = useMetadata(seo, {
 *   enabled: showMetadata,  // Only fetch when true
 *   url: '/lazy-page'
 * })
 */
export function useMetadata(
  seo: SEOInjector,
  options: UseMetadataOptions = {}
): UseMetadataReturn {
  const [metadata, setMetadata] = useState<Metadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Skip fetch if disabled
    if (options.enabled === false) {
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchMetadata = async (): Promise<void> => {
      try {
        setLoading(true)
        setError(null)

        let result: Metadata | null

        // Fetch dynamic or static metadata based on context
        if (options.context) {
          result = await seo
            .setUrl(options.url || '')
            .setLanguage(options.language || '')
            .setContext(options.context)
            .getDynamic()
        } else {
          result = await seo
            .setUrl(options.url || '')
            .setLanguage(options.language || '')
            .get()
        }

        // Only update state if component is still mounted
        if (!cancelled) {
          setMetadata(result)
          options.onSuccess?.(result)
        }
      } catch (err) {
        // Only update state if component is still mounted
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error(String(err))
          setError(error)
          options.onError?.(error)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchMetadata()

    // Cleanup function to prevent memory leaks
    return (): void => {
      cancelled = true
    }
  }, [
    seo,
    options.url,
    options.language,
    // Serialize context for proper dependency comparison
    // JSON.stringify ensures we compare values, not object identity
    JSON.stringify(options.context),
    options.enabled,
    options.onSuccess,
    options.onError,
  ])

  return { metadata, loading, error }
}
