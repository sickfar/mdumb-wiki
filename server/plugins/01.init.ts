import { getLogger } from '../utils/logger'
import { loadConfig } from '../utils/config'
import { fileWatcher } from '../utils/file-watcher'
import { invalidateSearchCache } from '../api/search.get'
import { start as startSyncManager } from '../utils/sync-manager'
import { shutdown } from '../utils/shutdown-manager'

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

  // Start git sync manager if enabled
  if (config.git?.enabled) {
    startSyncManager()
    logger.info(
      { interval: config.git.syncInterval },
      'Git sync manager started'
    )
  } else {
    logger.info('Git sync disabled (git.enabled: false)')
  }

  logger.info('MDumb Wiki ready to serve content')

  // Register process signal handlers for graceful shutdown
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  // Hook into close event for graceful shutdown
  nitroApp.hooks.hook('close', async () => {
    await shutdown('NITRO_CLOSE')
  })
})
