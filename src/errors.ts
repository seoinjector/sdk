/**
 * SEO Injector Error Classes
 *
 * Hierarchy:
 * - SEOInjectorError (base)
 *   - APIError (4xx/5xx responses)
 *   - NetworkError (fetch failures)
 *   - CacheError (cache operation failures)
 *   - InvalidConfigError (bad initialization)
 */

/**
 * Base error class for all SEO Injector errors
 */
export class SEOInjectorError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SEOInjectorError'
    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, SEOInjectorError.prototype)
  }
}

/**
 * Thrown when the API returns a 4xx or 5xx status code
 */
export class APIError extends SEOInjectorError {
  public readonly status: number
  public readonly statusText: string
  public readonly url: string

  constructor(message: string, status: number, statusText: string, url: string) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.statusText = statusText
    this.url = url
    Object.setPrototypeOf(this, APIError.prototype)
  }
}

/**
 * Thrown when network request fails (fetch error)
 */
export class NetworkError extends SEOInjectorError {
  public readonly originalError: Error

  constructor(message: string, originalError: Error) {
    super(message)
    this.name = 'NetworkError'
    this.originalError = originalError
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}

/**
 * Thrown when cache operations fail
 */
export class CacheError extends SEOInjectorError {
  public readonly operation: 'get' | 'set' | 'delete' | 'clear'
  public readonly key?: string

  constructor(message: string, operation: 'get' | 'set' | 'delete' | 'clear', key?: string) {
    super(message)
    this.name = 'CacheError'
    this.operation = operation
    this.key = key
    Object.setPrototypeOf(this, CacheError.prototype)
  }
}

/**
 * Thrown when SDK is initialized with invalid configuration
 */
export class InvalidConfigError extends SEOInjectorError {
  public readonly configKey: string
  public readonly receivedValue: unknown

  constructor(message: string, configKey: string, receivedValue: unknown) {
    super(message)
    this.name = 'InvalidConfigError'
    this.configKey = configKey
    this.receivedValue = receivedValue
    Object.setPrototypeOf(this, InvalidConfigError.prototype)
  }
}
