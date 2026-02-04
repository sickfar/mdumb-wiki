import { defineEventHandler, getQuery, createError } from 'h3'
import { getConfig } from '../utils/config'
import { getLogger } from '../utils/logger'
import { readWikiFile } from '../utils/file-operations'

export default defineEventHandler(async (event) => {
  const logger = await getLogger()
  const config = await getConfig()
  const query = getQuery(event)

  // Validate required parameters
  if (!query.path || typeof query.path !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'path parameter is required'
    })
  }

  const requestedPath = query.path as string

  try {
    const result = readWikiFile(requestedPath, config.contentPath)

    if (result.exists) {
      logger.info({ path: requestedPath, hash: result.hash }, 'File retrieved successfully')
    } else {
      logger.debug({ path: requestedPath }, 'File not found')
    }

    return result
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error({ path: requestedPath, error: errorMessage }, 'Failed to retrieve file')

    // Don't expose internal paths in error messages
    throw createError({
      statusCode: errorMessage.includes('Invalid path') ? 400 : 500,
      message: errorMessage.includes('Invalid path') ? 'Invalid path' : 'Failed to retrieve file'
    })
  }
})
