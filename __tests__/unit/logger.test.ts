/**
 * Tests for Logger Interface and Implementation
 */

import { getLogger, ConsoleLogger } from '../../src/logger';
import type { Logger } from '../../src/logger';

describe('Logger', () => {
  describe('getLogger', () => {
    it('should return NoOpLogger when debug is false and no custom logger provided', () => {
      const logger = getLogger(false);
      expect(logger).toBeDefined();
      // NoOpLogger methods should not throw
      expect(() => {
        logger.debug('test');
        logger.info('test');
        logger.warn('test');
        logger.error('test');
      }).not.toThrow();
    });

    it('should return ConsoleLogger when debug is true', () => {
      const logger = getLogger(true);
      expect(logger).toBeInstanceOf(ConsoleLogger);
    });

    it('should return custom logger when provided', () => {
      const customLogger: Logger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      const logger = getLogger(false, customLogger);
      expect(logger).toBe(customLogger);
    });

    it('should prefer custom logger over debug flag', () => {
      const customLogger: Logger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      const logger = getLogger(true, customLogger);
      expect(logger).toBe(customLogger);
    });
  });

  describe('ConsoleLogger', () => {
    let consoleDebugSpy: jest.SpyInstance;
    let consoleInfoSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
      consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleDebugSpy.mockRestore();
      consoleInfoSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should call console.debug for debug messages', () => {
      const logger = new ConsoleLogger();
      logger.debug('debug message');
      expect(consoleDebugSpy).toHaveBeenCalledWith('[SEOInjector:DEBUG]', 'debug message');
    });

    it('should call console.info for info messages', () => {
      const logger = new ConsoleLogger();
      logger.info('info message');
      expect(consoleInfoSpy).toHaveBeenCalledWith('[SEOInjector:INFO]', 'info message');
    });

    it('should call console.warn for warn messages', () => {
      const logger = new ConsoleLogger();
      logger.warn('warn message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[SEOInjector:WARN]', 'warn message');
    });

    it('should call console.error for error messages', () => {
      const logger = new ConsoleLogger();
      logger.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[SEOInjector:ERROR]', 'error message');
    });

    it('should include namespace in log messages', () => {
      const logger = new ConsoleLogger('CustomNamespace');
      logger.debug('test');
      expect(consoleDebugSpy).toHaveBeenCalledWith('[CustomNamespace:DEBUG]', 'test');
    });

    it('should support additional arguments', () => {
      const logger = new ConsoleLogger();
      const obj = { key: 'value' };
      logger.debug('message', obj, 123);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[SEOInjector:DEBUG]',
        'message',
        obj,
        123
      );
    });

    it('should handle empty message', () => {
      const logger = new ConsoleLogger();
      logger.debug('');
      expect(consoleDebugSpy).toHaveBeenCalledWith('[SEOInjector:DEBUG]', '');
    });

    it('should handle multiple additional arguments', () => {
      const logger = new ConsoleLogger();
      logger.info('message', 'arg1', 'arg2', 'arg3');
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[SEOInjector:INFO]',
        'message',
        'arg1',
        'arg2',
        'arg3'
      );
    });
  });

  describe('Custom Logger Implementation', () => {
    it('should work with custom logger implementation', () => {
      const logs: { level: string; message: string; args: any[] }[] = [];

      const customLogger: Logger = {
        debug: (msg, ...args) => logs.push({ level: 'debug', message: msg, args }),
        info: (msg, ...args) => logs.push({ level: 'info', message: msg, args }),
        warn: (msg, ...args) => logs.push({ level: 'warn', message: msg, args }),
        error: (msg, ...args) => logs.push({ level: 'error', message: msg, args }),
      };

      const logger = getLogger(false, customLogger);

      logger.debug('debug msg');
      logger.info('info msg');
      logger.warn('warn msg');
      logger.error('error msg');

      expect(logs).toHaveLength(4);
      expect(logs[0]).toEqual({ level: 'debug', message: 'debug msg', args: [] });
      expect(logs[1]).toEqual({ level: 'info', message: 'info msg', args: [] });
      expect(logs[2]).toEqual({ level: 'warn', message: 'warn msg', args: [] });
      expect(logs[3]).toEqual({ level: 'error', message: 'error msg', args: [] });
    });

    it('should capture arguments in custom logger', () => {
      const logs: any[] = [];

      const customLogger: Logger = {
        debug: (msg, ...args) => logs.push({ msg, args }),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      const logger = getLogger(false, customLogger);
      logger.debug('test', { data: 'value' }, 123);

      expect(logs).toHaveLength(1);
      expect(logs[0].msg).toBe('test');
      expect(logs[0].args).toEqual([{ data: 'value' }, 123]);
    });
  });

  describe('Logger Interface', () => {
    it('should implement all required methods', () => {
      const logger = getLogger(true);
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });
  });
});
