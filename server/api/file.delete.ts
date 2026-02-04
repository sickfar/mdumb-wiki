import { defineEventHandler, getQuery, createError } from 'h3'
import { deleteWikiFile } from '../utils/file-operations'
import { getLogger } from '../utils/logger'
import { getConfig } from '../utils/config'
import { sendSSEMessage } from '../utils/sse'

export default defineEventHandler(async (event) => {
  const logger = await getLogger()
  const query = getQuery(event)
  const path = query.path as string

  if (!path) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path is required'
    })
  }

  const config = getConfig()
  const contentPath = config.contentPath

  logger.info({ path }, 'Deleting file or folder')

  const result = deleteWikiFile({ path, contentPath })

  if (!result.success) {
    throw createError({
      statusCode: 500,
      statusMessage: result.error || 'Failed to delete file or folder'
    })
  }

  // Emit SSE event for navigation refresh
  sendSSEMessage({
    type: 'file:deleted',
    path
  })

  logger.info({ path }, 'File or folder deleted successfully')

  return {
    success: true,
    path
  }
})
