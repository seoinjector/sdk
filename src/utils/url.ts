/**
 * URL parsing and manipulation utilities
 */

import { ParsedUrl } from '../types';

/**
 * Get current page URL
 * Browser: window.location.pathname
 * Node.js: must be passed explicitly
 */
export function getCurrentUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.pathname;
  }
  return '/';
}

/**
 * Parse URL into path and query parameters
 */
export function parseUrl(url: string): ParsedUrl {
  const [path, queryString] = url.split('?');
  const query: Record<string, string> = {};

  if (queryString) {
    queryString.split('&').forEach((param) => {
      const [key, value] = param.split('=');
      if (key) {
        query[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    });
  }

  return {
    path: path || '/',
    query,
  };
}

/**
 * Normalize URL path (remove trailing slash unless root)
 */
export function normalizePath(path: string): string {
  if (path === '/' || path === '') return '/';
  return path.replace(/\/$/, '');
}

/**
 * Check if URL is a pattern (contains :param or similar)
 */
export function isPattern(url: string): boolean {
  return /:\w+|\{[\w.]+\}/.test(url);
}
