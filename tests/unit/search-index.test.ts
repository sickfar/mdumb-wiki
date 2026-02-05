import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { buildSearchIndex } from '../../server/utils/search-index'
import { clearIgnoreCache } from '../../server/utils/ignore'

describe('Search Index Builder', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(process.cwd(), 'tests', 'fixtures', 'search-test-' + Date.now())
    await fs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  it('should build search index from markdown files', async () => {
    // Create test files
    await fs.writeFile(
      join(testDir, 'page1.md'),
      `---
title: First Page
tags: [guide, tutorial]
---
# First Page
This is the first page content.`
    )

    await fs.writeFile(
      join(testDir, 'page2.md'),
      `---
title: Second Page
tags: [reference]
---
# Second Page
This is the second page content.`
    )

    const index = await buildSearchIndex(testDir)

    expect(index).toHaveLength(2)

    const firstPage = index.find(item => item.title === 'First Page')
    const secondPage = index.find(item => item.title === 'Second Page')

    expect(firstPage).toBeDefined()
    expect(firstPage!.tags).toEqual(['guide', 'tutorial'])
    expect(firstPage!.excerpt).toContain('First Page')

    expect(secondPage).toBeDefined()
    expect(secondPage!.tags).toEqual(['reference'])
  })

  it('should extract content preview', async () => {
    const longContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10)

    await fs.writeFile(
      join(testDir, 'long.md'),
      `---
title: Long Page
---
${longContent}`
    )

    const index = await buildSearchIndex(testDir)

    expect(index[0].excerpt).toBeDefined()
    expect(index[0].excerpt.length).toBeLessThanOrEqual(220) // ~200 chars + some buffer
  })

  it('should handle missing front-matter', async () => {
    await fs.writeFile(
      join(testDir, 'no-frontmatter.md'),
      '# No Front Matter\nJust content here.'
    )

    const index = await buildSearchIndex(testDir)

    expect(index).toHaveLength(1)
    expect(index[0].title).toBe('no-frontmatter') // Falls back to filename
    expect(index[0].tags).toEqual([])
    expect(index[0].excerpt).toContain('No Front Matter')
  })

  it('should flatten nested navigation structure', async () => {
    // Create nested directory
    const subDir = join(testDir, 'guides')
    await fs.mkdir(subDir, { recursive: true })

    await fs.writeFile(
      join(subDir, 'installation.md'),
      `---
title: Installation Guide
---
How to install.`
    )

    await fs.writeFile(
      join(testDir, 'index.md'),
      `---
title: Home
---
Welcome!`
    )

    const index = await buildSearchIndex(testDir)

    expect(index.length).toBeGreaterThanOrEqual(2)
    const installGuide = index.find(item => item.title === 'Installation Guide')
    expect(installGuide).toBeDefined()
    expect(installGuide!.path).toContain('guides')
  })

  it('should ignore hidden files', async () => {
    await fs.writeFile(
      join(testDir, '.hidden.md'),
      '---\ntitle: Hidden\n---\nSecret content'
    )

    await fs.writeFile(
      join(testDir, 'visible.md'),
      '---\ntitle: Visible\n---\nPublic content'
    )

    const index = await buildSearchIndex(testDir)

    expect(index).toHaveLength(1)
    expect(index[0].title).toBe('Visible')
  })

  it('should return empty array for empty directory', async () => {
    const index = await buildSearchIndex(testDir)

    expect(index).toEqual([])
  })
})

