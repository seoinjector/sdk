/**
 * HTTP Client for SEO Injector API
 */

export class HTTPClient {
  /**
   * Fetch data from URL with error handling
   */
  async fetch<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
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
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof TypeError) {
        // Network error (offline, CORS, etc.)
        throw new Error(`Network error: ${error.message}`);
      }
      throw error;
    }
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
      headers,
    });
  }
}
