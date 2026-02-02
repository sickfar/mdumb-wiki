import { getLogger } from '../utils/logger'
import { loadConfig } from '../utils/config'
import { fileWatcher } from '../utils/file-watcher'
import { invalidateSearchCache } from '../api/search.get'

/**
 * Nitro plugin for wiki initialization and shutdown logging
 *
 * This plugin:
 * - Initializes the logger on startup
 * - Logs wiki configuration details
 * - Starts file watcher for live reload
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

  // Start file watcher if watch is enabled
  if (config.watch) {
    fileWatcher.start(config.contentPath)
    logger.info({ path: config.contentPath }, 'File watcher started')

    // Invalidate search cache on file changes
    fileWatcher.on('file:changed', () => {
      logger.debug('File changed, invalidating search cache')
      invalidateSearchCache()
    })

    fileWatcher.on('file:deleted', () => {
      logger.debug('File deleted, invalidating search cache')
      invalidateSearchCache()
    })

    fileWatcher.on('file:created', () => {
      logger.debug('File created, invalidating search cache')
      invalidateSearchCache()
    })
  } else {
    logger.info('File watcher disabled (watch: false)')
  }

  logger.info('MDumb Wiki ready to serve content')

  // Hook into close event for shutdown logging
  nitroApp.hooks.hook('close', async () => {
    logger.info('MDumb Wiki shutting down')
    fileWatcher.stop()
    logger.info('File watcher stopped')
    logger.info('Cleanup completed, goodbye!')
  })
})
