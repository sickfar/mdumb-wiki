import { getLogger } from './logger'
import { getConfig } from './config'
import { fileWatcher } from './file-watcher'
import { stop as stopSyncManager } from './sync-manager'
import { commitPendingChanges } from './git-sync'

let isShuttingDown = false
const SHUTDOWN_TIMEOUT_MS = 30000 // 30 seconds

/**
 * Gracefully shutdown the application
 * @param signal - Signal that triggered shutdown (SIGTERM, SIGINT, NITRO_CLOSE)
 */
export async function shutdown(signal: string): Promise<void> {
  const logger = await getLogger()

  // Debounce multiple signals
  if (isShuttingDown) {
    logger.warn({ signal }, 'Shutdown already in progress, ignoring signal')
    return
  }
  isShuttingDown = true

  // Set 30-second timeout to force exit
  const timeoutId = setTimeout(() => {
    logger.warn('Shutdown timeout reached, forcing exit')
    process.exit(1)
  }, SHUTDOWN_TIMEOUT_MS)

  try {
    logger.info({ signal }, 'MDumb Wiki shutting down')

    // 1. Stop file watcher (no new changes)
    await fileWatcher.stop()
    logger.info('File watcher stopped')

    // 2. Stop sync manager (wait for current operation)
    await stopSyncManager()
    logger.info('Sync manager stopped')

    // 3. Commit pending changes (if git enabled)
    const config = getConfig()
    if (config.git?.enabled) {
      const success = await commitPendingChanges('Shutdown: pending changes')
      if (success) {
        logger.info('Pending changes committed')
      }
    }

    logger.info('Cleanup completed, goodbye!')
    clearTimeout(timeoutId)
    process.exit(0)
  } catch (error) {
    logger.error({ error }, 'Error during shutdown')
    clearTimeout(timeoutId)
    process.exit(1)
  }
}

/**
 * Reset shutdown state (for testing)
 */
export function resetShutdownState(): void {
  isShuttingDown = false
}
