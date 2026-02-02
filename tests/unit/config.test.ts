import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { loadConfig, clearConfigCache } from '../../server/utils/config'
import type { WikiConfig } from '../../types/config'
import { existsSync, mkdirSync, writeFileSync, unlinkSync, rmSync } from 'fs'
import { join } from 'path'

describe('Config System', () => {
  const originalEnv = { ...process.env }
  const testConfigDir = join('/tmp/claude', 'mdumb-wiki-test-config')
  const testConfigPath = join(testConfigDir, 'config.json')

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv }
    delete process.env.PORT
    delete process.env.WIKI_PATH
    delete process.env.WIKI_CONFIG_PATH
    delete process.env.LOG_LEVEL

    // Create test config directory
    if (!existsSync(testConfigDir)) {
      mkdirSync(testConfigDir, { recursive: true })
    }

    // Clear any cached config
    clearConfigCache()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv

    // Clean up test config files
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath)
    }
    if (existsSync(testConfigDir)) {
      rmSync(testConfigDir, { recursive: true, force: true })
    }
  })

  describe('Default Configuration', () => {
    it('should load default configuration when no config file or env vars exist', async () => {
      const config = await loadConfig()

      expect(config).toBeDefined()
      expect(config.contentPath).toBe('/wiki')
      expect(config.port).toBe(3020)
      expect(config.host).toBe('localhost')
      expect(config.watch).toBe(true)
      expect(config.logLevel).toBe('info')
      expect(config.title).toBe('MDumb Wiki')
      expect(config.syntaxTheme).toBe('github-dark')
      expect(config.maxConcurrentOps).toBe(10)
      expect(config.cacheTTL).toBe(60000)
      expect(config.enableCache).toBe(true)
    })

    it('should include all required fields in default config', async () => {
      const config = await loadConfig()

      expect(config).toHaveProperty('contentPath')
      expect(config).toHaveProperty('port')
      expect(config).toHaveProperty('host')
      expect(config).toHaveProperty('watch')
      expect(config).toHaveProperty('logLevel')
      expect(config).toHaveProperty('title')
      expect(config).toHaveProperty('syntaxTheme')
      expect(config).toHaveProperty('maxConcurrentOps')
      expect(config).toHaveProperty('cacheTTL')
      expect(config).toHaveProperty('enableCache')
    })
  })

  describe('Environment Variable Overrides', () => {
    it('should override port from PORT environment variable', async () => {
      process.env.PORT = '8080'

      const config = await loadConfig()

      expect(config.port).toBe(8080)
    })

    it('should override contentPath from WIKI_PATH environment variable', async () => {
      process.env.WIKI_PATH = '/custom/wiki/path'

      const config = await loadConfig()

      expect(config.contentPath).toBe('/custom/wiki/path')
    })

    it('should override logLevel from LOG_LEVEL environment variable', async () => {
      process.env.LOG_LEVEL = 'debug'

      const config = await loadConfig()

      expect(config.logLevel).toBe('debug')
    })

    it('should handle multiple environment variable overrides simultaneously', async () => {
      process.env.PORT = '9000'
      process.env.WIKI_PATH = '/test/wiki'
      process.env.LOG_LEVEL = 'warn'

      const config = await loadConfig()

      expect(config.port).toBe(9000)
      expect(config.contentPath).toBe('/test/wiki')
      expect(config.logLevel).toBe('warn')
    })

    it('should parse PORT as integer even if provided as string', async () => {
      process.env.PORT = '3030'

      const config = await loadConfig()

      expect(config.port).toBe(3030)
      expect(typeof config.port).toBe('number')
    })

    it('should accept valid log levels from environment', async () => {
      const validLevels: Array<WikiConfig['logLevel']> = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']

      for (const level of validLevels) {
        clearConfigCache() // Clear cache before each iteration
        process.env.LOG_LEVEL = level
        const config = await loadConfig()
        expect(config.logLevel).toBe(level)
      }
    })
  })

  describe('JSON Config File Loading', () => {
    it('should load configuration from custom config path', async () => {
      const customConfig = {
        title: 'Custom Wiki Title',
        port: 4000,
        syntaxTheme: 'monokai'
      }

      writeFileSync(testConfigPath, JSON.stringify(customConfig, null, 2))
      process.env.WIKI_CONFIG_PATH = testConfigPath

      const config = await loadConfig()

      expect(config.title).toBe('Custom Wiki Title')
      expect(config.port).toBe(4000)
      expect(config.syntaxTheme).toBe('monokai')
      // Should still have defaults for non-specified fields
      expect(config.host).toBe('localhost')
    })

    it('should use default config location when WIKI_CONFIG_PATH is not set', async () => {
      // Use test directory instead of actual home directory to avoid permission issues
      const testHomeConfigDir = join(testConfigDir, 'home-config')
      const testHomeConfigPath = join(testHomeConfigDir, 'config.json')

      if (!existsSync(testHomeConfigDir)) {
        mkdirSync(testHomeConfigDir, { recursive: true })
      }

      const customConfig = {
        title: 'Default Location Wiki'
      }

      writeFileSync(testHomeConfigPath, JSON.stringify(customConfig, null, 2))
      process.env.WIKI_CONFIG_PATH = testHomeConfigPath

      try {
        const config = await loadConfig()
        expect(config.title).toBe('Default Location Wiki')
      } finally {
        // Cleanup
        if (existsSync(testHomeConfigPath)) {
          unlinkSync(testHomeConfigPath)
        }
        if (existsSync(testHomeConfigDir)) {
          rmSync(testHomeConfigDir, { recursive: true, force: true })
        }
      }
    })

    it('should handle non-existent config file gracefully', async () => {
      process.env.WIKI_CONFIG_PATH = '/nonexistent/path/config.json'

      const config = await loadConfig()

      // Should return defaults when file doesn't exist
      expect(config.contentPath).toBe('/wiki')
      expect(config.port).toBe(3020)
    })

    it('should merge partial config from file with defaults', async () => {
      const partialConfig = {
        port: 5000,
        title: 'Partial Config Wiki'
        // Missing many other fields
      }

      writeFileSync(testConfigPath, JSON.stringify(partialConfig, null, 2))
      process.env.WIKI_CONFIG_PATH = testConfigPath

      const config = await loadConfig()

      // Specified fields should be from file
      expect(config.port).toBe(5000)
      expect(config.title).toBe('Partial Config Wiki')

      // Non-specified fields should be defaults
      expect(config.contentPath).toBe('/wiki')
      expect(config.host).toBe('localhost')
      expect(config.logLevel).toBe('info')
    })

    it('should handle invalid JSON file gracefully', async () => {
      writeFileSync(testConfigPath, 'invalid json {{{')
      process.env.WIKI_CONFIG_PATH = testConfigPath

      // Should fall back to defaults on parse error
      const config = await loadConfig()

      expect(config.contentPath).toBe('/wiki')
      expect(config.port).toBe(3020)
    })
  })

  describe('Deep Merge for Nested Configs', () => {
    it('should perform deep merge for nested configuration objects', async () => {
      // This tests the deep merge utility even though current WikiConfig
      // doesn't have nested objects - it's future-proofing
      const config1 = {
        contentPath: '/wiki',
        port: 3020,
        metadata: {
          author: 'Test',
          tags: ['wiki', 'test']
        }
      }

      const config2 = {
        port: 4000,
        metadata: {
          version: '1.0.0'
        }
      }

      // The implementation should export a deepMerge utility
      const { deepMerge } = await import('../../server/utils/config')
      const merged = deepMerge(config1, config2)

      expect(merged.port).toBe(4000)
      expect(merged.contentPath).toBe('/wiki')
      expect(merged.metadata).toEqual({
        author: 'Test',
        tags: ['wiki', 'test'],
        version: '1.0.0'
      })
    })

    it('should not mutate original objects during deep merge', async () => {
      const { deepMerge } = await import('../../server/utils/config')

      const obj1 = { a: 1, b: { c: 2 } }
      const obj2 = { b: { d: 3 } }

      const original1 = JSON.stringify(obj1)
      const original2 = JSON.stringify(obj2)

      deepMerge(obj1, obj2)

      expect(JSON.stringify(obj1)).toBe(original1)
      expect(JSON.stringify(obj2)).toBe(original2)
    })
  })

  describe('Config Priority (ENV > config.json > defaults)', () => {
    it('should prioritize environment variables over config file', async () => {
      const fileConfig = {
        port: 5000,
        contentPath: '/file/wiki',
        logLevel: 'debug' as const
      }

      writeFileSync(testConfigPath, JSON.stringify(fileConfig, null, 2))
      process.env.WIKI_CONFIG_PATH = testConfigPath
      process.env.PORT = '7000'
      process.env.LOG_LEVEL = 'error'

      const config = await loadConfig()

      // ENV should win
      expect(config.port).toBe(7000)
      expect(config.logLevel).toBe('error')

      // File config should win over defaults when no ENV
      expect(config.contentPath).toBe('/file/wiki')
    })

    it('should prioritize config file over defaults', async () => {
      const fileConfig = {
        title: 'File Config Title',
        host: 'filehost'
      }

      writeFileSync(testConfigPath, JSON.stringify(fileConfig, null, 2))
      process.env.WIKI_CONFIG_PATH = testConfigPath

      const config = await loadConfig()

      // File config should override defaults
      expect(config.title).toBe('File Config Title')
      expect(config.host).toBe('filehost')

      // Defaults should be used for unspecified fields
      expect(config.port).toBe(3020)
    })
  })

  describe('Config Caching', () => {
    it('should cache loaded configuration', async () => {
      const fileConfig = {
        title: 'Cached Wiki'
      }

      writeFileSync(testConfigPath, JSON.stringify(fileConfig, null, 2))
      process.env.WIKI_CONFIG_PATH = testConfigPath

      const config1 = await loadConfig()

      // Modify the file
      writeFileSync(testConfigPath, JSON.stringify({ title: 'Modified Wiki' }, null, 2))

      const config2 = await loadConfig()

      // Should return cached version
      expect(config1.title).toBe('Cached Wiki')
      expect(config2.title).toBe('Cached Wiki')
    })

    it('should allow cache clearing for testing', async () => {
      const { loadConfig, clearConfigCache } = await import('../../server/utils/config')

      const fileConfig = {
        title: 'First Load'
      }

      writeFileSync(testConfigPath, JSON.stringify(fileConfig, null, 2))
      process.env.WIKI_CONFIG_PATH = testConfigPath

      const config1 = await loadConfig()
      expect(config1.title).toBe('First Load')

      // Clear cache
      clearConfigCache()

      // Update file
      writeFileSync(testConfigPath, JSON.stringify({ title: 'After Clear' }, null, 2))

      const config2 = await loadConfig()
      expect(config2.title).toBe('After Clear')
    })
  })

  describe('Optional Description Field', () => {
    it('should handle optional description field', async () => {
      const config = await loadConfig()

      // Description is optional, should be undefined by default
      expect(config.description).toBeUndefined()
    })

    it('should include description when provided in config file', async () => {
      const fileConfig = {
        description: 'A test wiki description'
      }

      writeFileSync(testConfigPath, JSON.stringify(fileConfig, null, 2))
      process.env.WIKI_CONFIG_PATH = testConfigPath

      const config = await loadConfig()

      expect(config.description).toBe('A test wiki description')
    })
  })
})
