import { defineEventHandler, createError, setResponseHeaders } from 'h3'
import { readFileSync, statSync, existsSync } from 'fs'
import { loadConfig } from '../../utils/config'
import { validatePath } from '../../utils/security'
import { isValidAssetExtension, getAssetMimeType } from '../../utils/assets'
import { getLogger } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  console.log('🔥 ASSETS ENDPOINT HIT!', event.path)

  const logger = await getLogger()
  const config = await loadConfig()

  try {
    // Get the path parameter from the route
    const pathParam = event.context.params?.path
    console.log('🔥 Path param:', pathParam)

    if (!pathParam) {
      logger.warn('Asset request missing path parameter')
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Path parameter is required'
      })
    }

    // Join path segments
    const requestedPath = Array.isArray(pathParam) ? pathParam.join('/') : pathParam

    logger.debug({ path: requestedPath }, 'Asset request received')

    // Validate the path to prevent directory traversal
    let fullPath: string
    try {
      console.log('🔍 Validating:', requestedPath, 'with contentPath:', config.contentPath)
      fullPath = validatePath(requestedPath, config.contentPath)
      console.log('✅ Resolved to:', fullPath)
    } catch (error) {
      logger.warn({ path: requestedPath, error }, 'Path validation failed')
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'Invalid path'
      })
    }

    // Check if file exists
    if (!existsSync(fullPath)) {
      logger.warn({ path: requestedPath }, 'Asset not found')
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Asset not found'
      })
    }

    // Check if it's a file (not a directory)
    const stats = statSync(fullPath)
    if (!stats.isFile()) {
      logger.warn({ path: requestedPath }, 'Requested path is not a file')
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Path is not a file'
      })
    }

    // Validate file extension
    const isValid = await isValidAssetExtension(fullPath)
    if (!isValid) {
      logger.warn({ path: requestedPath }, 'File extension not allowed')
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'File type not allowed'
      })
    }

    // Check file size
    if (config.assets.maxFileSize > 0 && stats.size > config.assets.maxFileSize) {
      logger.warn(
        { path: requestedPath, size: stats.size, limit: config.assets.maxFileSize },
        'File size exceeds limit'
      )
      throw createError({
        statusCode: 413,
        statusMessage: 'Payload Too Large',
        message: 'File size exceeds maximum allowed'
      })
    }

    // Read the file
    const fileBuffer = readFileSync(fullPath)

    // Get MIME type
    const mimeType = getAssetMimeType(fullPath)

    // Set response headers
    const headers: Record<string, string> = {
      'Content-Type': mimeType,
      'Content-Length': stats.size.toString()
    }

    // Set cache headers if enabled
    if (config.assets.enableCache) {
      headers['Cache-Control'] = `public, max-age=${config.assets.cacheDuration}`
    }

    setResponseHeaders(event, headers)

    logger.info(
      { path: requestedPath, mimeType, size: stats.size },
      'Asset served successfully'
    )

    return fileBuffer
  } catch (error) {
    // If it's already an H3 error, just rethrow it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    // Log unexpected errors
    logger.error({ error }, 'Unexpected error serving asset')

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to serve asset'
    })
  }
})
