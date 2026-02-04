import { buildNavigation } from '../utils/navigation'
import { loadConfig } from '../utils/config'
import { getLogger } from '../utils/logger'

export default defineEventHandler(async (event) => {
  const logger = await getLogger()

  try {
    const config = await loadConfig()
    const navigation = buildNavigation(config.contentPath)

    logger.info(`Navigation built successfully with ${navigation.length} top-level items`)

    // Set cache control headers: allow caching but force revalidation on page refresh
    setResponseHeaders(event, {
      'Cache-Control': 'no-cache, must-revalidate',
      'Pragma': 'no-cache'
    })

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
