import { readFileSync, existsSync, writeFileSync, mkdirSync, unlinkSync } from 'fs'
import { dirname, join } from 'path'
import { validatePath } from './security'
import { computeContentHash } from './file-hash'

export interface FileReadResult {
  exists: boolean
  path: string
  content?: string
  hash?: string
}

export interface FileWriteRequest {
  path: string
  content: string
  hash: string | null
  contentPath: string
}

export interface FileWriteResult {
  success: boolean
  newHash?: string
  conflict?: {
    conflictDetected: boolean
    currentHash: string
  }
}

export interface FolderCreateRequest {
  path: string
  createIndex: boolean
  contentPath: string
}

export interface FolderCreateResult {
  success: boolean
  path: string
  error?: string
}

export interface FilePromoteRequest {
  path: string
  contentPath: string
}

export interface FilePromoteResult {
  success: boolean
  newPath?: string
  error?: string
}

/**
 * Read a file from the wiki content directory
 * @param requestedPath - Relative path within wiki
 * @param contentPath - Absolute path to wiki root
 * @returns File read result with content and hash
 */
export function readWikiFile(requestedPath: string, contentPath: string): FileReadResult {
  // CRITICAL: Validate path before any file operation
  const safePath = validatePath(requestedPath, contentPath)

  // Check if file exists
  if (!existsSync(safePath)) {
    return {
      exists: false,
      path: requestedPath
    }
  }

  // Read file content
  const content = readFileSync(safePath, 'utf-8')

  // Compute hash for conflict detection
  const hash = computeContentHash(content)

  return {
    exists: true,
    path: requestedPath,
    content,
    hash
  }
}

/**
 * Write a file to the wiki content directory with optional conflict detection
 * @param request - File write request with path, content, hash, and contentPath
 * @returns Write result with success status and optional conflict information
 */
export function writeWikiFile(request: FileWriteRequest): FileWriteResult {
  const { path: requestedPath, content, hash, contentPath } = request

  // CRITICAL: Validate path before any file operation
  const safePath = validatePath(requestedPath, contentPath)

  // If hash is provided, check for conflicts
  if (hash !== null) {
    // Check if file exists
    if (existsSync(safePath)) {
      // Read current content
      const currentContent = readFileSync(safePath, 'utf-8')
      const currentHash = computeContentHash(currentContent)

      // Check for conflict
      if (currentHash !== hash) {
        return {
          success: false,
          conflict: {
            conflictDetected: true,
            currentHash
          }
        }
      }
    }
  }

  // Create parent directories if they don't exist
  const parentDir = dirname(safePath)
  if (!existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true })
  }

  // Write file
  writeFileSync(safePath, content, 'utf-8')

  // Compute new hash
  const newHash = computeContentHash(content)

  return {
    success: true,
    newHash
  }
}

/**
 * Create a new folder in the wiki content directory
 * @param request - Folder create request with path, createIndex, and contentPath
 * @returns Create result with success status
 */
export function createWikiFolder(request: FolderCreateRequest): FolderCreateResult {
  const { path: requestedPath, createIndex, contentPath } = request

  // CRITICAL: Validate path before any file operation
  const safePath = validatePath(requestedPath, contentPath)

  // Check if folder already exists
  if (existsSync(safePath)) {
    return {
      success: false,
      path: requestedPath,
      error: 'Folder already exists'
    }
  }

  // Create folder with recursive option for nested paths
  mkdirSync(safePath, { recursive: true })

  // Create index.md if requested
  if (createIndex) {
    const indexPath = join(safePath, 'index.md')
    const folderName = requestedPath.split('/').pop() || requestedPath
    const indexContent = `# ${folderName}\n\nThis folder was created on ${new Date().toISOString().split('T')[0]}.\n`

    writeFileSync(indexPath, indexContent, 'utf-8')
  }

  return {
    success: true,
    path: requestedPath
  }
}

/**
 * Promote a file to a folder by converting file.md to folder/index.md
 * @param request - File promote request with path and contentPath
 * @returns Promote result with success status and new path
 */
export function promoteFileToFolder(request: FilePromoteRequest): FilePromoteResult {
  const { path: requestedPath, contentPath } = request

  // CRITICAL: Validate path before any file operation
  const safePath = validatePath(requestedPath, contentPath)

  // Check if file exists
  if (!existsSync(safePath)) {
    return {
      success: false,
      error: 'File does not exist'
    }
  }

  // Remove .md extension to get folder name
  const newPath = requestedPath.replace(/\.md$/, '')
  const newFolderPath = validatePath(newPath, contentPath)

  // Check if target folder already exists
  if (existsSync(newFolderPath)) {
    return {
      success: false,
      error: 'Target folder already exists'
    }
  }

  // Read current file content
  const content = readFileSync(safePath, 'utf-8')

  // Create new folder
  mkdirSync(newFolderPath, { recursive: true })

  // Write content to index.md
  const indexPath = join(newFolderPath, 'index.md')
  writeFileSync(indexPath, content, 'utf-8')

  // Delete original file
  unlinkSync(safePath)

  return {
    success: true,
    newPath
  }
}
