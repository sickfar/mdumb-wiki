import { createHash } from 'crypto'
import { readFile } from 'fs/promises'

/**
 * Compute SHA-256 hash from string content
 * @param content - String content to hash
 * @returns Hex-encoded SHA-256 hash (64 characters)
 */
export function computeContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

/**
 * Compute SHA-256 hash from file content
 * @param filePath - Absolute path to file
 * @returns Hex-encoded SHA-256 hash (64 characters)
 * @throws Error if file cannot be read
 */
export async function computeFileHash(filePath: string): Promise<string> {
  const content = await readFile(filePath, 'utf-8')
  return computeContentHash(content)
}
