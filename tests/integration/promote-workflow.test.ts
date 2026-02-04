import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { writeWikiFile, readWikiFile, promoteFileToFolder } from '../../server/utils/file-operations'

const TEST_DIR = '/tmp/claude/mdumb-wiki-integration-promote'

describe('Promote Workflow Integration', () => {
  beforeEach(() => {
    // Create fresh test directory
    rmSync(TEST_DIR, { recursive: true, force: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    // Clean up test directory
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  describe('Basic promotion workflow', () => {
    it('should promote file to folder with index.md', () => {
      const filePath = 'guide.md'
      const content = '# Guide\n\nThis is a comprehensive guide.'

      // 1. Create initial file
      const createResult = writeWikiFile({
        path: filePath,
        content,
        hash: null,
        contentPath: TEST_DIR
      })

      expect(createResult.success).toBe(true)

      // Verify file exists
      const fileFullPath = join(TEST_DIR, filePath)
      expect(existsSync(fileFullPath)).toBe(true)

      // 2. Promote file to folder
      const promoteResult = promoteFileToFolder({
        path: filePath,
        contentPath: TEST_DIR
      })

      expect(promoteResult.success).toBe(true)
      expect(promoteResult.newPath).toBe('guide')

      // 3. Verify guide/ directory created
      const folderPath = join(TEST_DIR, 'guide')
      expect(existsSync(folderPath)).toBe(true)

      // 4. Verify guide/index.md exists
      const indexPath = join(TEST_DIR, 'guide', 'index.md')
      expect(existsSync(indexPath)).toBe(true)

      // 5. Verify original guide.md deleted
      expect(existsSync(fileFullPath)).toBe(false)

      // 6. Verify content preserved in index.md
      const indexContent = readFileSync(indexPath, 'utf-8')
      expect(indexContent).toBe(content)
    })

    it('should preserve exact content including whitespace', () => {
      const filePath = 'article.md'
      const content = '# Article\n\n  Indented text.\n\n\n\nMultiple newlines.\n\n- List item 1\n- List item 2\n'

      // Create file with specific formatting
      writeWikiFile({
        path: filePath,
        content,
        hash: null,
        contentPath: TEST_DIR
      })

      // Promote file
      const promoteResult = promoteFileToFolder({
        path: filePath,
        contentPath: TEST_DIR
      })

      expect(promoteResult.success).toBe(true)

      // Read index.md and verify exact match
      const indexPath = join(TEST_DIR, 'article', 'index.md')
      const indexContent = readFileSync(indexPath, 'utf-8')
      expect(indexContent).toBe(content)
    })

    it('should work with nested paths', () => {
      const filePath = 'docs/tutorial.md'
      const content = '# Tutorial\n\nStep by step instructions.'

      // Create nested file
      writeWikiFile({
        path: filePath,
        content,
        hash: null,
        contentPath: TEST_DIR
      })

      // Promote file
      const promoteResult = promoteFileToFolder({
        path: filePath,
        contentPath: TEST_DIR
      })

      expect(promoteResult.success).toBe(true)
      expect(promoteResult.newPath).toBe('docs/tutorial')

      // Verify structure: docs/tutorial/index.md
      const indexPath = join(TEST_DIR, 'docs', 'tutorial', 'index.md')
      expect(existsSync(indexPath)).toBe(true)

      // Verify original deleted
      const originalPath = join(TEST_DIR, filePath)
      expect(existsSync(originalPath)).toBe(false)

      // Verify content
      const indexContent = readFileSync(indexPath, 'utf-8')
      expect(indexContent).toBe(content)
    })
  })

  describe('Reading promoted files', () => {
    it('should read promoted file via index.md path', () => {
      const filePath = 'readme.md'
      const content = '# README\n\nProject documentation.'

      // Create and promote file
      writeWikiFile({
        path: filePath,
        content,
        hash: null,
        contentPath: TEST_DIR
      })

      promoteFileToFolder({
        path: filePath,
        contentPath: TEST_DIR
      })

      // Read via new path
      const readResult = readWikiFile('readme/index.md', TEST_DIR)

      expect(readResult.exists).toBe(true)
      expect(readResult.content).toBe(content)
      expect(readResult.hash).toBeDefined()
    })

    it('should not find file at old path after promotion', () => {
      const filePath = 'old-file.md'
      const content = '# Old File'

      // Create and promote file
      writeWikiFile({
        path: filePath,
        content,
        hash: null,
        contentPath: TEST_DIR
      })

      promoteFileToFolder({
        path: filePath,
        contentPath: TEST_DIR
      })

      // Attempt to read old path
      const readResult = readWikiFile(filePath, TEST_DIR)

      expect(readResult.exists).toBe(false)
      expect(readResult.content).toBeUndefined()
    })
  })

  describe('Error handling', () => {
    it('should fail when file does not exist', () => {
      const promoteResult = promoteFileToFolder({
        path: 'non-existent.md',
        contentPath: TEST_DIR
      })

      expect(promoteResult.success).toBe(false)
      expect(promoteResult.error).toBe('File does not exist')
      expect(promoteResult.newPath).toBeUndefined()
    })

    it('should fail when target folder already exists', () => {
      const filePath = 'existing.md'
      const content = '# Content'

      // Create file
      writeWikiFile({
        path: filePath,
        content,
        hash: null,
        contentPath: TEST_DIR
      })

      // Create target folder manually
      const folderPath = join(TEST_DIR, 'existing')
      mkdirSync(folderPath, { recursive: true })

      // Attempt promotion
      const promoteResult = promoteFileToFolder({
        path: filePath,
        contentPath: TEST_DIR
      })

      expect(promoteResult.success).toBe(false)
      expect(promoteResult.error).toBe('Target folder already exists')

      // Verify original file still exists
      const originalPath = join(TEST_DIR, filePath)
      expect(existsSync(originalPath)).toBe(true)
    })

    it('should fail when trying to promote non-.md file', () => {
      // This test documents current behavior - promoteFileToFolder
      // expects .md extension and removes it
      const filePath = 'document.txt'
      const content = 'Plain text file'

      // Create non-markdown file
      writeWikiFile({
        path: filePath,
        content,
        hash: null,
        contentPath: TEST_DIR
      })

      // Attempt promotion
      const promoteResult = promoteFileToFolder({
        path: filePath,
        contentPath: TEST_DIR
      })

      // Should fail because .replace(/\.md$/, '') doesn't match .txt
      // This results in trying to create a folder that already exists (the file path)
      expect(promoteResult.success).toBe(false)
      expect(promoteResult.error).toBe('Target folder already exists')

      // Verify original file still exists
      const originalPath = join(TEST_DIR, filePath)
      expect(existsSync(originalPath)).toBe(true)
    })
  })

  describe('Complex workflow scenarios', () => {
    it('should handle promote followed by creating child pages', () => {
      const parentPath = 'parent.md'
      const parentContent = '# Parent\n\nThis will become a section.'

      // 1. Create parent file
      writeWikiFile({
        path: parentPath,
        content: parentContent,
        hash: null,
        contentPath: TEST_DIR
      })

      // 2. Promote to folder
      const promoteResult = promoteFileToFolder({
        path: parentPath,
        contentPath: TEST_DIR
      })

      expect(promoteResult.success).toBe(true)

      // 3. Create child pages in new folder
      const child1Path = 'parent/child1.md'
      const child2Path = 'parent/child2.md'

      writeWikiFile({
        path: child1Path,
        content: '# Child 1',
        hash: null,
        contentPath: TEST_DIR
      })

      writeWikiFile({
        path: child2Path,
        content: '# Child 2',
        hash: null,
        contentPath: TEST_DIR
      })

      // 4. Verify structure
      expect(existsSync(join(TEST_DIR, 'parent', 'index.md'))).toBe(true)
      expect(existsSync(join(TEST_DIR, 'parent', 'child1.md'))).toBe(true)
      expect(existsSync(join(TEST_DIR, 'parent', 'child2.md'))).toBe(true)

      // 5. Verify parent content preserved
      const indexRead = readWikiFile('parent/index.md', TEST_DIR)
      expect(indexRead.content).toBe(parentContent)

      // 6. Verify children are readable
      const child1Read = readWikiFile(child1Path, TEST_DIR)
      expect(child1Read.exists).toBe(true)
      expect(child1Read.content).toBe('# Child 1')
    })

    it('should handle promoting deeply nested files', () => {
      const deepPath = 'level1/level2/level3/deep-file.md'
      const content = '# Deep File\n\nVery nested content.'

      // Create deeply nested file
      writeWikiFile({
        path: deepPath,
        content,
        hash: null,
        contentPath: TEST_DIR
      })

      // Promote it
      const promoteResult = promoteFileToFolder({
        path: deepPath,
        contentPath: TEST_DIR
      })

      expect(promoteResult.success).toBe(true)
      expect(promoteResult.newPath).toBe('level1/level2/level3/deep-file')

      // Verify new structure
      const indexPath = join(TEST_DIR, 'level1', 'level2', 'level3', 'deep-file', 'index.md')
      expect(existsSync(indexPath)).toBe(true)

      // Verify content
      const indexContent = readFileSync(indexPath, 'utf-8')
      expect(indexContent).toBe(content)
    })

    it('should maintain file integrity through promote and edit cycle', () => {
      const filePath = 'lifecycle.md'
      const v1Content = '# Lifecycle v1'
      const v2Content = '# Lifecycle v2\n\nUpdated after promotion.'

      // 1. Create initial file
      writeWikiFile({
        path: filePath,
        content: v1Content,
        hash: null,
        contentPath: TEST_DIR
      })

      // 2. Promote to folder
      promoteFileToFolder({
        path: filePath,
        contentPath: TEST_DIR
      })

      // 3. Read promoted file (as index.md)
      const readAfterPromote = readWikiFile('lifecycle/index.md', TEST_DIR)
      expect(readAfterPromote.content).toBe(v1Content)

      const hash = readAfterPromote.hash!

      // 4. Edit the promoted index.md
      const updateResult = writeWikiFile({
        path: 'lifecycle/index.md',
        content: v2Content,
        hash,
        contentPath: TEST_DIR
      })

      expect(updateResult.success).toBe(true)

      // 5. Verify updated content
      const readAfterUpdate = readWikiFile('lifecycle/index.md', TEST_DIR)
      expect(readAfterUpdate.content).toBe(v2Content)
      expect(readAfterUpdate.hash).not.toBe(hash)
    })
  })
})
