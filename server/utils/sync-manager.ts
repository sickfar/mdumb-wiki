import { getLogger } from './logger'
import { getConfig } from './config'
import { initGit, checkForChanges, commitChanges, pushChanges } from './git-sync'

interface SyncStatus {
  isRunning: boolean
  lastSync: Date | null
  nextSync: Date | null
  currentOperation: string | null
  errorCount: number
  lastError: string | null
}

let syncInterval: NodeJS.Timeout | null = null
let currentSyncPromise: Promise<void> | null = null
let syncStatus: SyncStatus = {
  isRunning: false,
  lastSync: null,
  nextSync: null,
  currentOperation: null,
  errorCount: 0,
  lastError: null
}

let gitInitialized = false

/**
 * Reset sync manager state (for testing only)
 */
export function resetState(): void {
  if (syncInterval !== null) {
    clearInterval(syncInterval)
    syncInterval = null
  }
  currentSyncPromise = null
  syncStatus = {
    isRunning: false,
    lastSync: null,
    nextSync: null,
    currentOperation: null,
    errorCount: 0,
    lastError: null
  }
  gitInitialized = false
}

/**
 * Start the sync manager with interval polling
 */
export function start(): void {
  const logger = getLogger()
  const config = getConfig()

  // Don't start if already running
  if (syncInterval !== null) {
    logger.warn('Sync manager already running, skipping start')
    return
  }

  // Initialize git if not already done
  if (!gitInitialized) {
    initGit(config.contentPath)
    gitInitialized = true
    logger.info('Git initialized', { path: config.contentPath })
  }

  // Set up interval
  const intervalMs = config.git.syncInterval * 60 * 1000
  syncInterval = setInterval(() => {
    performSync().catch(err => {
      logger.error('Uncaught error in sync interval', { error: err.message })
    })
  }, intervalMs)

  // Calculate next sync time
  syncStatus.nextSync = new Date(Date.now() + intervalMs)

  logger.info('Sync manager started', {
    interval: config.git.syncInterval,
    nextSync: syncStatus.nextSync
  })
}

/**
 * Stop the sync manager and wait for pending operations
 */
export async function stop(): Promise<void> {
  const logger = getLogger()

  // Clear interval
  if (syncInterval !== null) {
    clearInterval(syncInterval)
    syncInterval = null
    syncStatus.nextSync = null
    logger.info('Sync manager stopped')
  }

  // Wait for pending operations
  if (currentSyncPromise !== null) {
    logger.info('Waiting for pending sync operation to complete')
    await currentSyncPromise
  }
}

/**
 * Force an immediate sync (for testing/debugging)
 */
export async function forceSync(): Promise<void> {
  const logger = getLogger()
  const config = getConfig()

  // Initialize git if not already done
  if (!gitInitialized) {
    initGit(config.contentPath)
    gitInitialized = true
    logger.debug('Git initialized for force sync', { path: config.contentPath })
  }

  await performSync()
}

/**
 * Get current sync status
 */
export function getStatus(): SyncStatus {
  return { ...syncStatus }
}

/**
 * Internal sync operation (not exported)
 */
async function performSync(): Promise<void> {
  const logger = getLogger()
  const config = getConfig()

  // Skip if git disabled
  if (!config.git.enabled) {
    logger.debug('Git sync disabled, skipping')
    return
  }

  // Skip if already running
  if (currentSyncPromise !== null) {
    logger.warn('Sync already in progress, skipping')
    return
  }

  // Create promise for this sync operation
  currentSyncPromise = (async () => {
    syncStatus.isRunning = true
    syncStatus.currentOperation = 'checking for changes'

    try {
      logger.info('Starting sync operation')

      // Check for changes
      const hasChanges = await checkForChanges()

      if (!hasChanges) {
        logger.info('No changes detected')
        syncStatus.lastSync = new Date()
        return
      }

      logger.info('Changes detected')

      // Commit changes if enabled
      if (config.git.autoCommit) {
        syncStatus.currentOperation = 'committing changes'
        const commitMessage = config.git.commitMessageTemplate.replace(
          '{timestamp}',
          new Date().toISOString()
        )
        await commitChanges(commitMessage)
        logger.info('Changes committed', { message: commitMessage })
      }

      // Push changes if enabled
      if (config.git.autoPush) {
        syncStatus.currentOperation = 'pushing changes'
        await pushChanges()
        logger.info('Changes pushed')
      }

      // Update last sync time
      syncStatus.lastSync = new Date()
      logger.info('Sync completed successfully')
    } catch (error) {
      const errorMessage = (error as Error).message
      syncStatus.errorCount++
      syncStatus.lastError = errorMessage
      logger.error('Sync failed', { error: errorMessage })
    } finally {
      syncStatus.isRunning = false
      syncStatus.currentOperation = null
      currentSyncPromise = null
    }
  })()

  await currentSyncPromise
}
