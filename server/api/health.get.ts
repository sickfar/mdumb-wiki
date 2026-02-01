import { getLogger } from '../utils/logger'
import type { HealthStatus } from '../../types/wiki'

export default defineEventHandler(async (event) => {
  const logger = await getLogger()

  logger.info('Health check requested')

  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date(),
    pagesLoaded: 0, // Placeholder - will be updated when file watcher is implemented
    contentPath: process.env.WIKI_PATH || '/wiki',
    watcherActive: false, // Placeholder - will be updated when file watcher is implemented
    uptime: process.uptime() * 1000 // Convert seconds to milliseconds
  }

  return healthStatus
})
