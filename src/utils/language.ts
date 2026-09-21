/**
 * Language detection and resolution
 */

/**
 * Detect language from browser or environment
 */
export function detectLanguage(): string | null {
  // Browser: Use navigator.language
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language; // e.g., "en-US"
  }

  // Node.js: Could be extracted from request headers, but not available here
  // User must explicitly call setLanguage() in Node.js context
  return null;
}

/**
 * Extract primary language code from full locale
 * e.g., "en-US" -> "en"
 */
export function getPrimaryLanguage(locale: string): string {
  const parts = locale.split('-');
  return parts[0].toLowerCase();
}

/**
 * Check if two language codes match (ignoring region)
 * e.g., "en-US" matches "en"
 */
export function languageMatches(locale: string, target: string): boolean {
  const primaryLocale = getPrimaryLanguage(locale);
  const primaryTarget = getPrimaryLanguage(target);
  return primaryLocale === primaryTarget;
}
