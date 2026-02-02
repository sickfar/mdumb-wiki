import { getLogger } from '../utils/logger'
import { fileWatcher } from '../utils/file-watcher'
import type { HealthStatus } from '../../types/wiki'

export default defineEventHandler(async () => {
  const logger = await getLogger()

  logger.info('Health check requested')

  const watcherStatus = fileWatcher.getStatus()

  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date(),
    pagesLoaded: 0, // Placeholder - can be updated with actual count if needed
    contentPath: watcherStatus.watchedPath || process.env.WIKI_PATH || '/wiki',
    watcherActive: watcherStatus.active,
    uptime: process.uptime() * 1000 // Convert seconds to milliseconds
  }

  return healthStatus
})
