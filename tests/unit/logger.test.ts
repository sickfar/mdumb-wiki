import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getLogger, clearLoggerCache } from '../../server/utils/logger'
import { clearConfigCache } from '../../server/utils/config'

describe('Logger', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Clear caches before each test
    clearLoggerCache()
    clearConfigCache()
  })

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv }
    clearLoggerCache()
    clearConfigCache()
  })

  describe('getLogger', () => {
    it('should return a pino logger instance', async () => {
      const logger = await getLogger()

      expect(logger).toBeDefined()
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.debug).toBe('function')
    })

    it('should respect log level from config', async () => {
      process.env.LOG_LEVEL = 'debug'

      const logger = await getLogger()

      expect(logger).toBeDefined()
      // Pino logger has a level property
      expect(logger.level).toBe('debug')
    })

    it('should use info level by default', async () => {
      const logger = await getLogger()

      expect(logger.level).toBe('info')
    })

    it('should cache logger instance', async () => {
      const logger1 = await getLogger()
      const logger2 = await getLogger()

      // Should return the same instance
      expect(logger1).toBe(logger2)
    })

    it('should create new logger after cache clear', async () => {
      const logger1 = await getLogger()

      clearLoggerCache()

      const logger2 = await getLogger()

      // Should be different instances
      expect(logger1).not.toBe(logger2)
    })

    it('should handle different log levels', async () => {
      const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']

      for (const level of levels) {
        clearLoggerCache()
        clearConfigCache()
        process.env.LOG_LEVEL = level

        const logger = await getLogger()
        expect(logger.level).toBe(level)
      }
    })
  })
})
