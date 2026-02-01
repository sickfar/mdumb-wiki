import path from 'node:path'

/**
 * Validates and sanitizes a requested path to prevent path traversal attacks
 *
 * @param requestedPath - The path requested by the user (relative)
 * @param wikiPath - The absolute path to the wiki content directory
 * @returns The absolute, validated path within the wiki directory
 * @throws Error if path traversal is detected
 */
export function validatePath(requestedPath: string, wikiPath: string): string {
  // Replace Windows-style backslashes with forward slashes for cross-platform compatibility
  const sanitizedPath = requestedPath.replace(/\\/g, '/')

  // Normalize the requested path to remove any ./ and resolve ../
  const normalizedPath = path.normalize(sanitizedPath)

  // If the normalized path is absolute, reject it
  if (path.isAbsolute(normalizedPath)) {
    throw new Error('Access denied: Path traversal detected')
  }

  // Join with wiki path to get the full path
  const fullPath = path.join(wikiPath, normalizedPath)

  // Resolve to get the absolute path (this will fully resolve all .. and .)
  const resolvedPath = path.resolve(fullPath)
  const resolvedWikiPath = path.resolve(wikiPath)

  // Check if the resolved path is within the wiki directory
  // This prevents path traversal attacks like ../../../etc/passwd
  if (!resolvedPath.startsWith(resolvedWikiPath)) {
    throw new Error('Access denied: Path traversal detected')
  }

  return resolvedPath
}
