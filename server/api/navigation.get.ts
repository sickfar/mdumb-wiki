import { buildNavigation } from '../utils/navigation'
import { loadConfig } from '../utils/config'
import { getLogger } from '../utils/logger'

export default defineEventHandler(async (event) => {
  const logger = await getLogger()

  try {
    const config = await loadConfig()
    const navigation = buildNavigation(config.contentPath)

    logger.info(`Navigation built successfully with ${navigation.length} top-level items`)

    return navigation
  } catch (error) {
    logger.error('Failed to build navigation', { error })

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to build navigation',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})
