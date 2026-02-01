import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildNavigation } from '../../server/utils/navigation'
import fs from 'node:fs'
import path from 'node:path'

describe('Navigation System', () => {
  const testDir = path.join(process.cwd(), 'tests', 'fixtures', 'navigation-test')

  beforeAll(() => {
    // Create test directory structure
    // Root structure:
    // navigation-test/
    //   ├── index.md
    //   ├── getting-started.md
    //   ├── .hidden-file.md (should be skipped)
    //   ├── projects/
    //   │   ├── index.md
    //   │   ├── project-a.md
    //   │   ├── project-b.md
    //   │   └── nested/
    //   │       ├── deep.md
    //   │       └── deeper/
    //   │           └── deepest.md
    //   └── guides/
    //       └── tutorial.md

    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }

    // Create directory structure
    fs.mkdirSync(testDir, { recursive: true })
    fs.mkdirSync(path.join(testDir, 'projects'), { recursive: true })
    fs.mkdirSync(path.join(testDir, 'projects', 'nested'), { recursive: true })
    fs.mkdirSync(path.join(testDir, 'projects', 'nested', 'deeper'), { recursive: true })
    fs.mkdirSync(path.join(testDir, 'guides'), { recursive: true })

    // Create markdown files
    fs.writeFileSync(path.join(testDir, 'index.md'), '---\ntitle: Home\n---\n# Home')
    fs.writeFileSync(path.join(testDir, 'getting-started.md'), '---\ntitle: Getting Started\n---\n# Getting Started')
    fs.writeFileSync(path.join(testDir, '.hidden-file.md'), '# Hidden')
    fs.writeFileSync(path.join(testDir, 'projects', 'index.md'), '---\ntitle: Projects\n---\n# Projects')
    fs.writeFileSync(path.join(testDir, 'projects', 'project-a.md'), '---\ntitle: Project A\n---\n# Project A')
    fs.writeFileSync(path.join(testDir, 'projects', 'project-b.md'), '---\ntitle: Project B\n---\n# Project B')
    fs.writeFileSync(path.join(testDir, 'projects', 'nested', 'deep.md'), '---\ntitle: Deep Page\n---\n# Deep')
    fs.writeFileSync(path.join(testDir, 'projects', 'nested', 'deeper', 'deepest.md'), '---\ntitle: Deepest\n---\n# Deepest')
    fs.writeFileSync(path.join(testDir, 'guides', 'tutorial.md'), '---\ntitle: Tutorial\n---\n# Tutorial')
  })

  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should build navigation tree from directory structure', () => {
    const navigation = buildNavigation(testDir)

    expect(navigation).toBeDefined()
    expect(Array.isArray(navigation)).toBe(true)
    expect(navigation.length).toBeGreaterThan(0)
  })

  it('should identify files correctly', () => {
    const navigation = buildNavigation(testDir)

    // Find a file item (getting-started.md)
    const fileItem = navigation.find(item => item.slug === 'getting-started')

    expect(fileItem).toBeDefined()
    expect(fileItem?.title).toBe('Getting Started')
    expect(fileItem?.slug).toBe('getting-started')
    expect(fileItem?.path).toBe('getting-started.md')
    expect(fileItem?.children).toBeUndefined()
  })

  it('should identify folders correctly with children', () => {
    const navigation = buildNavigation(testDir)

    // Find a folder item (projects/)
    const folderItem = navigation.find(item => item.slug === 'projects')

    expect(folderItem).toBeDefined()
    expect(folderItem?.title).toBe('Projects')
    expect(folderItem?.slug).toBe('projects')
    expect(folderItem?.children).toBeDefined()
    expect(Array.isArray(folderItem?.children)).toBe(true)
    expect(folderItem?.children?.length).toBeGreaterThan(0)
  })

  it('should handle nested folders recursively', () => {
    const navigation = buildNavigation(testDir)

    const projects = navigation.find(item => item.slug === 'projects')
    expect(projects?.children).toBeDefined()

    const nested = projects?.children?.find(item => item.slug === 'projects/nested')
    expect(nested).toBeDefined()
    expect(nested?.children).toBeDefined()

    const deeper = nested?.children?.find(item => item.slug === 'projects/nested/deeper')
    expect(deeper).toBeDefined()
    expect(deeper?.children).toBeDefined()

    const deepest = deeper?.children?.find(item => item.slug === 'projects/nested/deeper/deepest')
    expect(deepest).toBeDefined()
    expect(deepest?.title).toBe('Deepest')
  })

  it('should sort folders before files alphabetically', () => {
    const navigation = buildNavigation(testDir)

    // Check that folders come before files
    const firstFolder = navigation.findIndex(item => item.children !== undefined)
    const lastFile = navigation.findLastIndex(item => item.children === undefined)

    expect(firstFolder).toBeLessThanOrEqual(lastFile)

    // Within projects folder, check sorting
    const projects = navigation.find(item => item.slug === 'projects')
    if (projects?.children) {
      // Should have: nested/ (folder), project-a, project-b (files)
      const folderIndex = projects.children.findIndex(item => item.children !== undefined)
      const fileIndex = projects.children.findIndex(item => item.children === undefined)

      expect(folderIndex).toBeLessThanOrEqual(fileIndex)
    }
  })

  it('should skip hidden files (files starting with .)', () => {
    const navigation = buildNavigation(testDir)

    // Should not find .hidden-file.md
    const hiddenFile = navigation.find(item => item.slug.includes('hidden'))

    expect(hiddenFile).toBeUndefined()
  })

  it('should handle index.md specially', () => {
    const navigation = buildNavigation(testDir)

    // Root index.md should appear as root item
    const homeItem = navigation.find(item => item.slug === 'index')
    expect(homeItem).toBeDefined()
    expect(homeItem?.title).toBe('Home')

    // projects/index.md should be the projects folder item
    const projects = navigation.find(item => item.slug === 'projects')
    expect(projects).toBeDefined()
    expect(projects?.title).toBe('Projects')
    // Index page should represent the folder itself
  })

  it('should extract .md extension from file names', () => {
    const navigation = buildNavigation(testDir)

    const gettingStarted = navigation.find(item => item.slug === 'getting-started')

    expect(gettingStarted?.path).toBe('getting-started.md')
    expect(gettingStarted?.slug).toBe('getting-started')
    // Slug should not have .md extension
    expect(gettingStarted?.slug).not.toContain('.md')
  })

  it('should handle empty directories gracefully', () => {
    const emptyDir = path.join(testDir, 'empty-folder')
    fs.mkdirSync(emptyDir, { recursive: true })

    const navigation = buildNavigation(testDir)

    // Empty folder should not appear in navigation or appear with empty children
    const emptyFolder = navigation.find(item => item.slug === 'empty-folder')
    expect(emptyFolder).toBeUndefined()

    // Clean up
    fs.rmdirSync(emptyDir)
  })

  it('should set order property correctly', () => {
    const navigation = buildNavigation(testDir)

    navigation.forEach(item => {
      expect(item.order).toBeDefined()
      expect(typeof item.order).toBe('number')
      expect(item.order).toBeGreaterThanOrEqual(0)
    })
  })

  it('should handle non-existent directory', () => {
    const nonExistentDir = path.join(testDir, 'does-not-exist')

    expect(() => buildNavigation(nonExistentDir)).toThrow()
  })

  it('should build relative paths correctly', () => {
    const navigation = buildNavigation(testDir)

    const projects = navigation.find(item => item.slug === 'projects')
    const projectA = projects?.children?.find(item => item.slug === 'projects/project-a')

    expect(projectA?.path).toBe('projects/project-a.md')
    expect(projectA?.slug).toBe('projects/project-a')
  })
})
