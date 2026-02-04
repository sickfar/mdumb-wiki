import { defineEventHandler, readBody, createError } from 'h3'
import { getConfig } from '../utils/config'
import { getLogger } from '../utils/logger'
import { writeWikiFile } from '../utils/file-operations'
import { invalidateCache } from '../utils/markdown-cache'

export default defineEventHandler(async (event) => {
  const logger = await getLogger()
  const config = await getConfig()

  let body: { path?: string; content?: string; hash?: string | null }
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

  if (body.content === undefined || typeof body.content !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'content is required'
    })
  }

  const requestedPath = body.path
  const content = body.content
  const hash = body.hash !== undefined ? body.hash : null

  try {
    // CRITICAL: Validate BEFORE any file operation
    const result = writeWikiFile({
      path: requestedPath,
      content,
      hash,
      contentPath: config.contentPath
    })

    if (!result.success) {
      logger.warn(
        { path: requestedPath, currentHash: result.conflict?.currentHash },
        'File write conflict detected'
      )
      return result
    }

    logger.info({ path: requestedPath, newHash: result.newHash }, 'File written successfully')

    // Invalidate markdown cache for this file
    // Cache key is the path without .md extension (e.g., "test-links" not "test-links.md")
    const cacheKey = requestedPath.replace(/\.md$/, '')
    invalidateCache(cacheKey)

    return result
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error({ path: requestedPath, error: errorMessage }, 'Failed to write file')

    // Don't expose internal paths in error messages
    throw createError({
      statusCode: errorMessage.includes('Path traversal detected') ? 400 : 500,
      message: errorMessage.includes('Path traversal detected') ? 'Invalid path' : 'Failed to write file'
    })
  }
})
