import { describe, it, expect, beforeEach } from 'vitest'
import { parseMarkdown, getMarkdownParser } from '../../server/utils/markdown'
import { clearCache } from '../../server/utils/markdown-cache'

describe('Markdown Parser', () => {
  beforeEach(async () => {
    // Clear markdown cache before each test
    clearCache()
    // Ensure parser is initialized before each test
    await getMarkdownParser()
  })

  describe('Basic Markdown Parsing', () => {
    it('should parse headings correctly', async () => {
      const markdown = '# Main Heading\n\n## Sub Heading\n\nContent here.'
      const result = await parseMarkdown(markdown, '/test.md')

      expect(result.html).toContain('<h1>Main Heading</h1>')
      expect(result.html).toContain('<h2>Sub Heading</h2>')
      expect(result.html).toContain('<p>Content here.</p>')
    })

    it('should parse paragraphs correctly', async () => {
      const markdown = 'First paragraph.\n\nSecond paragraph.'
      const result = await parseMarkdown(markdown, '/test.md')

      expect(result.html).toContain('<p>First paragraph.</p>')
      expect(result.html).toContain('<p>Second paragraph.</p>')
    })

    it('should parse bold and italic text', async () => {
      const markdown = '**bold text** and *italic text*'
      const result = await parseMarkdown(markdown, '/test.md')

      expect(result.html).toContain('<strong>bold text</strong>')
      expect(result.html).toContain('<em>italic text</em>')
    })

    it('should parse links correctly', async () => {
      const markdown = '[Link text](https://example.com)'
      const result = await parseMarkdown(markdown, '/test.md')

      expect(result.html).toContain('<a href="https://example.com">Link text</a>')
    })
  })

  describe('Lists Rendering', () => {
    it('should parse unordered lists correctly', async () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3'
      const result = await parseMarkdown(markdown, '/test.md')

      expect(result.html).toContain('<ul>')
      expect(result.html).toContain('<li>Item 1</li>')
      expect(result.html).toContain('<li>Item 2</li>')
      expect(result.html).toContain('<li>Item 3</li>')
      expect(result.html).toContain('</ul>')
    })

    it('should parse ordered lists correctly', async () => {
      const markdown = '1. First item\n2. Second item\n3. Third item'
      const result = await parseMarkdown(markdown, '/test.md')

      expect(result.html).toContain('<ol>')
      expect(result.html).toContain('<li>First item</li>')
      expect(result.html).toContain('<li>Second item</li>')
      expect(result.html).toContain('<li>Third item</li>')
      expect(result.html).toContain('</ol>')
    })

    it('should parse nested lists correctly', async () => {
      const markdown = '- Parent 1\n  - Child 1\n  - Child 2\n- Parent 2'
      const result = await parseMarkdown(markdown, '/test.md')

      expect(result.html).toContain('<ul>')
      expect(result.html).toContain('<li>Parent 1')
      expect(result.html).toContain('<li>Child 1</li>')
      expect(result.html).toContain('<li>Child 2</li>')
      expect(result.html).toContain('<li>Parent 2</li>')
    })
  })

  describe('Code Blocks Rendering', () => {
    it('should render code blocks with syntax highlighting', async () => {
      const markdown = '```javascript\nconst hello = "world";\nconsole.log(hello);\n```'
      const result = await parseMarkdown(markdown, '/test.md')

      // Check for code block structure
      expect(result.html).toContain('<pre')
      expect(result.html).toContain('<code')
      expect(result.html).toContain('hello')
      expect(result.html).toContain('world')
    })

    it('should render TypeScript code blocks', async () => {
      const markdown = '```typescript\ninterface User {\n  name: string;\n  age: number;\n}\n```'
      const result = await parseMarkdown(markdown, '/test.md')

      expect(result.html).toContain('<pre')
      expect(result.html).toContain('<code')
      expect(result.html).toContain('interface')
      expect(result.html).toContain('User')
    })

    it('should render Python code blocks', async () => {
      const markdown = '```python\ndef hello():\n    print("Hello, World!")\n```'
      const result = await parseMarkdown(markdown, '/test.md')

      expect(result.html).toContain('<pre')
      expect(result.html).toContain('<code')
      expect(result.html).toContain('hello')
    })

    it('should render inline code', async () => {
      const markdown = 'Use the `console.log()` function.'
      const result = await parseMarkdown(markdown, '/test.md')

      expect(result.html).toContain('<code>console.log()</code>')
    })

    it('should render code blocks without language specification', async () => {
      const markdown = '```\nplain text code\n```'
      const result = await parseMarkdown(markdown, '/test.md')

      expect(result.html).toContain('<pre')
      expect(result.html).toContain('<code')
      expect(result.html).toContain('plain text code')
    })
  })

  describe('Front Matter Parsing', () => {
    it('should parse front matter with title, tags, and author', async () => {
      const markdown = `---
title: Test Page
tags:
  - testing
  - markdown
author: John Doe
---

# Content Heading

Page content here.`

      const result = await parseMarkdown(markdown, '/test.md')

      expect(result.title).toBe('Test Page')
      expect(result.frontmatter.title).toBe('Test Page')
      expect(result.frontmatter.author).toBe('John Doe')
      expect(result.frontmatter.tags).toEqual(['testing', 'markdown'])
      expect(result.html).toContain('<h1>Content Heading</h1>')
      expect(result.html).toContain('<p>Page content here.</p>')
    })

    it('should parse front matter with description', async () => {
      const markdown = `---
title: API Documentation
description: Complete API reference for MDumb Wiki
---

# API Docs`

      const result = await parseMarkdown(markdown, '/test.md')

      expect(result.title).toBe('API Documentation')
      expect(result.description).toBe('Complete API reference for MDumb Wiki')
      expect(result.frontmatter.description).toBe('Complete API reference for MDumb Wiki')
    })

    it('should parse front matter with date', async () => {
      const markdown = `---
title: Blog Post
date: 2025-01-15
---

Content`

      const result = await parseMarkdown(markdown, '/test.md')

      // gray-matter may parse dates as Date objects or strings
      expect(result.frontmatter.date).toBeDefined()
      // Accept both string and Date object
      if (typeof result.frontmatter.date === 'string') {
        expect(result.frontmatter.date).toBe('2025-01-15')
      } else {
        expect(result.frontmatter.date).toBeInstanceOf(Date)
      }
    })

    it('should handle empty front matter', async () => {
      const markdown = `---
---

# Content`

      const result = await parseMarkdown(markdown, '/test.md')

      expect(result.frontmatter).toBeDefined()
      expect(result.title).toBe('Untitled')
      expect(result.html).toContain('<h1>Content</h1>')
    })
  })

  describe('Markdown Without Front Matter', () => {
    it('should handle markdown without front matter', async () => {
      const markdown = '# Just Markdown\n\nNo front matter here.'
      const result = await parseMarkdown(markdown, '/test.md')

      expect(result.title).toBe('Untitled')
      expect(result.frontmatter).toEqual({})
      expect(result.html).toContain('<h1>Just Markdown</h1>')
      expect(result.html).toContain('<p>No front matter here.</p>')
    })

    it('should use default title when no front matter title exists', async () => {
      const markdown = 'Simple content without title.'
      const result = await parseMarkdown(markdown, '/test.md')

      expect(result.title).toBe('Untitled')
      expect(result.html).toContain('<p>Simple content without title.</p>')
    })
  })

  describe('WikiPage Structure', () => {
    it('should return complete WikiPage object', async () => {
      const markdown = `---
title: Complete Page
description: A complete test page
author: Test Author
tags:
  - test
---

# Heading

Content here.`

      const result = await parseMarkdown(markdown, '/complete-page.md')

      // Verify WikiPage structure
      expect(result).toHaveProperty('path')
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('content')
      expect(result).toHaveProperty('html')
      expect(result).toHaveProperty('frontmatter')

      expect(result.path).toBe('/complete-page.md')
      expect(result.title).toBe('Complete Page')
      expect(result.content).toContain('# Heading')
      expect(result.html).toContain('<h1>Heading</h1>')
      expect(result.frontmatter.author).toBe('Test Author')
    })

    it('should preserve raw markdown content', async () => {
      const markdown = '# Test\n\nContent with **bold**.'
      const result = await parseMarkdown(markdown, '/test.md')

      expect(result.content).toBe(markdown)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty markdown', async () => {
      const markdown = ''
      const result = await parseMarkdown(markdown, '/empty.md')

      expect(result.title).toBe('Untitled')
      expect(result.content).toBe('')
      expect(result.html).toBe('')
      expect(result.frontmatter).toEqual({})
    })

    it('should handle markdown with only whitespace', async () => {
      const markdown = '   \n\n   \n'
      const result = await parseMarkdown(markdown, '/whitespace.md')

      expect(result.title).toBe('Untitled')
      expect(result.content).toBe(markdown)
    })

    it('should handle special characters in front matter', async () => {
      const markdown = `---
title: "Title with: special & characters"
description: 'Single quotes & symbols'
---

Content`

      const result = await parseMarkdown(markdown, '/special.md')

      expect(result.title).toBe('Title with: special & characters')
      expect(result.description).toBe('Single quotes & symbols')
    })

    it('should handle malformed front matter gracefully', async () => {
      const markdown = `---
title: Test
invalid yaml: [unclosed bracket
---

Content`

      // Should not throw, should handle gracefully
      const result = await parseMarkdown(markdown, '/malformed.md')
      expect(result).toBeDefined()
      expect(result.html).toBeDefined()
    })
  })

  describe('Parser Initialization', () => {
    it('should initialize parser singleton', async () => {
      const parser1 = await getMarkdownParser()
      const parser2 = await getMarkdownParser()

      // Should return the same instance
      expect(parser1).toBe(parser2)
    })

    it('should handle multiple concurrent initialization calls', async () => {
      // Reset any existing parser (if there's a way to do so)
      const promises = [
        getMarkdownParser(),
        getMarkdownParser(),
        getMarkdownParser()
      ]

      const parsers = await Promise.all(promises)

      // All should resolve successfully
      expect(parsers[0]).toBeDefined()
      expect(parsers[1]).toBeDefined()
      expect(parsers[2]).toBeDefined()
    })
  })

  describe('Link Resolution', () => {
    it('should convert relative markdown links to routes', async () => {
      const markdown = '[Installation](./installation.md)'
      const result = await parseMarkdown(markdown, 'guide.md')

      expect(result.html).toContain('href="/installation"')
    })

    it('should convert parent directory links', async () => {
      const markdown = '[Back](../index.md)'
      const result = await parseMarkdown(markdown, 'docs/guide.md')

      expect(result.html).toContain('href="/"')
    })

    it('should preserve external links', async () => {
      const markdown = '[Example](https://example.com)'
      const result = await parseMarkdown(markdown, 'guide.md')

      expect(result.html).toContain('href="https://example.com"')
    })

    it('should preserve anchor links', async () => {
      const markdown = '[Section](#introduction)'
      const result = await parseMarkdown(markdown, 'guide.md')

      expect(result.html).toContain('href="#introduction"')
    })

    it('should handle links with anchors', async () => {
      const markdown = '[API Methods](./api.md#methods)'
      const result = await parseMarkdown(markdown, 'guide.md')

      expect(result.html).toContain('href="/api#methods"')
    })
  })
})
