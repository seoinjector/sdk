/**
 * HTML meta tag conversion and parsing
 * Includes backwards compatibility: preserves existing tags not in API response
 */

import { APIResponse, MetaTag, Metadata } from '../types';

/**
 * Convert API response to HTML meta tags
 * Includes fallback to existing tags if they're not in the API response
 */
export function convertToHtml(
  data: APIResponse | null,
  existingHtml?: string
): string {
  if (!data || !data.metaTags || data.metaTags.length === 0) {
    // If no data, return existing HTML (backwards compatibility)
    return existingHtml || '';
  }

  const html = ['<!-- SEO Injector -->'];
  const injectedTags = new Set<string>(); // Track which tags we injected

  // Process API response tags
  for (const tag of data.metaTags) {
    if (!tag || typeof tag !== 'object') continue;

    // Handle title tag
    if (tag.name === 'title' && tag.content) {
      html.push(`<title>${escapeHtml(tag.content)}</title>`);
      injectedTags.add('title');
      continue;
    }

    // Handle meta tags with name attribute
    if (tag.name && tag.content) {
      html.push(
        `<meta name="${escapeHtml(tag.name)}" content="${escapeHtml(tag.content)}">`
      );
      injectedTags.add(`meta[name="${tag.name}"]`);
      continue;
    }

    // Handle meta tags with property attribute (Open Graph, Twitter)
    if (tag.property && tag.content) {
      html.push(
        `<meta property="${escapeHtml(tag.property)}" content="${escapeHtml(tag.content)}">`
      );
      injectedTags.add(`meta[property="${tag.property}"]`);
      continue;
    }

    // Handle link tags (canonical, alternate, etc.)
    if (tag.rel && tag.href) {
      html.push(
        `<link rel="${escapeHtml(tag.rel)}" href="${escapeHtml(tag.href)}">`
      );
      injectedTags.add(`link[rel="${tag.rel}"]`);
      continue;
    }
  }

  // Handle hreflang tags
  if (data.hreflangTags && data.hreflangTags.length > 0) {
    for (const tag of data.hreflangTags) {
      if (tag.href && tag.hreflang && tag.rel) {
        html.push(
          `<link rel="${escapeHtml(tag.rel)}" hreflang="${escapeHtml(tag.hreflang)}" href="${escapeHtml(tag.href)}">`
        );
        injectedTags.add(`link[hreflang="${tag.hreflang}"]`);
      }
    }
  }

  // Backwards compatibility: preserve existing tags not in API response
  if (existingHtml) {
    const preservedTags = preserveExistingTags(existingHtml, injectedTags);
    html.push(...preservedTags);
  }

  // Handle JSON-LD schema
  if (data.schemaJson) {
    const schema = typeof data.schemaJson === 'string'
      ? data.schemaJson
      : JSON.stringify(data.schemaJson);
    html.push(`<script type="application/ld+json">${schema}</script>`);
  }

  html.push('<!-- /SEO Injector -->');

  return html.join('\n');
}

/**
 * Convert API response to metadata object
 */
export function convertToArray(data: APIResponse | null): Metadata | null {
  if (!data || !data.metaTags) {
    return null;
  }

  const result: Metadata = {};

  for (const tag of data.metaTags) {
    if (!tag || typeof tag !== 'object') continue;

    // Extract title
    if (tag.name === 'title' && tag.content) {
      result.title = tag.content;
      continue;
    }

    // Extract by name attribute
    if (tag.name && tag.content) {
      result[tag.name] = tag.content;
    }

    // Extract by property attribute (Open Graph, Twitter)
    if (tag.property && tag.content) {
      // Convert property format: "og:title" -> "og_title"
      const key = tag.property.replace(/:/g, '_');
      result[key] = tag.content;
    }
  }

  // Handle hreflang tags
  if (data.hreflangTags && data.hreflangTags.length > 0) {
    result.hreflang = data.hreflangTags.map((tag) => ({
      rel: tag.rel,
      hreflang: tag.hreflang,
      href: tag.href,
    }));
  }

  // Add schema if present
  if (data.schemaJson) {
    result.schema = data.schemaJson;
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Extract and preserve existing meta tags not touched by SEO Injector
 * This implements backwards compatibility: keep tags not in the API response
 */
function preserveExistingTags(
  existingHtml: string,
  injectedTags: Set<string>
): string[] {
  const preserved: string[] = [];

  // Skip if no existing HTML
  if (!existingHtml) return preserved;

  // Parse existing tags
  const titleMatch = existingHtml.match(/<title>([^<]*)<\/title>/i);
  if (titleMatch && !injectedTags.has('title')) {
    preserved.push(`<title>${titleMatch[1]}</title>`);
  }

  // Meta tags with name attribute
  const nameTagRegex = /<meta\s+name=["']([^"']+)["']\s+content=["']([^"']+)["']/gi;
  let match;
  while ((match = nameTagRegex.exec(existingHtml)) !== null) {
    const name = match[1];
    const content = match[2];
    if (!injectedTags.has(`meta[name="${name}"]`)) {
      preserved.push(`<meta name="${escapeHtml(name)}" content="${escapeHtml(content)}">`);
    }
  }

  // Meta tags with property attribute (OG, Twitter)
  const propertyTagRegex = /<meta\s+property=["']([^"']+)["']\s+content=["']([^"']+)["']/gi;
  while ((match = propertyTagRegex.exec(existingHtml)) !== null) {
    const property = match[1];
    const content = match[2];
    if (!injectedTags.has(`meta[property="${property}"]`)) {
      preserved.push(`<meta property="${escapeHtml(property)}" content="${escapeHtml(content)}">`);
    }
  }

  // Link tags (canonical, alternate, etc.)
  const linkRegex = /<link\s+rel=["']([^"']+)["']\s+href=["']([^"']+)["']/gi;
  while ((match = linkRegex.exec(existingHtml)) !== null) {
    const rel = match[1];
    const href = match[2];
    if (!injectedTags.has(`link[rel="${rel}"]`)) {
      preserved.push(`<link rel="${escapeHtml(rel)}" href="${escapeHtml(href)}">`);
    }
  }

  return preserved;
}

/**
 * Check if existing HTML contains SEO Injector markers
 */
export function hasExistingSeoInjectorTags(html: string): boolean {
  return html.includes('<!-- SEO Injector -->');
}

/**
 * Remove existing SEO Injector tags before injection
 */
export function removeExistingSeoInjectorTags(html: string): string {
  return html.replace(
    /<!-- SEO Injector -->[\s\S]*?<!-- \/SEO Injector -->/g,
    ''
  );
}
