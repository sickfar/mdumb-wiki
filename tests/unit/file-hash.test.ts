import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { computeFileHash, computeContentHash } from '../../server/utils/file-hash'

const TEST_DIR = '/tmp/claude/mdumb-wiki-test-file-hash'

describe('File Hash Utility', () => {
  beforeEach(() => {
    // Create test directory
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    // Clean up test directory
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  describe('computeContentHash', () => {
    it('should compute same hash for identical content', () => {
      const content = 'Hello, World!'
      const hash1 = computeContentHash(content)
      const hash2 = computeContentHash(content)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64) // SHA-256 produces 64 hex characters
    })

    it('should compute different hash for different content', () => {
      const content1 = 'Hello, World!'
      const content2 = 'Goodbye, World!'

      const hash1 = computeContentHash(content1)
      const hash2 = computeContentHash(content2)

      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty string', () => {
      const hash = computeContentHash('')

      expect(hash).toHaveLength(64)
      // SHA-256 of empty string is known constant
      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    })
  })

  describe('computeFileHash', () => {
    it('should compute hash from file content', async () => {
      const filePath = join(TEST_DIR, 'test.txt')
      const content = 'Test file content'

      writeFileSync(filePath, content)

      const fileHash = await computeFileHash(filePath)
      const contentHash = computeContentHash(content)

      expect(fileHash).toBe(contentHash)
    })

    it('should throw error for non-existent file', async () => {
      const filePath = join(TEST_DIR, 'does-not-exist.txt')

      await expect(computeFileHash(filePath)).rejects.toThrow()
    })
  })

  describe('hash consistency', () => {
    it('should produce consistent hashes across file and content methods', async () => {
      const testCases = [
        'Simple text',
        'Multiple\nlines\nof\ntext',
        'Special chars: !@#$%^&*()',
        '# Markdown\n\n**Bold** and *italic*',
        ''
      ]

      for (const content of testCases) {
        const filePath = join(TEST_DIR, `test-${Math.random()}.txt`)
        writeFileSync(filePath, content)

        const fileHash = await computeFileHash(filePath)
        const contentHash = computeContentHash(content)

        expect(fileHash).toBe(contentHash)
      }
    })
  })
})