describe('Search Index with .mdumbignore', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(process.cwd(), 'tests', 'fixtures', 'search-ignore-test-' + Date.now())
    await fs.mkdir(testDir, { recursive: true })
    clearIgnoreCache()
  })

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
    clearIgnoreCache()
  })

  it('should exclude ignored files from search index', async () => {
    // Create .mdumbignore
    await fs.writeFile(join(testDir, '.mdumbignore'), '*.secret.md')

    // Create files
    await fs.writeFile(
      join(testDir, 'public.md'),
      '---\ntitle: Public Page\n---\nPublic content'
    )
    await fs.writeFile(
      join(testDir, 'hidden.secret.md'),
      '---\ntitle: Hidden Secret\n---\nSecret content'
    )

    const index = await buildSearchIndex(testDir)

    expect(index).toHaveLength(1)
    expect(index[0].title).toBe('Public Page')
    expect(index.find(item => item.title === 'Hidden Secret')).toBeUndefined()
  })

  it('should exclude ignored folders (all contents) from search index', async () => {
    // Create .mdumbignore
    await fs.writeFile(join(testDir, '.mdumbignore'), 'drafts/')

    // Create drafts folder with files
    await fs.mkdir(join(testDir, 'drafts'), { recursive: true })
    await fs.writeFile(
      join(testDir, 'drafts', 'draft1.md'),
      '---\ntitle: Draft 1\n---\nDraft content'
    )
    await fs.writeFile(
      join(testDir, 'drafts', 'draft2.md'),
      '---\ntitle: Draft 2\n---\nMore draft content'
    )

    // Create public file
    await fs.writeFile(
      join(testDir, 'public.md'),
      '---\ntitle: Public\n---\nPublic content'
    )

    const index = await buildSearchIndex(testDir)

    expect(index).toHaveLength(1)
    expect(index[0].title).toBe('Public')
  })

  it('should include non-ignored files in search index', async () => {
    // Create .mdumbignore with specific pattern
    await fs.writeFile(join(testDir, '.mdumbignore'), 'secret.md')

    await fs.writeFile(
      join(testDir, 'page1.md'),
      '---\ntitle: Page 1\n---\nContent 1'
    )
    await fs.writeFile(
      join(testDir, 'page2.md'),
      '---\ntitle: Page 2\n---\nContent 2'
    )
    await fs.writeFile(
      join(testDir, 'secret.md'),
      '---\ntitle: Secret\n---\nSecret content'
    )

    const index = await buildSearchIndex(testDir)

    expect(index).toHaveLength(2)
    expect(index.find(item => item.title === 'Page 1')).toBeDefined()
    expect(index.find(item => item.title === 'Page 2')).toBeDefined()
    expect(index.find(item => item.title === 'Secret')).toBeUndefined()
  })

  it('should support negation patterns (unignored files indexed)', async () => {
    // Create .mdumbignore with negation
    await fs.writeFile(join(testDir, '.mdumbignore'), '*.secret.md\n!important.secret.md')

    await fs.writeFile(
      join(testDir, 'hidden.secret.md'),
      '---\ntitle: Hidden Secret\n---\nHidden'
    )
    await fs.writeFile(
      join(testDir, 'important.secret.md'),
      '---\ntitle: Important Secret\n---\nImportant'
    )
    await fs.writeFile(
      join(testDir, 'normal.md'),
      '---\ntitle: Normal\n---\nNormal content'
    )

    const index = await buildSearchIndex(testDir)

    expect(index).toHaveLength(2)
    expect(index.find(item => item.title === 'Normal')).toBeDefined()
    expect(index.find(item => item.title === 'Important Secret')).toBeDefined()
    expect(index.find(item => item.title === 'Hidden Secret')).toBeUndefined()
  })

  it('should filter with glob patterns correctly', async () => {
    // Create .mdumbignore with glob
    await fs.writeFile(join(testDir, '.mdumbignore'), '**/*.draft.md')

    // Create nested structure
    await fs.mkdir(join(testDir, 'posts'), { recursive: true })
    await fs.writeFile(
      join(testDir, 'published.md'),
      '---\ntitle: Published\n---\nPublished'
    )
    await fs.writeFile(
      join(testDir, 'wip.draft.md'),
      '---\ntitle: WIP Draft\n---\nDraft'
    )
    await fs.writeFile(
      join(testDir, 'posts', 'post.draft.md'),
      '---\ntitle: Post Draft\n---\nDraft'
    )
    await fs.writeFile(
      join(testDir, 'posts', 'final.md'),
      '---\ntitle: Final Post\n---\nFinal'
    )

    const index = await buildSearchIndex(testDir)

    expect(index).toHaveLength(2)
    expect(index.find(item => item.title === 'Published')).toBeDefined()
    expect(index.find(item => item.title === 'Final Post')).toBeDefined()
    expect(index.find(item => item.title === 'WIP Draft')).toBeUndefined()
    expect(index.find(item => item.title === 'Post Draft')).toBeUndefined()
  })

  it('should work when no .mdumbignore file exists', async () => {
    // No ignore file, all files should be indexed
    await fs.writeFile(
      join(testDir, 'page1.md'),
      '---\ntitle: Page 1\n---\nContent'
    )
    await fs.writeFile(
      join(testDir, 'secret.md'),
      '---\ntitle: Secret\n---\nSecret'
    )

    const index = await buildSearchIndex(testDir)

    expect(index).toHaveLength(2)
    expect(index.find(item => item.title === 'Page 1')).toBeDefined()
    expect(index.find(item => item.title === 'Secret')).toBeDefined()
  })
})
