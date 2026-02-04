import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { readWikiFile, writeWikiFile } from '../../server/utils/file-operations'
import { computeContentHash } from '../../server/utils/file-hash'

const TEST_DIR = '/tmp/claude/mdumb-wiki-integration-conflict'

describe('Conflict Detection Workflow Integration', () => {
  beforeEach(() => {
    // Create fresh test directory
    rmSync(TEST_DIR, { recursive: true, force: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    // Clean up test directory
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  describe('Hash-based conflict detection', () => {
    it('should detect conflict when file modified externally', () => {
      const filePath = 'conflict-test.md'
      const originalContent = '# Original Content'
      const externalContent = '# External Modification'
      const userContent = '# User Modification'

      // 1. Create initial file
      const createResult = writeWikiFile({
        path: filePath,
        content: originalContent,
        hash: null,
        contentPath: TEST_DIR
      })

      const originalHash = createResult.newHash!

      // 2. Load file (simulating user opening editor)
      const loadResult = readWikiFile(filePath, TEST_DIR)
      expect(loadResult.hash).toBe(originalHash)

      // 3. Modify file externally (simulating another user or process)
      const fullPath = join(TEST_DIR, filePath)
      writeFileSync(fullPath, externalContent, 'utf-8')

      // 4. User attempts to save with old hash
      const saveResult = writeWikiFile({
        path: filePath,
        content: userContent,
        hash: originalHash, // Using old hash
        contentPath: TEST_DIR
      })

      // 5. Should detect conflict
      expect(saveResult.success).toBe(false)
      expect(saveResult.conflict).toBeDefined()
      expect(saveResult.conflict!.conflictDetected).toBe(true)
      expect(saveResult.conflict!.currentHash).toBeDefined()
      expect(saveResult.conflict!.currentHash).not.toBe(originalHash)
    })

    it('should provide current hash in conflict response', () => {
      const filePath = 'hash-conflict.md'
      const originalContent = '# Original'
      const modifiedContent = '# Modified'

      // Create file
      const createResult = writeWikiFile({
        path: filePath,
        content: originalContent,
        hash: null,
        contentPath: TEST_DIR
      })

      const oldHash = createResult.newHash!

      // Modify file externally
      const fullPath = join(TEST_DIR, filePath)
      writeFileSync(fullPath, modifiedContent, 'utf-8')

      // Calculate expected new hash
      const expectedHash = computeContentHash(modifiedContent)

      // Attempt save with old hash
      const saveResult = writeWikiFile({
        path: filePath,
        content: '# User Content',
        hash: oldHash,
        contentPath: TEST_DIR
      })

      // Conflict should include current hash
      expect(saveResult.success).toBe(false)
      expect(saveResult.conflict!.currentHash).toBe(expectedHash)
    })

    it('should allow save when hash matches', () => {
      const filePath = 'no-conflict.md'
      const originalContent = '# Original'
      const newContent = '# Updated'

      // Create file
      const createResult = writeWikiFile({
        path: filePath,
        content: originalContent,
        hash: null,
        contentPath: TEST_DIR
      })

      const currentHash = createResult.newHash!

      // Save with correct hash (no external modification)
      const saveResult = writeWikiFile({
        path: filePath,
        content: newContent,
        hash: currentHash,
        contentPath: TEST_DIR
      })

      // Should succeed
      expect(saveResult.success).toBe(true)
      expect(saveResult.conflict).toBeUndefined()
      expect(saveResult.newHash).toBeDefined()
    })
  })

  describe('Multiple concurrent edits', () => {
    it('should handle race condition between two editors', () => {
      const filePath = 'race-condition.md'
      const originalContent = '# Original'

      // Create file
      const createResult = writeWikiFile({
        path: filePath,
        content: originalContent,
        hash: null,
        contentPath: TEST_DIR
      })

      const sharedHash = createResult.newHash!

      // Editor A saves first
      const editorAResult = writeWikiFile({
        path: filePath,
        content: '# Editor A Changes',
        hash: sharedHash,
        contentPath: TEST_DIR
      })

      expect(editorAResult.success).toBe(true)
      const newHashAfterA = editorAResult.newHash!

      // Editor B attempts to save with stale hash
      const editorBResult = writeWikiFile({
        path: filePath,
        content: '# Editor B Changes',
        hash: sharedHash, // Stale hash
        contentPath: TEST_DIR
      })

      // Editor B should get conflict
      expect(editorBResult.success).toBe(false)
      expect(editorBResult.conflict!.conflictDetected).toBe(true)
      expect(editorBResult.conflict!.currentHash).toBe(newHashAfterA)

      // Verify Editor A's changes are preserved
      const verifyResult = readWikiFile(filePath, TEST_DIR)
      expect(verifyResult.content).toBe('# Editor A Changes')
      expect(verifyResult.hash).toBe(newHashAfterA)
    })

    it('should allow Editor B to save after resolving conflict', () => {
      const filePath = 'conflict-resolution.md'
      const originalContent = '# Original'

      // Create file
      const createResult = writeWikiFile({
        path: filePath,
        content: originalContent,
        hash: null,
        contentPath: TEST_DIR
      })

      const sharedHash = createResult.newHash!

      // Editor A saves
      const editorAResult = writeWikiFile({
        path: filePath,
        content: '# Editor A Changes',
        hash: sharedHash,
        contentPath: TEST_DIR
      })

      const hashAfterA = editorAResult.newHash!

      // Editor B gets conflict
      const editorBFirstAttempt = writeWikiFile({
        path: filePath,
        content: '# Editor B Changes',
        hash: sharedHash,
        contentPath: TEST_DIR
      })

      expect(editorBFirstAttempt.success).toBe(false)

      // Editor B reloads and gets current content
      const reloadResult = readWikiFile(filePath, TEST_DIR)
      expect(reloadResult.hash).toBe(hashAfterA)

      // Editor B resolves conflict and saves with correct hash
      const editorBSecondAttempt = writeWikiFile({
        path: filePath,
        content: '# Editor B Merged Changes',
        hash: hashAfterA, // Using current hash
        contentPath: TEST_DIR
      })

      expect(editorBSecondAttempt.success).toBe(true)
      expect(editorBSecondAttempt.newHash).toBeDefined()
    })
  })

  describe('Null hash behavior', () => {
    it('should skip conflict detection when hash is null', () => {
      const filePath = 'no-hash-check.md'
      const originalContent = '# Original'
      const modifiedContent = '# Modified'

      // Create file
      writeWikiFile({
        path: filePath,
        content: originalContent,
        hash: null,
        contentPath: TEST_DIR
      })

      // Modify externally
      const fullPath = join(TEST_DIR, filePath)
      writeFileSync(fullPath, modifiedContent, 'utf-8')

      // Save with null hash (force overwrite)
      const saveResult = writeWikiFile({
        path: filePath,
        content: '# Force Overwrite',
        hash: null,
        contentPath: TEST_DIR
      })

      // Should succeed without conflict detection
      expect(saveResult.success).toBe(true)
      expect(saveResult.conflict).toBeUndefined()

      // Verify content was overwritten
      const verifyResult = readWikiFile(filePath, TEST_DIR)
      expect(verifyResult.content).toBe('# Force Overwrite')
    })

    it('should allow creating new file with null hash', () => {
      const filePath = 'new-file-null-hash.md'
      const content = '# New File'

      // Create new file with null hash
      const createResult = writeWikiFile({
        path: filePath,
        content,
        hash: null,
        contentPath: TEST_DIR
      })

      expect(createResult.success).toBe(true)
      expect(createResult.newHash).toBeDefined()

      // Verify file was created
      const readResult = readWikiFile(filePath, TEST_DIR)
      expect(readResult.exists).toBe(true)
      expect(readResult.content).toBe(content)
    })
  })

  describe('Edge cases', () => {
    it('should detect conflict when file content changes but hash provided', () => {
      const filePath = 'edge-case-1.md'
      const content1 = '# Content Version 1'
      const content2 = '# Content Version 2'
      const content3 = '# Content Version 3'

      // Create file
      const createResult = writeWikiFile({
        path: filePath,
        content: content1,
        hash: null,
        contentPath: TEST_DIR
      })

      const hash1 = createResult.newHash!

      // Update to version 2
      const update2 = writeWikiFile({
        path: filePath,
        content: content2,
        hash: hash1,
        contentPath: TEST_DIR
      })

      const hash2 = update2.newHash!

      // Attempt to save version 3 with hash1 (skipped version 2)
      const update3 = writeWikiFile({
        path: filePath,
        content: content3,
        hash: hash1,
        contentPath: TEST_DIR
      })

      // Should detect conflict
      expect(update3.success).toBe(false)
      expect(update3.conflict!.currentHash).toBe(hash2)
    })

    it('should handle empty content changes', () => {
      const filePath = 'empty-content.md'

      // Create file with content
      const createResult = writeWikiFile({
        path: filePath,
        content: '# Some Content',
        hash: null,
        contentPath: TEST_DIR
      })

      const hash = createResult.newHash!

      // Update to empty content
      const updateResult = writeWikiFile({
        path: filePath,
        content: '',
        hash,
        contentPath: TEST_DIR
      })

      expect(updateResult.success).toBe(true)
      expect(updateResult.newHash).toBeDefined()
      expect(updateResult.newHash).not.toBe(hash)

      // Verify empty content
      const readResult = readWikiFile(filePath, TEST_DIR)
      expect(readResult.content).toBe('')
    })

    it('should detect conflict even for small changes', () => {
      const filePath = 'small-change.md'
      const content1 = '# Title'
      const content2 = '# Title.' // Added period

      // Create file
      const createResult = writeWikiFile({
        path: filePath,
        content: content1,
        hash: null,
        contentPath: TEST_DIR
      })

      const hash1 = createResult.newHash!

      // Modify externally with small change
      const fullPath = join(TEST_DIR, filePath)
      writeFileSync(fullPath, content2, 'utf-8')

      // Attempt to save with old hash
      const saveResult = writeWikiFile({
        path: filePath,
        content: '# Different Title',
        hash: hash1,
        contentPath: TEST_DIR
      })

      // Should still detect conflict
      expect(saveResult.success).toBe(false)
      expect(saveResult.conflict!.conflictDetected).toBe(true)
    })
  })
})
