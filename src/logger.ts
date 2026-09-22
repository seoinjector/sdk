/**
 * Logger Interface and Default Implementation
 */

/**
 * Logger interface for customizable logging
 */
export interface Logger {
  debug(message: string, ...args: any[]): void
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
}

/**
 * No-op logger implementation (used when logging is disabled)
 */
class NoOpLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

/**
 * Default console-based logger implementation
 */
class ConsoleLogger implements Logger {
  constructor(private namespace: string = 'SEOInjector') {}

  debug(message: string, ...args: any[]): void {
    console.debug(`[${this.namespace}:DEBUG]`, message, ...args)
  }

  info(message: string, ...args: any[]): void {
    console.info(`[${this.namespace}:INFO]`, message, ...args)
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.namespace}:WARN]`, message, ...args)
  }

  error(message: string, ...args: any[]): void {
    console.error(`[${this.namespace}:ERROR]`, message, ...args)
  }
}

/**
 * Get logger instance based on debug flag
 * @param debug - Whether to enable logging
 * @param customLogger - Custom logger implementation
 * @returns Logger instance
 */
export function getLogger(debug: boolean, customLogger?: Logger): Logger {
  if (customLogger) {
    return customLogger
  }
  if (debug) {
    return new ConsoleLogger()
  }
  return new NoOpLogger()
}

export { NoOpLogger, ConsoleLogger }
