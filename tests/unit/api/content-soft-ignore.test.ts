import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { buildNavigation } from '../../../server/utils/navigation'
import { buildSearchIndex } from '../../../server/utils/search-index'
import { readWikiFile } from '../../../server/utils/file-operations'
import { clearIgnoreCache } from '../../../server/utils/ignore'

/**
 * Tests for "soft ignore" behavior:
 * - Ignored files are hidden from navigation and search
 * - BUT they remain accessible via direct URL (readWikiFile)
 *
 * This allows for draft content or private notes that can be
 * linked from other pages but don't clutter the navigation.
 */
describe('Content API soft ignore behavior', () => {
  const testDir = path.join(process.cwd(), 'tests', 'fixtures', 'soft-ignore-test')

  beforeEach(() => {
    // Clean up any existing test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }

    // Create test directory structure
    // soft-ignore-test/
    // ├── .mdumbignore          # "drafts/\n*.secret.md"
    // ├── index.md
    // ├── public.md
    // ├── hidden.secret.md      # ignored in nav/search
    // └── drafts/               # ignored folder
    //     ├── draft1.md
    //     └── nested/
    //         └── deep-draft.md

    fs.mkdirSync(testDir, { recursive: true })
    fs.mkdirSync(path.join(testDir, 'drafts'), { recursive: true })
    fs.mkdirSync(path.join(testDir, 'drafts', 'nested'), { recursive: true })

    // Create .mdumbignore
    fs.writeFileSync(
      path.join(testDir, '.mdumbignore'),
      'drafts/\n*.secret.md'
    )

    // Create markdown files
    fs.writeFileSync(
      path.join(testDir, 'index.md'),
      '---\ntitle: Home\n---\n# Home'
    )
    fs.writeFileSync(
      path.join(testDir, 'public.md'),
      '---\ntitle: Public Page\n---\n# Public'
    )
    fs.writeFileSync(
      path.join(testDir, 'hidden.secret.md'),
      '---\ntitle: Hidden Secret\n---\n# This is a secret page'
    )
    fs.writeFileSync(
      path.join(testDir, 'drafts', 'draft1.md'),
      '---\ntitle: Draft 1\n---\n# Draft content'
    )
    fs.writeFileSync(
      path.join(testDir, 'drafts', 'nested', 'deep-draft.md'),
      '---\ntitle: Deep Draft\n---\n# Deep nested draft'
    )

    clearIgnoreCache()
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    clearIgnoreCache()
  })

  describe('Navigation hides ignored files', () => {
    it('should NOT show ignored files in navigation', () => {
      const navigation = buildNavigation(testDir)

      // hidden.secret.md should not appear
      const secretFile = navigation.find(item => item.slug === 'hidden.secret')
      expect(secretFile).toBeUndefined()

      // drafts folder should not appear
      const draftsFolder = navigation.find(item => item.slug === 'drafts')
      expect(draftsFolder).toBeUndefined()

      // public.md should appear
      const publicFile = navigation.find(item => item.slug === 'public')
      expect(publicFile).toBeDefined()
    })
  })

  describe('Search hides ignored files', () => {
    it('should NOT include ignored files in search index', async () => {
      const index = await buildSearchIndex(testDir)

      // hidden.secret.md should not be indexed
      const secretResult = index.find(item => item.title === 'Hidden Secret')
      expect(secretResult).toBeUndefined()

      // drafts/draft1.md should not be indexed
      const draftResult = index.find(item => item.title === 'Draft 1')
      expect(draftResult).toBeUndefined()

      // public.md should be indexed
      const publicResult = index.find(item => item.title === 'Public Page')
      expect(publicResult).toBeDefined()
    })
  })

  describe('Direct URL access works for ignored files (soft ignore)', () => {
    it('should allow direct access to ignored files via readWikiFile', () => {
      // This simulates what the content API does - it just reads the file
      // It does NOT check the ignore list
      const result = readWikiFile('hidden.secret.md', testDir)

      expect(result.exists).toBe(true)
      expect(result.content).toContain('# This is a secret page')
    })

    it('should allow direct access to files in ignored folders', () => {
      const result = readWikiFile('drafts/draft1.md', testDir)

      expect(result.exists).toBe(true)
      expect(result.content).toContain('# Draft content')
    })

    it('should allow direct access to deeply nested files in ignored folders', () => {
      const result = readWikiFile('drafts/nested/deep-draft.md', testDir)

      expect(result.exists).toBe(true)
      expect(result.content).toContain('# Deep nested draft')
    })
  })

  describe('Links from other pages work', () => {
    it('verifies soft ignore allows linking to hidden content', () => {
      // Create a page that links to the hidden content
      fs.writeFileSync(
        path.join(testDir, 'linker.md'),
        '---\ntitle: Linker\n---\n# Links\n\nCheck out my [secret page](hidden.secret.md)\n\nAlso see [draft](drafts/draft1.md)'
      )

      // The linker page is visible in navigation
      const navigation = buildNavigation(testDir)
      const linkerPage = navigation.find(item => item.slug === 'linker')
      expect(linkerPage).toBeDefined()

      // The secret pages are NOT visible in navigation
      const secretFile = navigation.find(item => item.slug === 'hidden.secret')
      expect(secretFile).toBeUndefined()
      const draftsFolder = navigation.find(item => item.slug === 'drafts')
      expect(draftsFolder).toBeUndefined()

      // BUT they can still be accessed via direct URL (readWikiFile)
      // This is what happens when a user clicks the link
      const secretResult = readWikiFile('hidden.secret.md', testDir)
      expect(secretResult.exists).toBe(true)

      const draftResult = readWikiFile('drafts/draft1.md', testDir)
      expect(draftResult.exists).toBe(true)
    })
  })
})
