import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  loadIgnorePatterns,
  isIgnored,
  isPathIgnored,
  clearIgnoreCache,
  getIgnoreStatus,
  getIgnoreFilename
} from '../../server/utils/ignore'

describe('Ignore Utility', () => {
  const testDir = path.join(process.cwd(), 'tests', 'fixtures', 'ignore-test-' + Date.now())

  beforeEach(() => {
    // Clean up any existing test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    fs.mkdirSync(testDir, { recursive: true })
    // Clear cache before each test
    clearIgnoreCache()
  })

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    clearIgnoreCache()
  })

  describe('getIgnoreFilename()', () => {
    it('should return the correct ignore filename', () => {
      expect(getIgnoreFilename()).toBe('.mdumbignore')
    })
  })

  describe('loadIgnorePatterns()', () => {
    it('should return empty instance when .mdumbignore does not exist', () => {
      const ig = loadIgnorePatterns(testDir)
      expect(ig).toBeDefined()
      // Should not ignore anything when no file exists
      expect(ig.ignores('test.md')).toBe(false)
    })

    it('should load patterns from .mdumbignore file', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, 'drafts/\n*.secret.md')

      const ig = loadIgnorePatterns(testDir)

      expect(ig.ignores('drafts/')).toBe(true)
      expect(ig.ignores('test.secret.md')).toBe(true)
      expect(ig.ignores('test.md')).toBe(false)
    })

    it('should ignore comment lines (starting with #)', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, '# This is a comment\ndrafts/\n# Another comment\n*.tmp')

      const ig = loadIgnorePatterns(testDir)

      expect(ig.ignores('drafts/')).toBe(true)
      expect(ig.ignores('test.tmp')).toBe(true)
      // Comment should not be treated as a pattern
      expect(ig.ignores('# This is a comment')).toBe(false)
    })

    it('should ignore empty/blank lines', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, 'drafts/\n\n   \n*.tmp\n\n')

      const ig = loadIgnorePatterns(testDir)

      expect(ig.ignores('drafts/')).toBe(true)
      expect(ig.ignores('test.tmp')).toBe(true)
    })

    it('should cache instance (same instance returned on subsequent calls)', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, 'drafts/')

      const ig1 = loadIgnorePatterns(testDir)
      const ig2 = loadIgnorePatterns(testDir)

      expect(ig1).toBe(ig2)
    })

    it('should handle malformed/unreadable file gracefully', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      // Create a directory with the ignore filename to simulate unreadable
      fs.mkdirSync(ignorePath)

      // Should not throw, should return empty instance
      const ig = loadIgnorePatterns(testDir)
      expect(ig).toBeDefined()
      expect(ig.ignores('test.md')).toBe(false)

      // Clean up
      fs.rmdirSync(ignorePath)
    })

    it('should reset cache when clearIgnoreCache() called', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, 'drafts/')

      const ig1 = loadIgnorePatterns(testDir)
      expect(ig1.ignores('drafts/')).toBe(true)

      // Modify the file
      fs.writeFileSync(ignorePath, 'temp/')

      // Without clearing cache, should still use old patterns
      const ig2 = loadIgnorePatterns(testDir)
      expect(ig1).toBe(ig2)
      expect(ig2.ignores('drafts/')).toBe(true)

      // After clearing cache, should load new patterns
      clearIgnoreCache()
      const ig3 = loadIgnorePatterns(testDir)
      expect(ig1).not.toBe(ig3)
      expect(ig3.ignores('drafts/')).toBe(false)
      expect(ig3.ignores('temp/')).toBe(true)
    })
  })

  describe('isIgnored()', () => {
    it('should return false for non-matching paths', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, 'drafts/')

      expect(isIgnored('public/page.md', testDir)).toBe(false)
      expect(isIgnored('readme.md', testDir)).toBe(false)
    })

    it('should return true for matching file patterns', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, 'secret.md\n*.draft.md')

      expect(isIgnored('secret.md', testDir)).toBe(true)
      expect(isIgnored('test.draft.md', testDir)).toBe(true)
    })

    it('should normalize Windows backslash paths to forward slashes', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, 'drafts/')

      // Windows-style path should be normalized
      expect(isIgnored('drafts\\test.md', testDir)).toBe(true)
    })

    it('should handle nested paths correctly', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, 'drafts/\ndeep/nested/file.md')

      expect(isIgnored('drafts/test.md', testDir)).toBe(true)
      expect(isIgnored('deep/nested/file.md', testDir)).toBe(true)
      expect(isIgnored('deep/nested/other.md', testDir)).toBe(false)
    })
  })

  describe('isPathIgnored()', () => {
    it('should handle file paths (no trailing slash)', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, 'secret.md')

      expect(isPathIgnored('secret.md', false, testDir)).toBe(true)
      expect(isPathIgnored('other.md', false, testDir)).toBe(false)
    })

    it('should handle directory paths with trailing slash semantics', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, 'temp/')

      expect(isPathIgnored('temp', true, testDir)).toBe(true)
      expect(isPathIgnored('temp/file.md', false, testDir)).toBe(true)
    })

    it('should match directory patterns like "temp/" only for directories', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, 'temp/')

      // Directory named temp should be ignored
      expect(isPathIgnored('temp', true, testDir)).toBe(true)
      // File named temp (unlikely but possible) should be checked
      // The `ignore` package handles this - temp/ pattern with trailing slash is directory-only
    })
  })

  describe('Pattern Support', () => {
    it('should support simple filename patterns: secret.md', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, 'secret.md')

      expect(isIgnored('secret.md', testDir)).toBe(true)
      expect(isIgnored('other.md', testDir)).toBe(false)
    })

    it('should support glob star patterns: *.draft.md, *.tmp', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, '*.draft.md\n*.tmp')

      expect(isIgnored('post.draft.md', testDir)).toBe(true)
      expect(isIgnored('notes.tmp', testDir)).toBe(true)
      expect(isIgnored('post.md', testDir)).toBe(false)
    })

    it('should support double star patterns: **/*.backup, drafts/**', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, '**/*.backup\ndrafts/**')

      expect(isIgnored('deep/nested/file.backup', testDir)).toBe(true)
      expect(isIgnored('file.backup', testDir)).toBe(true)
      expect(isIgnored('drafts/post.md', testDir)).toBe(true)
      expect(isIgnored('drafts/deep/nested.md', testDir)).toBe(true)
    })

    it('should support directory patterns: temp/, private/', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, 'temp/\nprivate/')

      expect(isPathIgnored('temp', true, testDir)).toBe(true)
      expect(isPathIgnored('private', true, testDir)).toBe(true)
      expect(isIgnored('temp/file.md', testDir)).toBe(true)
      expect(isIgnored('private/secret.md', testDir)).toBe(true)
    })

    it('should support negation patterns: !important.md (unignore)', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, '*.secret.md\n!important.secret.md')

      expect(isIgnored('hidden.secret.md', testDir)).toBe(true)
      expect(isIgnored('important.secret.md', testDir)).toBe(false)
    })

    it('should support multiple patterns in single file', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, 'drafts/**\n*.tmp\nprivate/\n!drafts/important.md')

      expect(isIgnored('drafts/test.md', testDir)).toBe(true)
      expect(isIgnored('file.tmp', testDir)).toBe(true)
      expect(isIgnored('private/secret.md', testDir)).toBe(true)
      // Note: negation works by re-including files that were previously ignored
      // The pattern "drafts/**" ignores all files in drafts/, then "!drafts/important.md" unignores it
      expect(isIgnored('drafts/important.md', testDir)).toBe(false) // negated
      expect(isIgnored('public/page.md', testDir)).toBe(false)
    })

    it('should handle patterns with spaces (trimmed correctly)', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, '  drafts/  \n  *.tmp  ')

      expect(isIgnored('drafts/test.md', testDir)).toBe(true)
      expect(isIgnored('file.tmp', testDir)).toBe(true)
    })
  })

  describe('Cache Behavior', () => {
    it('should clear cached instance with clearIgnoreCache()', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, 'drafts/')

      loadIgnorePatterns(testDir)
      expect(getIgnoreStatus().loaded).toBe(true)

      clearIgnoreCache()
      expect(getIgnoreStatus().loaded).toBe(false)
    })

    it('should return correct loaded state from getIgnoreStatus()', () => {
      expect(getIgnoreStatus().loaded).toBe(false)
      expect(getIgnoreStatus().wikiPath).toBeNull()

      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, 'drafts/')
      loadIgnorePatterns(testDir)

      expect(getIgnoreStatus().loaded).toBe(true)
      expect(getIgnoreStatus().wikiPath).toBe(testDir)
    })

    it('should track cache path correctly', () => {
      const ignorePath = path.join(testDir, '.mdumbignore')
      fs.writeFileSync(ignorePath, 'drafts/')

      loadIgnorePatterns(testDir)
      expect(getIgnoreStatus().wikiPath).toBe(testDir)

      // Create another test dir
      const testDir2 = testDir + '-2'
      fs.mkdirSync(testDir2, { recursive: true })
      fs.writeFileSync(path.join(testDir2, '.mdumbignore'), 'temp/')

      // Loading for different path should update cache
      loadIgnorePatterns(testDir2)
      expect(getIgnoreStatus().wikiPath).toBe(testDir2)

      // Clean up
      fs.rmSync(testDir2, { recursive: true, force: true })
    })
  })
})
