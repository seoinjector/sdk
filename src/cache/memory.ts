/**
 * In-Memory Cache Store
 * Fast, simple cache that persists for the lifetime of the object
 * Uses deep copy to prevent data mutation across references
 */

import { APIResponse, CacheStore } from '../types';

/**
 * Deep copy an object using JSON serialization
 * Works for any JSON-serializable object
 */
function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export class MemoryCache implements CacheStore {
  private store = new Map<string, { data: APIResponse; expiresAt: number }>();

  /**
   * Get cached data if not expired
   * Returns a deep copy to prevent external mutations
   */
  async get(key: string): Promise<APIResponse | null> {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    // Return a deep copy to prevent mutations from affecting cache
    return deepCopy(entry.data);
  }

  /**
   * Set cache entry with TTL
   * Stores a deep copy to prevent mutations of original data
   */
  async set(
    key: string,
    value: APIResponse,
    ttl: number
  ): Promise<void> {
    const expiresAt = Date.now() + ttl * 1000;
    // Store a deep copy to prevent mutations of original data
    this.store.set(key, { data: deepCopy(value), expiresAt });
  }

  /**
   * Delete specific cache entry
   */
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.store.clear();
  }

  /**
   * Get cache size (for debugging)
   */
  size(): number {
    return this.store.size;
  }
}
