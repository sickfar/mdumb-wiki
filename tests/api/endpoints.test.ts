import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { NavigationItem, WikiPage, HealthStatus } from '../../types/wiki'

describe('API Endpoints', async () => {
  await setup({
    server: true,
    browser: false,
    env: {
      WIKI_PATH: './wiki'
    }
  })

  describe('Health Endpoint', () => {
    it('should return health status', async () => {
      const health = await $fetch<HealthStatus>('/api/health')

      expect(health).toBeDefined()
      expect(health.status).toBe('healthy')
      expect(health.uptime).toBeGreaterThan(0)
      expect(health.timestamp).toBeDefined()
    })
  })

  describe('Navigation Endpoint', () => {
    it('should return navigation tree', async () => {
      const navigation = await $fetch<NavigationItem[]>('/api/navigation')

      expect(navigation).toBeDefined()
      expect(Array.isArray(navigation)).toBe(true)
      expect(navigation.length).toBeGreaterThan(0)

      // Check structure of first item
      const firstItem = navigation[0]
      expect(firstItem).toHaveProperty('title')
      expect(firstItem).toHaveProperty('slug')
      expect(firstItem).toHaveProperty('order')
      expect(firstItem).toHaveProperty('path')
    })

    it('should include guides section', async () => {
      const navigation = await $fetch<NavigationItem[]>('/api/navigation')

      const guidesSection = navigation.find(item => item.title === 'Guides')
      expect(guidesSection).toBeDefined()
      expect(guidesSection?.children).toBeDefined()
      expect(guidesSection?.children?.length).toBeGreaterThan(0)
    })
  })

  describe('Content Endpoint', () => {
    it('should return index page', async () => {
      const page = await $fetch<WikiPage>('/api/content/index')

      expect(page).toBeDefined()
      expect(page.title).toBe('Welcome to MDumb Wiki')
      expect(page.html).toBeDefined()
      expect(page.html.length).toBeGreaterThan(0)
      expect(page.content).toBeDefined()
      expect(page.frontmatter).toBeDefined()
    })

    it('should return guide page', async () => {
      const page = await $fetch<WikiPage>('/api/content/guides/installation')

      expect(page).toBeDefined()
      expect(page.title).toBe('Installation Guide')
      expect(page.description).toBe('How to install and configure MDumb Wiki')
      expect(page.html).toContain('<h1>Installation Guide</h1>')
    })

    it('should return 404 for non-existent page', async () => {
      try {
        await $fetch('/api/content/does-not-exist')
        expect.fail('Should have thrown 404 error')
      } catch (error: any) {
        expect(error.statusCode).toBe(404)
      }
    })

    it('should handle folder index pages', async () => {
      const page = await $fetch<WikiPage>('/api/content/guides')

      expect(page).toBeDefined()
      expect(page.title).toBe('Guides')
    })

    it('should include syntax highlighted code blocks', async () => {
      const page = await $fetch<WikiPage>('/api/content/guides/installation')

      // Should have Shiki-highlighted code blocks
      expect(page.html).toContain('<pre')
      expect(page.html).toContain('bash')
    })
  })
})
