import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { writeWikiFile } from '../../../server/utils/file-operations'
import { computeContentHash } from '../../../server/utils/file-hash'

const TEST_DIR = '/tmp/claude/mdumb-wiki-test-file-api-post'

describe('File Write Operations (POST /api/file logic)', () => {
  beforeEach(() => {
    // Create test directory structure
    mkdirSync(TEST_DIR, { recursive: true })
    mkdirSync(join(TEST_DIR, 'folder'), { recursive: true })

    // Create existing file
    writeFileSync(join(TEST_DIR, 'existing.md'), 'Original content')
  })

  afterEach(() => {
    // Clean up
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it('should create new file without hash check', () => {
    const newContent = '# New File\n\nBrand new content.'

    const result = writeWikiFile({
      path: 'new-file.md',
      content: newContent,
      hash: null,
      contentPath: TEST_DIR
    })

    expect(result.success).toBe(true)
    expect(result.newHash).toBe(computeContentHash(newContent))
    expect(result.conflict).toBeUndefined()

    // Verify file was created
    const fileContent = readFileSync(join(TEST_DIR, 'new-file.md'), 'utf-8')
    expect(fileContent).toBe(newContent)
  })

  it('should update existing file with matching hash', () => {
    const originalContent = 'Original content'
    const originalHash = computeContentHash(originalContent)
    const newContent = 'Updated content'

    const result = writeWikiFile({
      path: 'existing.md',
      content: newContent,
      hash: originalHash,
      contentPath: TEST_DIR
    })

    expect(result.success).toBe(true)
    expect(result.newHash).toBe(computeContentHash(newContent))
    expect(result.conflict).toBeUndefined()

    // Verify file was updated
    const fileContent = readFileSync(join(TEST_DIR, 'existing.md'), 'utf-8')
    expect(fileContent).toBe(newContent)
  })

  it('should detect conflict with mismatched hash', () => {
    const wrongHash = 'wrong-hash-value'
    const newContent = 'Attempted update'

    const result = writeWikiFile({
      path: 'existing.md',
      content: newContent,
      hash: wrongHash,
      contentPath: TEST_DIR
    })

    expect(result.success).toBe(false)
    expect(result.conflict).toBeDefined()
    expect(result.conflict?.conflictDetected).toBe(true)
    expect(result.conflict?.currentHash).toBe(computeContentHash('Original content'))

    // Verify file was NOT updated
    const fileContent = readFileSync(join(TEST_DIR, 'existing.md'), 'utf-8')
    expect(fileContent).toBe('Original content')
  })

  it('should reject path traversal attempts', () => {
    expect(() => {
      writeWikiFile({
        path: '../../../etc/passwd',
        content: 'malicious',
        hash: null,
        contentPath: TEST_DIR
      })
    }).toThrow(/Path traversal detected/)
  })

  it('should create nested directories automatically', () => {
    const newContent = '# Deep File\n\nContent in deep folder.'

    const result = writeWikiFile({
      path: 'deep/nested/path/file.md',
      content: newContent,
      hash: null,
      contentPath: TEST_DIR
    })

    expect(result.success).toBe(true)
    expect(existsSync(join(TEST_DIR, 'deep', 'nested', 'path', 'file.md'))).toBe(true)

    const fileContent = readFileSync(join(TEST_DIR, 'deep', 'nested', 'path', 'file.md'), 'utf-8')
    expect(fileContent).toBe(newContent)
  })

  it('should handle conflict when file was modified', () => {
    // Simulate another user modifying the file
    writeFileSync(join(TEST_DIR, 'existing.md'), 'Modified by another user')

    const oldHash = computeContentHash('Original content')
    const newContent = 'My attempted update'

    const result = writeWikiFile({
      path: 'existing.md',
      content: newContent,
      hash: oldHash,
      contentPath: TEST_DIR
    })

    expect(result.success).toBe(false)
    expect(result.conflict?.conflictDetected).toBe(true)
    expect(result.conflict?.currentHash).toBe(computeContentHash('Modified by another user'))
  })

  it('should allow update without hash for existing file (overwrite)', () => {
    const newContent = 'Force overwrite'

    const result = writeWikiFile({
      path: 'existing.md',
      content: newContent,
      hash: null,
      contentPath: TEST_DIR
    })

    expect(result.success).toBe(true)
    expect(result.newHash).toBe(computeContentHash(newContent))

    const fileContent = readFileSync(join(TEST_DIR, 'existing.md'), 'utf-8')
    expect(fileContent).toBe(newContent)
  })

  it('should preserve file permissions and not corrupt binary files', () => {
    const content = '# Markdown\n\nWith unicode: 你好 café'

    const result = writeWikiFile({
      path: 'unicode.md',
      content,
      hash: null,
      contentPath: TEST_DIR
    })

    expect(result.success).toBe(true)

    const fileContent = readFileSync(join(TEST_DIR, 'unicode.md'), 'utf-8')
    expect(fileContent).toBe(content)
  })
})
