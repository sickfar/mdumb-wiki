import { join, dirname, extname, normalize } from 'path'
import { lookup } from 'mime-types'
import { validatePath } from './security'
import { loadConfig } from './config'

/**
 * Resolve an asset path relative to a markdown file
 * @param assetPath - The path from the markdown file (can be relative, absolute, or parent)
 * @param markdownPath - The path of the markdown file requesting the asset
 * @param wikiPath - The root wiki directory
 * @returns Absolute path to the asset
 * @throws Error if path traversal is detected
 */
export async function resolveAssetPath(
  assetPath: string,
  markdownPath: string,
  wikiPath: string
): Promise<string> {
  // Normalize the asset path (convert backslashes, remove multiple slashes)
  let normalizedPath = normalize(assetPath.replace(/\\/g, '/'))

  let resolvedPath: string

  if (normalizedPath.startsWith('/')) {
    // Absolute path from wiki root - remove leading slash
    normalizedPath = normalizedPath.substring(1)
    resolvedPath = normalizedPath
  } else {
    // Relative path - resolve relative to the markdown file's directory
    const markdownDir = dirname(markdownPath)
    resolvedPath = join(markdownDir, normalizedPath)
  }

  // Validate the path to prevent directory traversal
  const fullPath = validatePath(resolvedPath, wikiPath)

  return fullPath
}

/**
 * Check if a file extension is allowed for asset serving
 * @param filePath - The file path to check
 * @returns True if the extension is allowed
 */
export async function isValidAssetExtension(filePath: string): Promise<boolean> {
  const config = await loadConfig()
  const ext = extname(filePath).toLowerCase()

  return config.assets.allowedExtensions.includes(ext)
}

/**
 * Get the MIME type for an asset file
 * @param filePath - The file path
 * @returns MIME type string
 */
export function getAssetMimeType(filePath: string): string {
  const mimeType = lookup(filePath)
  return mimeType || 'application/octet-stream'
}
