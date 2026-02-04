import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { createWikiFolder } from '../../../server/utils/file-operations'

const TEST_DIR = '/tmp/claude/mdumb-wiki-test-folder-api'

describe('Folder Create Operations (POST /api/folder logic)', () => {
  beforeEach(() => {
    // Create test directory
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    // Clean up
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it('should create folder without index.md', () => {
    const result = createWikiFolder({
      path: 'new-folder',
      createIndex: false,
      contentPath: TEST_DIR
    })

    expect(result.success).toBe(true)
    expect(result.path).toBe('new-folder')
    expect(existsSync(join(TEST_DIR, 'new-folder'))).toBe(true)
    expect(existsSync(join(TEST_DIR, 'new-folder', 'index.md'))).toBe(false)
  })

  it('should create folder with index.md', () => {
    const result = createWikiFolder({
      path: 'new-folder',
      createIndex: true,
      contentPath: TEST_DIR
    })

    expect(result.success).toBe(true)
    expect(result.path).toBe('new-folder')
    expect(existsSync(join(TEST_DIR, 'new-folder'))).toBe(true)
    expect(existsSync(join(TEST_DIR, 'new-folder', 'index.md'))).toBe(true)

    // Check index.md content
    const indexContent = readFileSync(join(TEST_DIR, 'new-folder', 'index.md'), 'utf-8')
    expect(indexContent).toContain('# new-folder')
    expect(indexContent).toContain('This folder was created')
  })

  it('should return success: false if folder already exists', () => {
    // Create folder first
    mkdirSync(join(TEST_DIR, 'existing'), { recursive: true })

    const result = createWikiFolder({
      path: 'existing',
      createIndex: false,
      contentPath: TEST_DIR
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Folder already exists')
  })

  it('should reject path traversal attempts', () => {
    expect(() => {
      createWikiFolder({
        path: '../../../etc',
        createIndex: false,
        contentPath: TEST_DIR
      })
    }).toThrow(/Path traversal detected/)
  })

  it('should create nested folders', () => {
    const result = createWikiFolder({
      path: 'deep/nested/folder',
      createIndex: true,
      contentPath: TEST_DIR
    })

    expect(result.success).toBe(true)
    expect(existsSync(join(TEST_DIR, 'deep', 'nested', 'folder'))).toBe(true)
    expect(existsSync(join(TEST_DIR, 'deep', 'nested', 'folder', 'index.md'))).toBe(true)
  })
})
