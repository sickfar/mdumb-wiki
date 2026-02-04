import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { readWikiFile } from '../../../server/utils/file-operations'
import { computeContentHash } from '../../../server/utils/file-hash'

const TEST_DIR = '/tmp/claude/mdumb-wiki-test-file-api'

describe('File Read Operations (GET /api/file logic)', () => {
  beforeEach(() => {
    // Create test directory structure
    mkdirSync(TEST_DIR, { recursive: true })
    mkdirSync(join(TEST_DIR, 'folder'), { recursive: true })

    // Create test files
    writeFileSync(join(TEST_DIR, 'test.md'), '# Test File\n\nContent here.')
    writeFileSync(join(TEST_DIR, 'folder', 'nested.md'), '# Nested\n\nNested content.')
  })

  afterEach(() => {
    // Clean up
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it('should return file content with hash for valid file', () => {
    const result = readWikiFile('test.md', TEST_DIR)

    expect(result).toEqual({
      exists: true,
      path: 'test.md',
      content: '# Test File\n\nContent here.',
      hash: computeContentHash('# Test File\n\nContent here.')
    })
  })

  it('should return exists: false for non-existent file', () => {
    const result = readWikiFile('does-not-exist.md', TEST_DIR)

    expect(result).toEqual({
      exists: false,
      path: 'does-not-exist.md'
    })
  })

  it('should reject path traversal attempts', () => {
    expect(() => {
      readWikiFile('../../../etc/passwd', TEST_DIR)
    }).toThrow(/Path traversal detected/)
  })

  it('should handle nested files correctly', () => {
    const result = readWikiFile('folder/nested.md', TEST_DIR)

    expect(result.exists).toBe(true)
    expect(result.path).toBe('folder/nested.md')
    expect(result.content).toBe('# Nested\n\nNested content.')
  })

  it('should compute hash correctly', () => {
    const result = readWikiFile('folder/nested.md', TEST_DIR)

    const expectedHash = computeContentHash('# Nested\n\nNested content.')

    expect(result.exists).toBe(true)
    expect(result.hash).toBe(expectedHash)
    expect(result.hash).toHaveLength(64) // SHA-256 hex length
  })
})
