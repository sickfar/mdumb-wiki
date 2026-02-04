import { defineEventHandler, readBody, createError } from 'h3'
import { getConfig } from '../../utils/config'
import { getLogger } from '../../utils/logger'
import { promoteFileToFolder } from '../../utils/file-operations'
import { sendSSEMessage } from '../../utils/sse'

export default defineEventHandler(async (event) => {
  const logger = await getLogger()
  const config = await getConfig()

  let body: { path?: string }
  try {
    body = await readBody(event)
  } catch {
    throw createError({
      statusCode: 400,
      message: 'Invalid JSON body'
    })
  }

  // Validate required parameters
  if (!body.path || typeof body.path !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'path is required'
    })
  }

  const requestedPath = body.path

  try {
    // CRITICAL: Validate BEFORE any file operation
    const result = promoteFileToFolder({
      path: requestedPath,
      contentPath: config.contentPath
    })

    if (!result.success) {
      logger.warn({ path: requestedPath, error: result.error }, 'Failed to promote file')
      return result
    }

    logger.info({ path: requestedPath, newPath: result.newPath }, 'File promoted successfully')

    // Emit SSE event for navigation refresh
    sendSSEMessage({
      type: 'file:changed',
      path: requestedPath
    })

    return result
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error({ path: requestedPath, error: errorMessage }, 'Failed to promote file')

    // Don't expose internal paths in error messages
    throw createError({
      statusCode: errorMessage.includes('Path traversal detected') ? 400 : 500,
      message: errorMessage.includes('Path traversal detected') ? 'Invalid path' : 'Failed to promote file'
    })
  }
})
