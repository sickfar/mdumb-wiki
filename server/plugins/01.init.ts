import { getLogger } from '../utils/logger'
import { loadConfig } from '../utils/config'

/**
 * Nitro plugin for wiki initialization and shutdown logging
 *
 * This plugin:
 * - Initializes the logger on startup
 * - Logs wiki configuration details
 * - Sets up shutdown hooks for graceful termination logging
 */
export default defineNitroPlugin(async (nitroApp) => {
  // Get logger and config
  const logger = await getLogger()
  const config = await loadConfig()

  // Log startup information
  logger.info({
    msg: 'MDumb Wiki initializing',
    config: {
      contentPath: config.contentPath,
      port: config.port,
      host: config.host,
      logLevel: config.logLevel,
      title: config.title,
      watch: config.watch,
      syntaxTheme: config.syntaxTheme,
      cache: {
        enabled: config.enableCache,
        ttl: config.cacheTTL,
      },
      maxConcurrentOps: config.maxConcurrentOps,
    },
  })

  logger.info('MDumb Wiki ready to serve content')

  // Hook into close event for shutdown logging
  nitroApp.hooks.hook('close', async () => {
    logger.info('MDumb Wiki shutting down')
    logger.info('Cleanup completed, goodbye!')
  })
})
