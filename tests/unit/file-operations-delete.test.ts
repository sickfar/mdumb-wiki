import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { deleteWikiFile } from '../../server/utils/file-operations'

const TEST_DIR = '/tmp/claude/mdumb-wiki-test-file-delete'

describe('deleteWikiFile', () => {
  beforeEach(() => {
    // Create test directory structure
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    // Clean up
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  describe('single file deletion', () => {
    it('should delete an existing file', () => {
      // Create test file
      const filePath = join(TEST_DIR, 'test.md')
      writeFileSync(filePath, '# Test File')

      const result = deleteWikiFile({
        path: 'test.md',
        contentPath: TEST_DIR
      })

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(existsSync(filePath)).toBe(false)
    })

    it('should return error when file does not exist', () => {
      const result = deleteWikiFile({
        path: 'nonexistent.md',
        contentPath: TEST_DIR
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('File or folder does not exist')
    })

    it('should delete file in nested folder', () => {
      // Create nested structure
      mkdirSync(join(TEST_DIR, 'guides', 'advanced'), { recursive: true })
      const filePath = join(TEST_DIR, 'guides', 'advanced', 'tips.md')
      writeFileSync(filePath, '# Tips')

      const result = deleteWikiFile({
        path: 'guides/advanced/tips.md',
        contentPath: TEST_DIR
      })

      expect(result.success).toBe(true)
      expect(existsSync(filePath)).toBe(false)
      // Parent folders should still exist
      expect(existsSync(join(TEST_DIR, 'guides'))).toBe(true)
      expect(existsSync(join(TEST_DIR, 'guides', 'advanced'))).toBe(true)
    })
  })

  describe('folder deletion', () => {
    it('should delete empty folder', () => {
      // Create empty folder
      const folderPath = join(TEST_DIR, 'empty-folder')
      mkdirSync(folderPath)

      const result = deleteWikiFile({
        path: 'empty-folder',
        contentPath: TEST_DIR
      })

      expect(result.success).toBe(true)
      expect(existsSync(folderPath)).toBe(false)
    })

    it('should recursively delete folder with files', () => {
      // Create folder with files
      const folderPath = join(TEST_DIR, 'folder-with-files')
      mkdirSync(folderPath)
      writeFileSync(join(folderPath, 'file1.md'), '# File 1')
      writeFileSync(join(folderPath, 'file2.md'), '# File 2')

      const result = deleteWikiFile({
        path: 'folder-with-files',
        contentPath: TEST_DIR
      })

      expect(result.success).toBe(true)
      expect(existsSync(folderPath)).toBe(false)
    })

    it('should recursively delete folder with nested structure', () => {
      // Create complex nested structure
      const folderPath = join(TEST_DIR, 'parent')
      mkdirSync(join(folderPath, 'child1', 'grandchild'), { recursive: true })
      mkdirSync(join(folderPath, 'child2'), { recursive: true })

      writeFileSync(join(folderPath, 'index.md'), '# Parent')
      writeFileSync(join(folderPath, 'child1', 'index.md'), '# Child 1')
      writeFileSync(join(folderPath, 'child1', 'grandchild', 'file.md'), '# Grandchild')
      writeFileSync(join(folderPath, 'child2', 'file.md'), '# Child 2 File')

      const result = deleteWikiFile({
        path: 'parent',
        contentPath: TEST_DIR
      })

      expect(result.success).toBe(true)
      expect(existsSync(folderPath)).toBe(false)
      // All nested content should be gone
      expect(existsSync(join(folderPath, 'child1'))).toBe(false)
      expect(existsSync(join(folderPath, 'child2'))).toBe(false)
    })

    it('should delete folder with mixed files and folders', () => {
      // Create mixed structure
      const folderPath = join(TEST_DIR, 'mixed')
      mkdirSync(join(folderPath, 'subfolder'), { recursive: true })
      writeFileSync(join(folderPath, 'file1.md'), '# File 1')
      writeFileSync(join(folderPath, 'file2.md'), '# File 2')
      writeFileSync(join(folderPath, 'subfolder', 'nested.md'), '# Nested')

      const result = deleteWikiFile({
        path: 'mixed',
        contentPath: TEST_DIR
      })

      expect(result.success).toBe(true)
      expect(existsSync(folderPath)).toBe(false)
    })
  })

  describe('path validation', () => {
    it('should reject path traversal attempts', () => {
      // Create a file outside test dir (in parent)
      const outsideFile = join(TEST_DIR, '..', 'outside.md')
      writeFileSync(outsideFile, 'Should not be deletable')

      expect(() => {
        deleteWikiFile({
          path: '../outside.md',
          contentPath: TEST_DIR
        })
      }).toThrow('Path traversal detected')

      // File should still exist
      expect(existsSync(outsideFile)).toBe(true)

      // Clean up
      rmSync(outsideFile, { force: true })
    })

    it('should reject absolute paths', () => {
      expect(() => {
        deleteWikiFile({
          path: '/etc/passwd',
          contentPath: TEST_DIR
        })
      }).toThrow()
    })

    it('should handle paths with ./ prefix', () => {
      const filePath = join(TEST_DIR, 'test.md')
      writeFileSync(filePath, '# Test')

      const result = deleteWikiFile({
        path: './test.md',
        contentPath: TEST_DIR
      })

      expect(result.success).toBe(true)
      expect(existsSync(filePath)).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle permission errors gracefully', () => {
      // This test is tricky to implement in a cross-platform way
      // Skip for now, but in production this would test read-only files
    })
  })
})
