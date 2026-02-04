import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import type { FileReadResult, FileWriteResult } from '~/server/utils/file-operations'

// Mock $fetch
const mockFetch = vi.fn()
globalThis.$fetch = mockFetch as any

// Mock @vueuse/core
const mockUseDebounceFn = vi.fn((fn) => fn)
const mockUseIntervalFn = vi.fn(() => ({ pause: vi.fn(), resume: vi.fn() }))
vi.mock('@vueuse/core', () => ({
  useDebounceFn: mockUseDebounceFn,
  useIntervalFn: mockUseIntervalFn
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
globalThis.localStorage = localStorageMock as any

describe('useEditor', () => {
  let useEditor: () => any

  beforeEach(async () => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)

    // Dynamic import to reset module state
    const module = await import('../../../app/composables/useEditor')
    useEditor = module.useEditor
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('load', () => {
    it('should load file successfully', async () => {
      const mockResponse: FileReadResult = {
        exists: true,
        path: 'test.md',
        content: '# Test Content',
        hash: 'abc123'
      }

      mockFetch.mockResolvedValueOnce(mockResponse)

      const editor = useEditor()
      await editor.load('test.md')

      expect(mockFetch).toHaveBeenCalledWith('/api/file?path=test.md')
      expect(editor.content.value).toBe('# Test Content')
      expect(editor.originalHash.value).toBe('abc123')
      expect(editor.isLoading.value).toBe(false)
      expect(editor.error.value).toBeNull()
    })

    it('should handle file not found (404)', async () => {
      const mockResponse: FileReadResult = {
        exists: false,
        path: 'missing.md'
      }

      mockFetch.mockResolvedValueOnce(mockResponse)

      const editor = useEditor()
      await editor.load('missing.md')

      expect(editor.content.value).toBe('')
      expect(editor.originalHash.value).toBeNull()
      expect(editor.error.value).toBeNull()
      expect(editor.isLoading.value).toBe(false)
    })

    it('should handle load errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const editor = useEditor()
      await editor.load('test.md')

      expect(editor.error.value).toBe('Failed to load file: Network error')
      expect(editor.isLoading.value).toBe(false)
    })
  })

  describe('save', () => {
    it('should save new file (hash=null)', async () => {
      const mockWriteResponse: FileWriteResult = {
        success: true,
        newHash: 'def456'
      }

      mockFetch.mockResolvedValueOnce(mockWriteResponse)

      const editor = useEditor()
      editor.content.value = '# New Content'
      editor.originalHash.value = null

      const result = await editor.save('new.md')

      expect(mockFetch).toHaveBeenCalledWith('/api/file', {
        method: 'POST',
        body: {
          path: 'new.md',
          content: '# New Content',
          hash: null
        }
      })
      expect(result).toBe(true)
      expect(editor.originalHash.value).toBe('def456')
      expect(editor.lastSaved.value).toBeDefined()
      expect(editor.lastSaved.value).toBeInstanceOf(Date)
      expect(editor.isSaving.value).toBe(false)
    })

    it('should save existing file with hash match', async () => {
      const mockWriteResponse: FileWriteResult = {
        success: true,
        newHash: 'ghi789'
      }

      mockFetch.mockResolvedValueOnce(mockWriteResponse)

      const editor = useEditor()
      editor.content.value = '# Updated Content'
      editor.originalHash.value = 'abc123'

      const result = await editor.save('existing.md')

      expect(mockFetch).toHaveBeenCalledWith('/api/file', {
        method: 'POST',
        body: {
          path: 'existing.md',
          content: '# Updated Content',
          hash: 'abc123'
        }
      })
      expect(result).toBe(true)
      expect(editor.originalHash.value).toBe('ghi789')
    })

    it('should detect conflict on save', async () => {
      const mockWriteResponse: FileWriteResult = {
        success: false,
        conflict: {
          conflictDetected: true,
          currentHash: 'xyz999'
        }
      }

      mockFetch.mockResolvedValueOnce(mockWriteResponse)

      const editor = useEditor()
      editor.content.value = '# My Changes'
      editor.originalHash.value = 'abc123'

      const result = await editor.save('conflict.md')

      expect(result).toBe(false)
      expect(editor.hasConflict.value).toBe(true)
      expect(editor.error.value).toBe('File has been modified by another user')
    })

    it('should handle save errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'))

      const editor = useEditor()
      editor.content.value = '# Content'

      const result = await editor.save('test.md')

      expect(result).toBe(false)
      expect(editor.error.value).toBe('Failed to save file: Server error')
      expect(editor.isSaving.value).toBe(false)
    })
  })

  describe('draft management', () => {
    it('should save draft to localStorage', async () => {
      // We need to manually trigger the debounced function
      let debouncedFn: Function | null = null
      mockUseDebounceFn.mockImplementation((fn) => {
        debouncedFn = fn
        return fn
      })

      const editor = useEditor()
      editor.content.value = '# Draft Content'

      // Manually call the debounced function
      if (debouncedFn) {
        debouncedFn()
      }

      await nextTick()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'draft-test.md',
        expect.stringContaining('"content":"# Draft Content"')
      )
    })

    it('should restore from draft', async () => {
      const draft = {
        content: '# Restored Draft',
        savedAt: Date.now()
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(draft))

      const editor = useEditor()
      editor.restoreFromDraft('test.md')

      expect(localStorageMock.getItem).toHaveBeenCalledWith('draft-test.md')
      expect(editor.content.value).toBe('# Restored Draft')
    })

    it('should clear draft', () => {
      const editor = useEditor()
      editor.clearDraft('test.md')

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('draft-test.md')
    })
  })

  describe('conflict detection polling', () => {
    it('should poll for changes and detect conflicts', async () => {
      let intervalCallback: Function | null = null
      mockUseIntervalFn.mockImplementation((fn: Function) => {
        intervalCallback = fn
        return { pause: vi.fn(), resume: vi.fn() }
      })

      const mockLoadResponse: FileReadResult = {
        exists: true,
        path: 'test.md',
        content: '# Original',
        hash: 'original-hash'
      }

      const mockPollResponse: FileReadResult = {
        exists: true,
        path: 'test.md',
        content: '# Updated by someone else',
        hash: 'new-hash'
      }

      mockFetch.mockResolvedValueOnce(mockLoadResponse)

      const editor = useEditor()
      await editor.load('test.md')

      expect(editor.hasConflict.value).toBe(false)

      // Simulate interval callback
      mockFetch.mockResolvedValueOnce(mockPollResponse)
      if (intervalCallback) {
        await intervalCallback()
      }

      expect(editor.hasConflict.value).toBe(true)
    })
  })

  describe('computed properties', () => {
    it('should compute isDirty correctly', async () => {
      const mockLoadResponse: FileReadResult = {
        exists: true,
        path: 'test.md',
        content: '# Original Content',
        hash: 'abc123'
      }

      const mockSaveResponse: FileWriteResult = {
        success: true,
        newHash: 'def456'
      }

      mockFetch.mockResolvedValueOnce(mockLoadResponse)

      const editor = useEditor()
      await editor.load('test.md')

      // After load, content matches original, not dirty
      expect(editor.isDirty.value).toBe(false)

      // Modify content
      editor.content.value = '# Modified Content'
      expect(editor.isDirty.value).toBe(true)

      // Save the changes
      mockFetch.mockResolvedValueOnce(mockSaveResponse)
      await editor.save('test.md')

      // After save, content matches original again, not dirty
      expect(editor.isDirty.value).toBe(false)

      // Modify again
      editor.content.value = '# Another Change'
      expect(editor.isDirty.value).toBe(true)
    })
  })

  describe('reset', () => {
    it('should reset all state', () => {
      const editor = useEditor()

      editor.content.value = '# Content'
      editor.originalHash.value = 'abc123'
      editor.error.value = 'Some error'
      editor.hasConflict.value = true

      editor.reset()

      expect(editor.content.value).toBe('')
      expect(editor.originalHash.value).toBeNull()
      expect(editor.error.value).toBeNull()
      expect(editor.hasConflict.value).toBe(false)
      expect(editor.isDirty.value).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle all error scenarios gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Generic error'))

      const editor = useEditor()

      // Load error
      await editor.load('test.md')
      expect(editor.error.value).toContain('Failed to load file')

      // Save error
      editor.content.value = 'content'
      await editor.save('test.md')
      expect(editor.error.value).toContain('Failed to save file')
    })
  })
})
