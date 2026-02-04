import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { promoteFileToFolder } from '../../../server/utils/file-operations'

const TEST_DIR = '/tmp/claude/mdumb-wiki-test-promote'

describe('File Promote Operations (POST /api/file/promote logic)', () => {
  beforeEach(() => {
    // Create test directory
    mkdirSync(TEST_DIR, { recursive: true })
    mkdirSync(join(TEST_DIR, 'folder'), { recursive: true })

    // Create test files
    writeFileSync(join(TEST_DIR, 'test.md'), '# Test File\n\nOriginal content.')
    writeFileSync(join(TEST_DIR, 'folder', 'nested.md'), '# Nested\n\nNested content.')
  })

  afterEach(() => {
    // Clean up
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it('should promote file to folder with index.md', () => {
    const result = promoteFileToFolder({
      path: 'test.md',
      contentPath: TEST_DIR
    })

    expect(result.success).toBe(true)
    expect(result.newPath).toBe('test')

    // Verify original file is deleted
    expect(existsSync(join(TEST_DIR, 'test.md'))).toBe(false)

    // Verify folder and index.md exist
    expect(existsSync(join(TEST_DIR, 'test'))).toBe(true)
    expect(existsSync(join(TEST_DIR, 'test', 'index.md'))).toBe(true)

    // Verify content is preserved
    const indexContent = readFileSync(join(TEST_DIR, 'test', 'index.md'), 'utf-8')
    expect(indexContent).toBe('# Test File\n\nOriginal content.')
  })

  it('should preserve file content exactly', () => {
    const originalContent = '# Complex\n\nWith **markdown** and `code`\n\n```js\nconst x = 1;\n```'
    writeFileSync(join(TEST_DIR, 'complex.md'), originalContent)

    const result = promoteFileToFolder({
      path: 'complex.md',
      contentPath: TEST_DIR
    })

    expect(result.success).toBe(true)

    const indexContent = readFileSync(join(TEST_DIR, 'complex', 'index.md'), 'utf-8')
    expect(indexContent).toBe(originalContent)
  })

  it('should delete original file after promotion', () => {
    promoteFileToFolder({
      path: 'test.md',
      contentPath: TEST_DIR
    })

    // Original file should not exist
    expect(existsSync(join(TEST_DIR, 'test.md'))).toBe(false)
  })

  it('should return error for non-existent file', () => {
    const result = promoteFileToFolder({
      path: 'does-not-exist.md',
      contentPath: TEST_DIR
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('File does not exist')
  })

  it('should return error if folder already exists', () => {
    // Create folder with same name
    mkdirSync(join(TEST_DIR, 'test'), { recursive: true })

    const result = promoteFileToFolder({
      path: 'test.md',
      contentPath: TEST_DIR
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Target folder already exists')

    // Original file should still exist
    expect(existsSync(join(TEST_DIR, 'test.md'))).toBe(true)
  })

  it('should reject path traversal attempts', () => {
    expect(() => {
      promoteFileToFolder({
        path: '../../../etc/passwd',
        contentPath: TEST_DIR
      })
    }).toThrow(/Path traversal detected/)
  })

  it('should return error if index.md already exists in target folder', () => {
    // Create folder with index.md
    mkdirSync(join(TEST_DIR, 'test'), { recursive: true })
    writeFileSync(join(TEST_DIR, 'test', 'index.md'), 'Existing index')

    const result = promoteFileToFolder({
      path: 'test.md',
      contentPath: TEST_DIR
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Target folder already exists')
  })

  it('should handle nested file paths', () => {
    const result = promoteFileToFolder({
      path: 'folder/nested.md',
      contentPath: TEST_DIR
    })

    expect(result.success).toBe(true)
    expect(result.newPath).toBe('folder/nested')

    // Verify structure
    expect(existsSync(join(TEST_DIR, 'folder', 'nested.md'))).toBe(false)
    expect(existsSync(join(TEST_DIR, 'folder', 'nested'))).toBe(true)
    expect(existsSync(join(TEST_DIR, 'folder', 'nested', 'index.md'))).toBe(true)

    // Verify content
    const indexContent = readFileSync(join(TEST_DIR, 'folder', 'nested', 'index.md'), 'utf-8')
    expect(indexContent).toBe('# Nested\n\nNested content.')
  })
})
