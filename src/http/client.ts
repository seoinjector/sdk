/**
 * HTTP Client for SEO Injector API with Retry Logic
 */

import { APIError, NetworkError } from '../errors';
import type { RetryConfig, Logger } from '../types';

/**
 * Retry configuration with defaults
 */
export interface RetryOptions extends RetryConfig {
  logger?: Logger;
}

export class HTTPClient {
  private retryConfig: Required<RetryConfig>;
  private logger?: Logger;

  constructor(retryConfig?: RetryConfig, logger?: Logger) {
    this.retryConfig = {
      maxRetries: retryConfig?.maxRetries ?? 3,
      baseDelay: retryConfig?.baseDelay ?? 100,
      maxDelay: retryConfig?.maxDelay ?? 5000,
      backoffMultiplier: retryConfig?.backoffMultiplier ?? 2,
    };
    this.logger = logger;
  }

  /**
   * Sleep for a given duration in milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.retryConfig.baseDelay *
      Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(exponentialDelay, this.retryConfig.maxDelay);
  }

  /**
   * Determine if a response status should trigger a retry
   */
  private shouldRetry(status: number): boolean {
    // Retry on server errors (5xx) and rate limit (429)
    return status === 429 || (status >= 500 && status < 600);
  }

  /**
   * Fetch data from URL with retry logic and error handling
   */
  async fetch<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (!response.ok) {
          const error = new APIError(
            `API error: ${response.status} ${response.statusText}`,
            response.status,
            response.statusText,
            url
          );

          // Retry on server errors and rate limits
          if (this.shouldRetry(response.status) && attempt < this.retryConfig.maxRetries) {
            const delay = this.calculateDelay(attempt);
            this.logger?.warn(
              `API returned ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`
            );
            await this.sleep(delay);
            continue;
          }

          throw error;
        }

        const data = await response.json();
        return data as T;
      } catch (error) {
        lastError = error as Error;

        // Network error - retry unless on last attempt
        if (error instanceof TypeError && attempt < this.retryConfig.maxRetries) {
          const networkError = new NetworkError(
            `Network error: ${(error as Error).message}`,
            error as Error
          );
          const delay = this.calculateDelay(attempt);
          this.logger?.warn(
            `Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`
          );
          await this.sleep(delay);
          continue;
        }

        // Don't retry API errors on last attempt
        if (error instanceof APIError) {
          throw error;
        }

        // Wrap other errors
        if (!(error instanceof NetworkError)) {
          throw new NetworkError(
            `Request failed: ${(error as Error).message}`,
            error as Error
          );
        }

        throw error;
      }
    }

    // All retries exhausted
    this.logger?.error(`Request failed after ${this.retryConfig.maxRetries + 1} attempts`);
    throw lastError || new Error('Request failed after maximum retries');
  }

  /**
   * POST request with JSON body
   */
  async post<T = any>(
    url: string,
    body: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.fetch<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    });
  }

  /**
   * GET request
   */
  async get<T = any>(
    url: string,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.fetch<T>(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...headers,
      },
    });
  }
}
