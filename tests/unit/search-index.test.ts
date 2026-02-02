import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { buildSearchIndex } from '../../server/utils/search-index'

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
