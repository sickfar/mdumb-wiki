import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { buildNavigation } from '../../server/utils/navigation'
import { buildSearchIndex } from '../../server/utils/search-index'
import { readWikiFile } from '../../server/utils/file-operations'
import {
  loadIgnorePatterns,
  clearIgnoreCache,
  getIgnoreStatus
} from '../../server/utils/ignore'

/**
 * Integration tests for the .mdumbignore feature
 * Tests end-to-end scenarios including:
 * - Creating ignore files
 * - Modifying ignore patterns
 * - Cache invalidation
 * - Multiple module coordination
 */
describe('Ignore Integration', () => {
  const testDir = path.join(process.cwd(), 'tests', 'fixtures', 'ignore-integration-test')

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    fs.mkdirSync(testDir, { recursive: true })
    clearIgnoreCache()
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    clearIgnoreCache()
  })

  describe('End-to-end: Create ignore file, verify navigation excludes files', () => {
    it('should exclude files after creating .mdumbignore', () => {
      // Step 1: Create wiki content
      fs.writeFileSync(path.join(testDir, 'public.md'), '---\ntitle: Public\n---\n# Public')
      fs.writeFileSync(path.join(testDir, 'secret.md'), '---\ntitle: Secret\n---\n# Secret')
      fs.mkdirSync(path.join(testDir, 'drafts'), { recursive: true })
      fs.writeFileSync(path.join(testDir, 'drafts', 'wip.md'), '---\ntitle: WIP\n---\n# WIP')

      // Step 2: Without ignore file, all files should be visible
      let navigation = buildNavigation(testDir)
      expect(navigation.find(item => item.slug === 'secret')).toBeDefined()
      expect(navigation.find(item => item.slug === 'drafts')).toBeDefined()

      // Step 3: Create ignore file
      fs.writeFileSync(path.join(testDir, '.mdumbignore'), 'secret.md\ndrafts/')

      // Step 4: Clear cache to pick up new ignore file
      clearIgnoreCache()

      // Step 5: Verify files are now excluded
      navigation = buildNavigation(testDir)
      expect(navigation.find(item => item.slug === 'secret')).toBeUndefined()
      expect(navigation.find(item => item.slug === 'drafts')).toBeUndefined()
      expect(navigation.find(item => item.slug === 'public')).toBeDefined()
    })
  })

  describe('End-to-end: Modify ignore file, verify cache invalidation', () => {
    it('should update filtering when ignore patterns change', () => {
      // Setup content
      fs.writeFileSync(path.join(testDir, 'file1.md'), '---\ntitle: File 1\n---\n# File 1')
      fs.writeFileSync(path.join(testDir, 'file2.md'), '---\ntitle: File 2\n---\n# File 2')
      fs.writeFileSync(path.join(testDir, 'file3.md'), '---\ntitle: File 3\n---\n# File 3')

      // Create initial ignore file
      fs.writeFileSync(path.join(testDir, '.mdumbignore'), 'file1.md')
      loadIgnorePatterns(testDir)

      // Verify initial state
      let navigation = buildNavigation(testDir)
      expect(navigation.find(item => item.slug === 'file1')).toBeUndefined()
      expect(navigation.find(item => item.slug === 'file2')).toBeDefined()
      expect(navigation.find(item => item.slug === 'file3')).toBeDefined()

      // Modify ignore file to ignore file2 instead
      fs.writeFileSync(path.join(testDir, '.mdumbignore'), 'file2.md')
      clearIgnoreCache()
      loadIgnorePatterns(testDir)

      // Verify updated state
      navigation = buildNavigation(testDir)
      expect(navigation.find(item => item.slug === 'file1')).toBeDefined()
      expect(navigation.find(item => item.slug === 'file2')).toBeUndefined()
      expect(navigation.find(item => item.slug === 'file3')).toBeDefined()
    })
  })

  describe('End-to-end: Delete ignore file, verify all files become visible', () => {
    it('should show all files after .mdumbignore is deleted', async () => {
      // Setup content and ignore file
      fs.writeFileSync(path.join(testDir, 'visible.md'), '---\ntitle: Visible\n---\n# Visible')
      fs.writeFileSync(path.join(testDir, 'hidden.md'), '---\ntitle: Hidden\n---\n# Hidden')
      fs.writeFileSync(path.join(testDir, '.mdumbignore'), 'hidden.md')

      // Verify hidden initially
      let navigation = buildNavigation(testDir)
      expect(navigation.find(item => item.slug === 'hidden')).toBeUndefined()
      expect(navigation.find(item => item.slug === 'visible')).toBeDefined()

      // Delete ignore file
      fs.unlinkSync(path.join(testDir, '.mdumbignore'))
      clearIgnoreCache()

      // Verify all files visible
      navigation = buildNavigation(testDir)
      expect(navigation.find(item => item.slug === 'hidden')).toBeDefined()
      expect(navigation.find(item => item.slug === 'visible')).toBeDefined()

      // Verify in search too
      const index = await buildSearchIndex(testDir)
      expect(index.find(item => item.title === 'Hidden')).toBeDefined()
      expect(index.find(item => item.title === 'Visible')).toBeDefined()
    })
  })

  describe('Hot reload: Add pattern, verify immediate effect on navigation', () => {
    it('should immediately filter files when pattern is added', () => {
      // Setup content
      fs.writeFileSync(path.join(testDir, 'draft1.md'), '---\ntitle: Draft 1\n---\n# Draft 1')
      fs.writeFileSync(path.join(testDir, 'draft2.md'), '---\ntitle: Draft 2\n---\n# Draft 2')
      fs.writeFileSync(path.join(testDir, 'final.md'), '---\ntitle: Final\n---\n# Final')

      // No ignore file initially
      let navigation = buildNavigation(testDir)
      expect(navigation).toHaveLength(3)

      // Add ignore file with pattern
      fs.writeFileSync(path.join(testDir, '.mdumbignore'), 'draft*.md')
      clearIgnoreCache()

      // Verify immediate effect
      navigation = buildNavigation(testDir)
      expect(navigation).toHaveLength(1)
      expect(navigation[0].title).toBe('Final')
    })
  })

  describe('Hot reload: Remove pattern, verify files reappear', () => {
    it('should immediately show files when pattern is removed', () => {
      // Setup content and ignore file
      fs.writeFileSync(path.join(testDir, 'secret.md'), '---\ntitle: Secret\n---\n# Secret')
      fs.writeFileSync(path.join(testDir, 'public.md'), '---\ntitle: Public\n---\n# Public')
      fs.writeFileSync(path.join(testDir, '.mdumbignore'), 'secret.md')

      // Verify hidden initially
      let navigation = buildNavigation(testDir)
      expect(navigation.find(item => item.slug === 'secret')).toBeUndefined()

      // Remove pattern from ignore file (make it empty)
      fs.writeFileSync(path.join(testDir, '.mdumbignore'), '')
      clearIgnoreCache()

      // Verify files reappear
      navigation = buildNavigation(testDir)
      expect(navigation.find(item => item.slug === 'secret')).toBeDefined()
    })
  })

  describe('Multiple modules use same cache instance', () => {
    it('should share cache between navigation and search', async () => {
      // Setup content
      fs.writeFileSync(path.join(testDir, 'shared.md'), '---\ntitle: Shared\n---\n# Shared')
      fs.writeFileSync(path.join(testDir, '.mdumbignore'), 'shared.md')

      // Both should use same cached instance
      loadIgnorePatterns(testDir)
      const status1 = getIgnoreStatus()

      // Navigation check
      const navigation = buildNavigation(testDir)
      expect(navigation.find(item => item.slug === 'shared')).toBeUndefined()
      const status2 = getIgnoreStatus()

      // Search check
      const index = await buildSearchIndex(testDir)
      expect(index.find(item => item.title === 'Shared')).toBeUndefined()
      const status3 = getIgnoreStatus()

      // All should report same cached path
      expect(status1.wikiPath).toBe(testDir)
      expect(status2.wikiPath).toBe(testDir)
      expect(status3.wikiPath).toBe(testDir)
    })
  })

  describe('Soft ignore: Verify direct URL access still works for ignored files', () => {
    it('should allow direct access to ignored files', () => {
      // Setup content
      fs.writeFileSync(path.join(testDir, 'hidden.md'), '---\ntitle: Hidden\n---\n# Hidden content')
      fs.writeFileSync(path.join(testDir, '.mdumbignore'), 'hidden.md')

      // Verify hidden in navigation
      const navigation = buildNavigation(testDir)
      expect(navigation.find(item => item.slug === 'hidden')).toBeUndefined()

      // But still accessible via readWikiFile (simulating direct URL)
      const result = readWikiFile('hidden.md', testDir)
      expect(result.exists).toBe(true)
      expect(result.content).toContain('# Hidden content')
    })

    it('should allow direct access to files in ignored folders', () => {
      // Setup content
      fs.mkdirSync(path.join(testDir, 'private'), { recursive: true })
      fs.writeFileSync(path.join(testDir, 'private', 'secret.md'), '---\ntitle: Secret\n---\n# Secret')
      fs.writeFileSync(path.join(testDir, '.mdumbignore'), 'private/')

      // Verify folder hidden in navigation
      const navigation = buildNavigation(testDir)
      expect(navigation.find(item => item.slug === 'private')).toBeUndefined()

      // But files still accessible via readWikiFile
      const result = readWikiFile('private/secret.md', testDir)
      expect(result.exists).toBe(true)
      expect(result.content).toContain('# Secret')
    })
  })

  describe('Complex patterns integration', () => {
    it('should handle combination of patterns with negation', () => {
      // Setup content
      fs.writeFileSync(path.join(testDir, 'normal.md'), '---\ntitle: Normal\n---\n# Normal')
      fs.writeFileSync(path.join(testDir, 'hidden.secret.md'), '---\ntitle: Hidden Secret\n---\n# Hidden')
      fs.writeFileSync(path.join(testDir, 'important.secret.md'), '---\ntitle: Important Secret\n---\n# Important')

      // Create ignore with negation
      fs.writeFileSync(path.join(testDir, '.mdumbignore'), '*.secret.md\n!important.secret.md')

      const navigation = buildNavigation(testDir)

      // Normal file visible
      expect(navigation.find(item => item.slug === 'normal')).toBeDefined()

      // hidden.secret.md should be hidden
      expect(navigation.find(item => item.slug === 'hidden.secret')).toBeUndefined()

      // important.secret.md should be visible (negation)
      expect(navigation.find(item => item.slug === 'important.secret')).toBeDefined()
    })

    it('should handle double-star patterns for deep nesting', async () => {
      // Setup nested structure
      fs.mkdirSync(path.join(testDir, 'level1', 'level2', 'level3'), { recursive: true })
      fs.writeFileSync(path.join(testDir, 'root.md'), '---\ntitle: Root\n---\n# Root')
      fs.writeFileSync(path.join(testDir, 'level1', 'l1.md'), '---\ntitle: L1\n---\n# L1')
      fs.writeFileSync(path.join(testDir, 'level1', 'l1.draft.md'), '---\ntitle: L1 Draft\n---\n# Draft')
      fs.writeFileSync(path.join(testDir, 'level1', 'level2', 'l2.md'), '---\ntitle: L2\n---\n# L2')
      fs.writeFileSync(path.join(testDir, 'level1', 'level2', 'l2.draft.md'), '---\ntitle: L2 Draft\n---\n# Draft')
      fs.writeFileSync(path.join(testDir, 'level1', 'level2', 'level3', 'l3.draft.md'), '---\ntitle: L3 Draft\n---\n# Draft')

      // Create ignore with double-star pattern
      fs.writeFileSync(path.join(testDir, '.mdumbignore'), '**/*.draft.md')

      const index = await buildSearchIndex(testDir)

      // Non-draft files should be indexed
      expect(index.find(item => item.title === 'Root')).toBeDefined()
      expect(index.find(item => item.title === 'L1')).toBeDefined()
      expect(index.find(item => item.title === 'L2')).toBeDefined()

      // All draft files at any level should be excluded
      expect(index.find(item => item.title === 'L1 Draft')).toBeUndefined()
      expect(index.find(item => item.title === 'L2 Draft')).toBeUndefined()
      expect(index.find(item => item.title === 'L3 Draft')).toBeUndefined()
    })
  })
})
