import ignore, { type Ignore } from 'ignore'
import fs from 'node:fs'
import path from 'node:path'

const IGNORE_FILENAME = '.mdumbignore'

// Cache for the ignore instance
let cachedIgnore: Ignore | null = null
let cachedWikiPath: string | null = null

export interface IgnoreStatus {
  loaded: boolean
  wikiPath: string | null
  patternCount: number
}

/**
 * Load ignore patterns from .mdumbignore file in the wiki directory
 * Caches the result for subsequent calls
 *
 * @param wikiPath - Root path of the wiki content
 * @returns Ignore instance (empty if no .mdumbignore exists)
 */
export function loadIgnorePatterns(wikiPath: string): Ignore {
  // Return cached instance if same path
  if (cachedIgnore && cachedWikiPath === wikiPath) {
    return cachedIgnore
  }

  const ignoreFilePath = path.join(wikiPath, IGNORE_FILENAME)
  const ig = ignore()

  try {
    // Check if path exists and is a file (not directory)
    if (fs.existsSync(ignoreFilePath) && fs.statSync(ignoreFilePath).isFile()) {
      const content = fs.readFileSync(ignoreFilePath, 'utf-8')

      // Parse the file line by line, filtering out comments and empty lines
      const patterns = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'))

      if (patterns.length > 0) {
        ig.add(patterns)
      }
    }
  } catch (error) {
    // If we can't read the file, return empty ignore instance
    // Log the error for debugging but don't crash
    console.error(`Error reading ${IGNORE_FILENAME}:`, error)
  }

  // Cache the result
  cachedIgnore = ig
  cachedWikiPath = wikiPath

  return ig
}

/**
 * Check if a file path should be ignored
 *
 * @param relativePath - Path relative to wiki root (e.g., 'drafts/secret.md')
 * @param wikiPath - Root path of the wiki content
 * @returns true if the path should be ignored
 */
export function isIgnored(relativePath: string, wikiPath: string): boolean {
  const ig = loadIgnorePatterns(wikiPath)

  // Normalize path to use forward slashes (cross-platform)
  const normalizedPath = relativePath.replace(/\\/g, '/')

  return ig.ignores(normalizedPath)
}

/**
 * Check if a path should be ignored, with directory support
 * For directories, appends trailing slash for proper gitignore semantics
 *
 * @param relativePath - Path relative to wiki root
 * @param isDirectory - Whether the path is a directory
 * @param wikiPath - Root path of the wiki content
 * @returns true if the path should be ignored
 */
export function isPathIgnored(
  relativePath: string,
  isDirectory: boolean,
  wikiPath: string
): boolean {
  const ig = loadIgnorePatterns(wikiPath)

  // Normalize path to use forward slashes
  let normalizedPath = relativePath.replace(/\\/g, '/')

  // For directories, ensure trailing slash for proper gitignore semantics
  // Directory patterns like 'temp/' should only match directories
  if (isDirectory && !normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath + '/'
  }

  // Check both with and without trailing slash for directories
  // This handles both "drafts" and "drafts/" patterns
  if (isDirectory) {
    return ig.ignores(normalizedPath) || ig.ignores(normalizedPath.replace(/\/$/, ''))
  }

  return ig.ignores(normalizedPath)
}

/**
 * Clear the cached ignore patterns
 * Call this when .mdumbignore file changes
 */
export function clearIgnoreCache(): void {
  cachedIgnore = null
  cachedWikiPath = null
}

/**
 * Get the current status of the ignore system
 */
export function getIgnoreStatus(): IgnoreStatus {
  return {
    loaded: cachedIgnore !== null,
    wikiPath: cachedWikiPath,
    patternCount: cachedIgnore ? (cachedIgnore as Ignore & { _rules?: unknown[] })._rules?.length ?? 0 : 0
  }
}

/**
 * Get the ignore filename constant
 */
export function getIgnoreFilename(): string {
  return IGNORE_FILENAME
}
