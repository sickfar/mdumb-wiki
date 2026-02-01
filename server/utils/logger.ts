import pino from 'pino'
import type { Logger } from 'pino'
import { loadConfig } from './config'

/**
 * Cached logger instance to avoid recreating on every call
 */
let cachedLogger: Logger | null = null

/**
 * Determine if we're running in development mode
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev'
}

/**
 * Get or create a configured pino logger instance
 *
 * In development mode, uses pretty printing for human-readable logs.
 * In production mode, outputs structured JSON logs.
 *
 * @returns Configured pino logger instance
 */
export async function getLogger(): Promise<Logger> {
  if (cachedLogger) {
    return cachedLogger
  }

  const config = await loadConfig()

  // Configure logger based on environment and config
  const loggerOptions: pino.LoggerOptions = {
    level: config.logLevel || 'info',
    // Add timestamp to all logs
    timestamp: pino.stdTimeFunctions.isoTime,
  }

  // Pretty printing for development
  if (isDevelopment()) {
    const pinoPretty = await import('pino-pretty')
    cachedLogger = pino(
      loggerOptions,
      pinoPretty.default({
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        singleLine: false,
      })
    )
  } else {
    // Structured JSON logs for production
    cachedLogger = pino(loggerOptions)
  }

  return cachedLogger
}

/**
 * Clear the cached logger instance (useful for testing)
 */
export function clearLoggerCache(): void {
  cachedLogger = null
}
