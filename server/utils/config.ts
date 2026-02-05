import type { WikiConfig } from '../../types/config'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: WikiConfig = {
  contentPath: '/wiki',
  port: 3020,
  host: 'localhost',
  watch: true,
  logLevel: 'info',
  title: 'MDumb Wiki',
  syntaxTheme: 'github-dark',
  maxConcurrentOps: 10,
  cacheTTL: 60000, // 1 minute
  enableCache: true,
  security: {
    sanitizeHtml: true,
    allowedTags: [
      'b', 'i', 'em', 'strong', 'code', 'pre', 'a', 'img', 'ul', 'ol', 'li',
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'hr', 'br',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'input', 'label'
    ],
    allowedAttributes: {
      '*': ['class', 'id'],
      'a': ['href', 'title', 'target'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'code': ['class'],
      'pre': ['class'],
      'span': ['class', 'style'],
      'div': ['class'],
      'input': ['type', 'checked', 'disabled']
    }
  },
  assets: {
    allowedExtensions: [
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.pdf',
      '.zip', '.tar.gz', '.mp4', '.webm', '.ico'
    ],
    maxFileSize: 10485760, // 10MB
    enableCache: true,
    cacheDuration: 3600 // 1 hour
  },
  git: {
    enabled: false, // Disabled by default (user must opt-in)
    syncInterval: 5, // 5 minutes
    autoCommit: true,
    autoPush: true,
    commitMessageTemplate: 'Auto-commit: {timestamp}',
    conflictStrategy: 'rebase'
  },
  cache: {
    markdown: {
      enabled: true,
      maxSize: 100
    }
  }
}

/**
 * Cached configuration to avoid reloading on every call
 */
let cachedConfig: WikiConfig | null = null

/**
 * Deep merge two objects recursively
 * @param target - The target object (will not be mutated)
 * @param source - The source object to merge (will not be mutated)
 * @returns A new merged object
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target }

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key]
      const targetValue = result[key]

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        // Recursively merge objects
        result[key] = deepMerge(targetValue, sourceValue)
      } else if (sourceValue !== undefined) {
        // Override with source value
        result[key] = sourceValue
      }
    }
  }

  return result
}

/**
 * Load configuration from file
 * @param configPath - Path to the config file
 * @returns Parsed configuration object or empty object if file doesn't exist or is invalid
 */
function loadConfigFile(configPath: string): Partial<WikiConfig> {
  try {
    if (!existsSync(configPath)) {
      return {}
    }

    const fileContent = readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(fileContent)

    return parsed as Partial<WikiConfig>
  } catch (error) {
    // If file doesn't exist or JSON is invalid, return empty object
    console.warn(`Failed to load config from ${configPath}:`, error)
    return {}
  }
}

/**
 * Load environment variable overrides
 * @returns Configuration object from environment variables
 */
function loadEnvConfig(): Partial<WikiConfig> {
  const envConfig: Partial<WikiConfig> = {}

  // PORT environment variable
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10)
    if (!isNaN(port)) {
      envConfig.port = port
    }
  }

  // WIKI_PATH environment variable
  if (process.env.WIKI_PATH) {
    envConfig.contentPath = process.env.WIKI_PATH
  }

  // LOG_LEVEL environment variable
  if (process.env.LOG_LEVEL) {
    const logLevel = process.env.LOG_LEVEL as WikiConfig['logLevel']
    const validLevels: Array<WikiConfig['logLevel']> = [
      'trace',
      'debug',
      'info',
      'warn',
      'error',
      'fatal'
    ]

    if (validLevels.includes(logLevel)) {
      envConfig.logLevel = logLevel
    }
  }

  // Git configuration environment variables
  if (process.env.GIT_ENABLED !== undefined) {
    const gitEnabled = process.env.GIT_ENABLED.toLowerCase() === 'true'
    envConfig.git = { ...envConfig.git, enabled: gitEnabled }
  }

  if (process.env.GIT_SYNC_INTERVAL) {
    const syncInterval = parseInt(process.env.GIT_SYNC_INTERVAL, 10)
    if (!isNaN(syncInterval) && syncInterval > 0) {
      envConfig.git = { ...envConfig.git, syncInterval }
    }
  }

  if (process.env.GIT_AUTO_PUSH !== undefined) {
    const autoPush = process.env.GIT_AUTO_PUSH.toLowerCase() === 'true'
    envConfig.git = { ...envConfig.git, autoPush }
  }

  if (process.env.GIT_CONFLICT_STRATEGY) {
    const strategy = process.env.GIT_CONFLICT_STRATEGY as 'rebase' | 'merge' | 'branch'
    const validStrategies = ['rebase', 'merge', 'branch']
    if (validStrategies.includes(strategy)) {
      envConfig.git = { ...envConfig.git, conflictStrategy: strategy }
    }
  }

  return envConfig
}

/**
 * Get the config file path
 * Priority: WIKI_CONFIG_PATH env var > default location
 * @returns Path to the config file
 */
function getConfigPath(): string {
  if (process.env.WIKI_CONFIG_PATH) {
    return process.env.WIKI_CONFIG_PATH
  }

  // Default location: ~/.config/sickfar-wiki/config.json
  return join(homedir(), '.config', 'sickfar-wiki', 'config.json')
}

/**
 * Load and merge configuration from all sources
 * Priority: ENV variables > config file > defaults
 * @returns Complete WikiConfig object
 */
export async function loadConfig(): Promise<WikiConfig> {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig
  }

  // Start with defaults
  let config: WikiConfig = { ...DEFAULT_CONFIG }

  // Get config file path
  const configPath = getConfigPath()

  // Load and merge config file
  const fileConfig = loadConfigFile(configPath)
  config = deepMerge(config, fileConfig)

  // Load and merge environment variables (highest priority)
  const envConfig = loadEnvConfig()
  config = deepMerge(config, envConfig)

  // Cache the result
  cachedConfig = config

  return config
}

/**
 * Get the cached configuration (synchronous)
 * Must be called after loadConfig() has been called at least once
 * @throws Error if config hasn't been loaded yet
 */
export function getConfig(): WikiConfig {
  if (!cachedConfig) {
    throw new Error('Config not loaded. Call loadConfig() first.')
  }
  return cachedConfig
}

/**
 * Clear the cached configuration (useful for testing)
 */
export function clearConfigCache(): void {
  cachedConfig = null
}
