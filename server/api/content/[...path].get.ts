import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { validatePath } from '../../utils/security'
import { parseMarkdown } from '../../utils/markdown'
import { loadConfig } from '../../utils/config'
import { getLogger } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  const logger = await getLogger()
  const config = await loadConfig()

  // Get the path parameter (array of path segments)
  const pathParam = getRouterParam(event, 'path')

  if (!pathParam) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Path parameter is required'
    })
  }

  try {
    // Convert URL path to potential file paths
    // Try multiple variations: direct file, index file, etc.
    let filePath: string | null = null
    let resolvedPath: string | null = null

    // Variation 1: Direct file with .md extension (e.g., "guide" -> "guide.md")
    try {
      const directPath = `${pathParam}.md`
      resolvedPath = validatePath(directPath, config.contentPath)
      if (existsSync(resolvedPath)) {
        filePath = resolvedPath
      }
    } catch (error) {
      // Path validation failed, try next variation
    }

    // Variation 2: Directory with index.md (e.g., "guide" -> "guide/index.md")
    if (!filePath) {
      try {
        const indexPath = join(pathParam, 'index.md')
        resolvedPath = validatePath(indexPath, config.contentPath)
        if (existsSync(resolvedPath)) {
          filePath = resolvedPath
        }
      } catch (error) {
        // Path validation failed, try next variation
      }
    }

    // If no valid file found, return 404
    if (!filePath) {
      logger.warn(`Content not found for path: ${pathParam}`)

      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: `Page not found: ${pathParam}`
      })
    }

    // Read the markdown file
    const fileContent = readFileSync(filePath, 'utf-8')

    // Parse the markdown
    const page = await parseMarkdown(fileContent, pathParam)

    logger.info(`Content served for path: ${pathParam}`)

    return page
  } catch (error) {
    // If it's already a Nuxt error, rethrow it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    logger.error('Error serving content', {
      path: pathParam,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    })

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})
