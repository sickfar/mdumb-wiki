import { getLogger } from '../utils/logger'
import { fileWatcher } from '../utils/file-watcher'
import { getConfig } from '../utils/config'
import { getGitStatus } from '../utils/git-sync'
import type { HealthStatus } from '../../types/wiki'

export default defineEventHandler(async () => {
  const logger = await getLogger()

  logger.info('Health check requested')

  const watcherStatus = fileWatcher.getStatus()
  const config = getConfig()

  // Get git status if enabled
  let gitStatus: HealthStatus['git'] | undefined
  if (config.git?.enabled) {
    try {
      gitStatus = await getGitStatus()
    } catch (error) {
      logger.error({ error }, 'Failed to get git status')
      gitStatus = undefined
    }
  }

  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date(),
    pagesLoaded: 0, // Placeholder - can be updated with actual count if needed
    contentPath: watcherStatus.watchedPath || process.env.WIKI_PATH || '/wiki',
    watcherActive: watcherStatus.active,
    uptime: process.uptime() * 1000, // Convert seconds to milliseconds
    git: gitStatus
  }

  return healthStatus
})
