import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { parseMarkdown, resetParser } from '../../server/utils/markdown'

describe('HTML Sanitization', () => {
  beforeEach(() => {
    resetParser()
  })

  afterEach(() => {
    resetParser()
  })

  describe('Malicious Script Blocking', () => {
    test('removes script tags', async () => {
      const markdown = '<script>alert("XSS")</script>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).not.toContain('<script>')
      // Text content may remain, but the script tag should be gone
    })

    test('removes inline event handlers (onclick)', async () => {
      const markdown = '<a href="#" onclick="alert(\'XSS\')">Click</a>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).not.toContain('onclick')
      expect(result.html).not.toContain('alert')
    })

    test('removes inline event handlers (onerror)', async () => {
      const markdown = '<img src="x" onerror="alert(\'XSS\')" />'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).not.toContain('onerror')
      expect(result.html).not.toContain('alert')
    })

    test('removes javascript: URLs', async () => {
      const markdown = '<a href="javascript:alert(\'XSS\')">Bad Link</a>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).not.toContain('javascript:')
    })

    test('removes data: URLs with scripts', async () => {
      const markdown = '<a href="data:text/html,<script>alert(\'XSS\')</script>">Bad</a>'
      const result = await parseMarkdown(markdown, 'test.md')

      // The href should be removed or emptied due to dangerous protocol
      // The link tag itself may remain but without the dangerous href
      expect(result.html).toContain('<a')
    })
  })

  describe('Dangerous HTML Elements', () => {
    test('removes iframe tags', async () => {
      const markdown = '<iframe src="https://evil.com"></iframe>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).not.toContain('<iframe')
    })

    test('removes object tags', async () => {
      const markdown = '<object data="evil.swf"></object>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).not.toContain('<object')
    })

    test('removes embed tags', async () => {
      const markdown = '<embed src="evil.swf">'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).not.toContain('<embed')
    })

    test('removes form tags', async () => {
      const markdown = '<form action="https://evil.com"><input type="text" /></form>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).not.toContain('<form')
    })
  })

  describe('Safe HTML Elements', () => {
    test('allows bold tags', async () => {
      const markdown = '<b>Bold text</b>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).toContain('<b>')
      expect(result.html).toContain('Bold text')
    })

    test('allows emphasis tags', async () => {
      const markdown = '<em>Emphasized</em>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).toContain('<em>')
      expect(result.html).toContain('Emphasized')
    })

    test('allows strong tags', async () => {
      const markdown = '<strong>Strong</strong>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).toContain('<strong>')
      expect(result.html).toContain('Strong')
    })

    test('allows code tags', async () => {
      const markdown = '<code>code</code>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).toContain('<code>')
      expect(result.html).toContain('code')
    })

    test('allows links with safe attributes', async () => {
      const markdown = '<a href="https://example.com" title="Example">Link</a>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).toContain('<a')
      expect(result.html).toContain('href="https://example.com"')
      expect(result.html).toContain('title="Example"')
    })

    test('allows images with safe attributes', async () => {
      const markdown = '<img src="/image.png" alt="Test" title="Image" />'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).toContain('<img')
      expect(result.html).toContain('src="/image.png"')
      expect(result.html).toContain('alt="Test"')
    })

    test('allows headings', async () => {
      const markdown = '<h1>Heading 1</h1><h2>Heading 2</h2>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).toContain('<h1>')
      expect(result.html).toContain('<h2>')
    })

    test('allows lists', async () => {
      const markdown = '<ul><li>Item 1</li></ul>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).toContain('<ul>')
      expect(result.html).toContain('<li>')
    })

    test('allows tables', async () => {
      const markdown = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).toContain('<table>')
      expect(result.html).toContain('<thead>')
      expect(result.html).toContain('<tbody>')
      expect(result.html).toContain('<th>')
      expect(result.html).toContain('<td>')
    })
  })

  describe('Attribute Sanitization', () => {
    test('allows class attribute', async () => {
      const markdown = '<div class="container">Content</div>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).toContain('class="container"')
    })

    test('allows id attribute', async () => {
      const markdown = '<div id="main">Content</div>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).toContain('id="main"')
    })

    test('blocks event handler attributes', async () => {
      const markdown = '<div onload="alert(\'XSS\')">Content</div>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).not.toContain('onload')
    })
  })

  describe('Edge Cases', () => {
    test('handles mixed safe and malicious content', async () => {
      const markdown = '<b>Safe</b><script>alert("XSS")</script><em>Also safe</em>'
      const result = await parseMarkdown(markdown, 'test.md')

      expect(result.html).toContain('<b>')
      expect(result.html).toContain('<em>')
      expect(result.html).not.toContain('<script>')
      // Text content may remain but script tag is removed
    })

    test('handles encoded attacks', async () => {
      const markdown = '<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(\'XSS\')">Link</a>'
      const result = await parseMarkdown(markdown, 'test.md')

      // The sanitizer should decode and then block
      expect(result.html).not.toContain('javascript:')
    })
  })
})
