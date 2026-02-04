import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { FileWriteResult, FolderCreateResult, FilePromoteResult } from '~/server/utils/file-operations'

// Mock $fetch
const mockFetch = vi.fn()
globalThis.$fetch = mockFetch as any

describe('useFileManagement', () => {
  let useFileManagement: () => any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Dynamic import to reset module state
    const module = await import('../../../app/composables/useFileManagement')
    useFileManagement = module.useFileManagement
  })

  describe('createFile', () => {
    it('should create file successfully', async () => {
      const mockResponse: FileWriteResult = {
        success: true,
        newHash: 'abc123'
      }

      mockFetch.mockResolvedValueOnce(mockResponse)

      const fileManager = useFileManagement()
      const result = await fileManager.createFile('new-page.md', '# New Page\n\nContent here.')

      expect(mockFetch).toHaveBeenCalledWith('/api/file', {
        method: 'POST',
        body: {
          path: 'new-page.md',
          content: '# New Page\n\nContent here.',
          hash: null
        }
      })
      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should handle createFile errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'))

      const fileManager = useFileManagement()
      const result = await fileManager.createFile('new-page.md', '# Content')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create file: Server error')
    })
  })

  describe('createFolder', () => {
    it('should create folder successfully', async () => {
      const mockResponse: FolderCreateResult = {
        success: true,
        path: 'new-folder'
      }

      mockFetch.mockResolvedValueOnce(mockResponse)

      const fileManager = useFileManagement()
      const result = await fileManager.createFolder('new-folder', true)

      expect(mockFetch).toHaveBeenCalledWith('/api/folder', {
        method: 'POST',
        body: {
          path: 'new-folder',
          createIndex: true
        }
      })
      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should handle createFolder errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Folder already exists'))

      const fileManager = useFileManagement()
      const result = await fileManager.createFolder('existing-folder', false)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create folder: Folder already exists')
    })
  })

  describe('promoteToFolder', () => {
    it('should promote file to folder successfully', async () => {
      const mockResponse: FilePromoteResult = {
        success: true,
        newPath: 'guides/installation'
      }

      mockFetch.mockResolvedValueOnce(mockResponse)

      const fileManager = useFileManagement()
      const result = await fileManager.promoteToFolder('guides/installation.md')

      expect(mockFetch).toHaveBeenCalledWith('/api/file/promote', {
        method: 'POST',
        body: {
          path: 'guides/installation.md'
        }
      })
      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should handle promoteToFolder errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('File not found'))

      const fileManager = useFileManagement()
      const result = await fileManager.promoteToFolder('missing.md')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to promote file: File not found')
    })
  })

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const mockResponse = {
        success: true
      }

      mockFetch.mockResolvedValueOnce(mockResponse)

      const fileManager = useFileManagement()
      const result = await fileManager.deleteFile('old-page.md')

      expect(mockFetch).toHaveBeenCalledWith('/api/file', {
        method: 'DELETE',
        query: {
          path: 'old-page.md'
        }
      })
      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should delete folder successfully', async () => {
      const mockResponse = {
        success: true
      }

      mockFetch.mockResolvedValueOnce(mockResponse)

      const fileManager = useFileManagement()
      const result = await fileManager.deleteFile('old-folder')

      expect(mockFetch).toHaveBeenCalledWith('/api/file', {
        method: 'DELETE',
        query: {
          path: 'old-folder'
        }
      })
      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should handle deleteFile errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('File not found'))

      const fileManager = useFileManagement()
      const result = await fileManager.deleteFile('missing.md')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to delete: File not found')
    })

    it('should handle server errors', async () => {
      const mockResponse = {
        success: false
      }

      mockFetch.mockResolvedValueOnce(mockResponse)

      const fileManager = useFileManagement()
      const result = await fileManager.deleteFile('test.md')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to delete file or folder')
    })
  })
})
