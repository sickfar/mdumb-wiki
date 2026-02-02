import { describe, test, expect } from 'vitest'
import { isExternalLink, isAnchorLink, resolveLinkPath } from '../../server/utils/links'

describe('isExternalLink', () => {
  test('detects http:// URLs', () => {
    expect(isExternalLink('http://example.com')).toBe(true)
  })

  test('detects https:// URLs', () => {
    expect(isExternalLink('https://example.com')).toBe(true)
  })

  test('detects mailto: links', () => {
    expect(isExternalLink('mailto:test@example.com')).toBe(true)
  })

  test('detects ftp:// URLs', () => {
    expect(isExternalLink('ftp://files.example.com')).toBe(true)
  })

  test('returns false for relative links', () => {
    expect(isExternalLink('./page.md')).toBe(false)
  })

  test('returns false for absolute internal links', () => {
    expect(isExternalLink('/docs/guide')).toBe(false)
  })

  test('returns false for anchor links', () => {
    expect(isExternalLink('#section')).toBe(false)
  })
})

describe('isAnchorLink', () => {
  test('detects anchor-only links', () => {
    expect(isAnchorLink('#section')).toBe(true)
  })

  test('detects anchor at start', () => {
    expect(isAnchorLink('#introduction')).toBe(true)
  })

  test('returns false for regular links', () => {
    expect(isAnchorLink('./page.md')).toBe(false)
  })

  test('returns false for external links', () => {
    expect(isAnchorLink('https://example.com')).toBe(false)
  })
})

describe('resolveLinkPath', () => {
  test('resolves relative link from same directory', () => {
    const result = resolveLinkPath('./page.md', 'projects/guide.md')
    expect(result).toBe('/projects/page')
  })

  test('resolves parent directory link', () => {
    const result = resolveLinkPath('../README.md', 'projects/docs/api.md')
    expect(result).toBe('/projects/README')
  })

  test('resolves absolute link', () => {
    const result = resolveLinkPath('/docs/guide.md', 'whatever/path.md')
    expect(result).toBe('/docs/guide')
  })

  test('preserves external links unchanged', () => {
    const result = resolveLinkPath('https://example.com', 'guide.md')
    expect(result).toBe('https://example.com')
  })

  test('preserves anchor links unchanged', () => {
    const result = resolveLinkPath('#section', 'guide.md')
    expect(result).toBe('#section')
  })

  test('removes .md extension', () => {
    const result = resolveLinkPath('./installation.md', 'guide.md')
    expect(result).toBe('/installation')
  })

  test('handles index.md by using parent directory', () => {
    const result = resolveLinkPath('./index.md', 'guide.md')
    expect(result).toBe('/')
  })

  test('handles links with anchors', () => {
    const result = resolveLinkPath('./api.md#methods', 'guide.md')
    expect(result).toBe('/api#methods')
  })

  test('handles nested paths', () => {
    const result = resolveLinkPath('./subdir/page.md', 'docs/guide.md')
    expect(result).toBe('/docs/subdir/page')
  })

  test('handles going up multiple levels', () => {
    const result = resolveLinkPath('../../top.md', 'docs/deep/nested/file.md')
    expect(result).toBe('/docs/top')
  })

  test('handles root index.md', () => {
    const result = resolveLinkPath('/index.md', 'anywhere.md')
    expect(result).toBe('/')
  })

  test('handles nested index.md', () => {
    const result = resolveLinkPath('/docs/index.md', 'guide.md')
    expect(result).toBe('/docs')
  })

  test('preserves external links with anchors', () => {
    const result = resolveLinkPath('https://example.com#section', 'guide.md')
    expect(result).toBe('https://example.com#section')
  })

  test('handles links without extension', () => {
    const result = resolveLinkPath('./page', 'guide.md')
    expect(result).toBe('/page')
  })

  test('normalizes multiple slashes', () => {
    const result = resolveLinkPath('./path//to///page.md', 'guide.md')
    expect(result).toBe('/path/to/page')
  })
})
