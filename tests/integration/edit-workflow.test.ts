import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, rmSync, readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { readWikiFile, writeWikiFile } from '../../server/utils/file-operations'

const TEST_DIR = '/tmp/claude/mdumb-wiki-integration-edit'

describe('Edit Workflow Integration', () => {
  beforeEach(() => {
    // Create fresh test directory
    rmSync(TEST_DIR, { recursive: true, force: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    // Clean up test directory
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  describe('Create new file workflow', () => {
    it('should create new file and retrieve it', () => {
      const filePath = 'new-page.md'
      const content = '# New Page\n\nThis is a new page.'

      // 1. Verify file doesn't exist
      const initialRead = readWikiFile(filePath, TEST_DIR)
      expect(initialRead.exists).toBe(false)

      // 2. Create file via writeWikiFile (no hash for new file)
      const writeResult = writeWikiFile({
        path: filePath,
        content,
        hash: null,
        contentPath: TEST_DIR
      })

      expect(writeResult.success).toBe(true)
      expect(writeResult.newHash).toBeDefined()
      expect(writeResult.newHash).toHaveLength(64)

      // 3. Verify file exists on disk
      const fullPath = join(TEST_DIR, filePath)
      expect(existsSync(fullPath)).toBe(true)

      // 4. Verify content is correct
      const diskContent = readFileSync(fullPath, 'utf-8')
      expect(diskContent).toBe(content)

      // 5. Read file via readWikiFile
      const readResult = readWikiFile(filePath, TEST_DIR)
      expect(readResult.exists).toBe(true)
      expect(readResult.content).toBe(content)
      expect(readResult.hash).toBe(writeResult.newHash)
    })

    it('should not create duplicate file when editing newly created file', () => {
      // This test verifies the fix for the bug where creating a file in a folder
      // and then editing it would create two files: "file.md" and "file.md.md"
      const folderPath = 'my-folder'
      const fileName = 'new-page.md'
      const filePath = `${folderPath}/${fileName}`
      const initialContent = '# New Page\n\nInitial content.'
      const editedContent = '# New Page\n\nEdited content.'

      // 1. Create the file (simulating CreateFileModal behavior)
      const createResult = writeWikiFile({
        path: filePath, // CreateFileModal creates with .md extension
        content: initialContent,
        hash: null,
        contentPath: TEST_DIR
      })

      expect(createResult.success).toBe(true)
      const initialHash = createResult.newHash!

      // 2. Simulate navigation to edit page
      // The app.vue handleFileCreated should strip .md before navigation
      // So the editor receives path without .md extension
      const pathWithoutExt = filePath.replace(/\.md$/, '')
      const editorFilePath = `${pathWithoutExt}.md` // Editor adds .md back

      // 3. Load file in editor (should load the same file, not create new one)
      const loadResult = readWikiFile(editorFilePath, TEST_DIR)
      expect(loadResult.exists).toBe(true)
      expect(loadResult.content).toBe(initialContent)

      // 4. Save edited content
      const saveResult = writeWikiFile({
        path: editorFilePath,
        content: editedContent,
        hash: initialHash,
        contentPath: TEST_DIR
      })

      expect(saveResult.success).toBe(true)

      // 5. CRITICAL: Verify no duplicate file was created
      const duplicatePath = `${filePath}.md` // This would be "my-folder/new-page.md.md"
      const duplicateFullPath = join(TEST_DIR, duplicatePath)
      expect(existsSync(duplicateFullPath)).toBe(false)

      // 6. Verify original file was updated (not replaced)
      const verifyResult = readWikiFile(filePath, TEST_DIR)
      expect(verifyResult.exists).toBe(true)
      expect(verifyResult.content).toBe(editedContent)
      expect(verifyResult.hash).toBe(saveResult.newHash)

      // 7. Verify only one file exists in the folder
      const folderFullPath = join(TEST_DIR, folderPath)
      const filesInFolder = readdirSync(folderFullPath)
      expect(filesInFolder).toHaveLength(1)
      expect(filesInFolder[0]).toBe(fileName)
    })

    it('should create file with nested path', () => {
      const filePath = 'guides/getting-started.md'
      const content = '# Getting Started\n\nWelcome to the guide.'

      // Create file (should auto-create parent directories)
      const writeResult = writeWikiFile({
        path: filePath,
        content,
        hash: null,
        contentPath: TEST_DIR
      })

      expect(writeResult.success).toBe(true)

      // Verify parent directory was created
      const parentDir = join(TEST_DIR, 'guides')
      expect(existsSync(parentDir)).toBe(true)

      // Verify file exists
      const fullPath = join(TEST_DIR, filePath)
      expect(existsSync(fullPath)).toBe(true)

      // Verify content
      const readResult = readWikiFile(filePath, TEST_DIR)
      expect(readResult.exists).toBe(true)
      expect(readResult.content).toBe(content)
    })
  })

  describe('Edit existing file workflow', () => {
    it('should load, modify, and save existing file', () => {
      const filePath = 'existing-page.md'
      const initialContent = '# Initial Content\n\nThis is the original text.'
      const updatedContent = '# Updated Content\n\nThis text has been modified.'

      // 1. Create initial file
      const createResult = writeWikiFile({
        path: filePath,
        content: initialContent,
        hash: null,
        contentPath: TEST_DIR
      })

      expect(createResult.success).toBe(true)
      const initialHash = createResult.newHash!

      // 2. Load file (simulating editor load)
      const loadResult = readWikiFile(filePath, TEST_DIR)
      expect(loadResult.exists).toBe(true)
      expect(loadResult.content).toBe(initialContent)
      expect(loadResult.hash).toBe(initialHash)

      // 3. Save modified content with correct hash
      const updateResult = writeWikiFile({
        path: filePath,
        content: updatedContent,
        hash: initialHash,
        contentPath: TEST_DIR
      })

      expect(updateResult.success).toBe(true)
      expect(updateResult.newHash).toBeDefined()
      expect(updateResult.newHash).not.toBe(initialHash) // Hash should change

      // 4. Verify file on disk has updated content
      const fullPath = join(TEST_DIR, filePath)
      const diskContent = readFileSync(fullPath, 'utf-8')
      expect(diskContent).toBe(updatedContent)

      // 5. Load again and verify changes persisted
      const verifyResult = readWikiFile(filePath, TEST_DIR)
      expect(verifyResult.exists).toBe(true)
      expect(verifyResult.content).toBe(updatedContent)
      expect(verifyResult.hash).toBe(updateResult.newHash)
    })

    it('should handle multiple sequential edits', () => {
      const filePath = 'multi-edit.md'
      const versions = [
        '# Version 1',
        '# Version 2\n\nAdded content.',
        '# Version 3\n\nMore content.\n\nAnd more.'
      ]

      let currentHash: string | undefined

      // Create initial version
      const createResult = writeWikiFile({
        path: filePath,
        content: versions[0],
        hash: null,
        contentPath: TEST_DIR
      })

      expect(createResult.success).toBe(true)
      currentHash = createResult.newHash

      // Apply each version sequentially
      for (let i = 1; i < versions.length; i++) {
        const updateResult = writeWikiFile({
          path: filePath,
          content: versions[i],
          hash: currentHash!,
          contentPath: TEST_DIR
        })

        expect(updateResult.success).toBe(true)
        expect(updateResult.newHash).toBeDefined()
        expect(updateResult.newHash).not.toBe(currentHash)

        currentHash = updateResult.newHash

        // Verify content after each update
        const verifyResult = readWikiFile(filePath, TEST_DIR)
        expect(verifyResult.content).toBe(versions[i])
        expect(verifyResult.hash).toBe(currentHash)
      }
    })
  })

  describe('Hash tracking workflow', () => {
    it('should generate different hashes for different content', () => {
      const filePath = 'hash-test.md'
      const content1 = '# Content A'
      const content2 = '# Content B'

      // Create with first content
      const write1 = writeWikiFile({
        path: filePath,
        content: content1,
        hash: null,
        contentPath: TEST_DIR
      })

      const hash1 = write1.newHash!

      // Update with second content
      const write2 = writeWikiFile({
        path: filePath,
        content: content2,
        hash: hash1,
        contentPath: TEST_DIR
      })

      const hash2 = write2.newHash!

      // Hashes should be different
      expect(hash1).not.toBe(hash2)

      // Verify both are valid SHA-256 hashes
      expect(hash1).toHaveLength(64)
      expect(hash2).toHaveLength(64)
    })

    it('should generate same hash for identical content', () => {
      const content = '# Test Content\n\nSome text here.'

      // Create file
      const write1 = writeWikiFile({
        path: 'file1.md',
        content,
        hash: null,
        contentPath: TEST_DIR
      })

      // Create another file with same content
      const write2 = writeWikiFile({
        path: 'file2.md',
        content,
        hash: null,
        contentPath: TEST_DIR
      })

      // Hashes should be identical
      expect(write1.newHash).toBe(write2.newHash)
    })

    it('should maintain hash consistency across read operations', () => {
      const filePath = 'consistency-test.md'
      const content = '# Consistency Test'

      // Create file
      const writeResult = writeWikiFile({
        path: filePath,
        content,
        hash: null,
        contentPath: TEST_DIR
      })

      const writeHash = writeResult.newHash!

      // Read multiple times
      const read1 = readWikiFile(filePath, TEST_DIR)
      const read2 = readWikiFile(filePath, TEST_DIR)
      const read3 = readWikiFile(filePath, TEST_DIR)

      // All reads should return same hash
      expect(read1.hash).toBe(writeHash)
      expect(read2.hash).toBe(writeHash)
      expect(read3.hash).toBe(writeHash)
    })
  })

  describe('Error handling workflow', () => {
    it('should handle reading non-existent file', () => {
      const result = readWikiFile('does-not-exist.md', TEST_DIR)

      expect(result.exists).toBe(false)
      expect(result.content).toBeUndefined()
      expect(result.hash).toBeUndefined()
      expect(result.path).toBe('does-not-exist.md')
    })

    it('should handle writing to deeply nested path', () => {
      const filePath = 'level1/level2/level3/deep-file.md'
      const content = '# Deep File'

      const writeResult = writeWikiFile({
        path: filePath,
        content,
        hash: null,
        contentPath: TEST_DIR
      })

      expect(writeResult.success).toBe(true)

      // Verify all directories were created
      const fullPath = join(TEST_DIR, filePath)
      expect(existsSync(fullPath)).toBe(true)

      // Verify content
      const readResult = readWikiFile(filePath, TEST_DIR)
      expect(readResult.exists).toBe(true)
      expect(readResult.content).toBe(content)
    })
  })
})
