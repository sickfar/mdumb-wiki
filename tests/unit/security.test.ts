import { describe, it, expect, beforeEach } from 'vitest'
import { validatePath } from '../../server/utils/security'
import path from 'node:path'

describe('Security - Path Validation', () => {
  const testWikiPath = '/Users/test/wiki'

  describe('validatePath', () => {
    it('should prevent path traversal with ../', () => {
      expect(() => {
        validatePath('../etc/passwd', testWikiPath)
      }).toThrow('Access denied')
    })

    it('should prevent path traversal with ..\\', () => {
      expect(() => {
        validatePath('..\\windows\\system32', testWikiPath)
      }).toThrow('Access denied')
    })

    it('should prevent nested path traversal attempts', () => {
      expect(() => {
        validatePath('docs/../../etc/passwd', testWikiPath)
      }).toThrow('Access denied')
    })

    it('should prevent absolute paths outside wikiPath', () => {
      expect(() => {
        validatePath('/etc/passwd', testWikiPath)
      }).toThrow('Access denied')
    })

    it('should allow valid relative paths', () => {
      const result = validatePath('projects/readme.md', testWikiPath)
      expect(result).toBe(path.join(testWikiPath, 'projects/readme.md'))
    })

    it('should allow paths without directories', () => {
      const result = validatePath('index.md', testWikiPath)
      expect(result).toBe(path.join(testWikiPath, 'index.md'))
    })

    it('should allow nested valid paths', () => {
      const result = validatePath('docs/api/endpoints.md', testWikiPath)
      expect(result).toBe(path.join(testWikiPath, 'docs/api/endpoints.md'))
    })

    it('should normalize paths with multiple slashes', () => {
      const result = validatePath('docs//api///endpoints.md', testWikiPath)
      expect(result).toBe(path.join(testWikiPath, 'docs/api/endpoints.md'))
    })

    it('should handle empty path', () => {
      const result = validatePath('', testWikiPath)
      expect(result).toBe(testWikiPath)
    })

    it('should prevent path traversal after normalization', () => {
      expect(() => {
        validatePath('docs/./../../etc/passwd', testWikiPath)
      }).toThrow('Access denied')
    })
  })
})
