/**
 * In-Memory Cache Store
 * Fast, simple cache that persists for the lifetime of the object
 */

import { APIResponse, CacheStore } from '../types';

export class MemoryCache implements CacheStore {
  private store = new Map<string, { data: APIResponse; expiresAt: number }>();

  /**
   * Get cached data if not expired
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

    return entry.data;
  }

  /**
   * Set cache entry with TTL
   */
  async set(
    key: string,
    value: APIResponse,
    ttl: number
  ): Promise<void> {
    const expiresAt = Date.now() + ttl * 1000;
    this.store.set(key, { data: value, expiresAt });
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
