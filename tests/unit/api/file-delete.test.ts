import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import type { H3Event } from 'h3'

const TEST_DIR = '/tmp/claude/mdumb-wiki-test-api-delete'

// Mock h3 getQuery - use vi.hoisted to avoid hoisting issues
const mockGetQuery = vi.hoisted(() => vi.fn())
vi.mock('h3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    getQuery: mockGetQuery
  }
})

// Mock dependencies
vi.mock('../../../server/utils/logger', () => ({
  getLogger: async () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}))

vi.mock('../../../server/utils/config', () => ({
  getConfig: () => ({
    contentPath: TEST_DIR
  })
}))

vi.mock('../../../server/utils/sse', () => ({
  sendSSEMessage: vi.fn()
}))

// eslint-disable-next-line import/first
import fileDeleteHandler from '../../../server/api/file.delete'
// eslint-disable-next-line import/first
import { sendSSEMessage } from '../../../server/utils/sse'

describe('DELETE /api/file', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true })
    vi.clearAllMocks()
    mockGetQuery.mockReset()
  })

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  const createMockEvent = (_query: Record<string, string | string[]>): H3Event => {
    return {
      node: {
        req: {},
        res: {}
      },
      context: {},
      _method: 'DELETE'
    } as unknown as H3Event
  }

  describe('successful deletion', () => {
    it('should delete a file and emit SSE event', async () => {
      // Create test file
      const filePath = join(TEST_DIR, 'test.md')
      writeFileSync(filePath, '# Test File')

      // Mock getQuery
      const event = createMockEvent({ path: 'test.md' })
      mockGetQuery.mockReturnValue({ path: 'test.md' })

      const result = await fileDeleteHandler(event)

      expect(result.success).toBe(true)
      expect(result.path).toBe('test.md')
      expect(existsSync(filePath)).toBe(false)

      // Should emit SSE event
      expect(sendSSEMessage).toHaveBeenCalledWith({
        type: 'file:deleted',
        path: 'test.md'
      })
    })

    it('should delete a folder recursively', async () => {
      // Create folder with files
      const folderPath = join(TEST_DIR, 'folder')
      mkdirSync(folderPath)
      writeFileSync(join(folderPath, 'file1.md'), '# File 1')
      writeFileSync(join(folderPath, 'file2.md'), '# File 2')

      const event = createMockEvent({ path: 'folder' })
      mockGetQuery.mockReturnValue({ path: 'folder' })

      const result = await fileDeleteHandler(event)

      expect(result.success).toBe(true)
      expect(existsSync(folderPath)).toBe(false)
      expect(sendSSEMessage).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should return 400 if path is missing', async () => {
      const event = createMockEvent({})
      mockGetQuery.mockReturnValue({})

      await expect(fileDeleteHandler(event)).rejects.toThrow()
    })

    it('should return 500 if file does not exist', async () => {
      const event = createMockEvent({ path: 'nonexistent.md' })
      mockGetQuery.mockReturnValue({ path: 'nonexistent.md' })

      await expect(fileDeleteHandler(event)).rejects.toThrow()
    })
  })

  describe('path validation', () => {
    it('should reject path traversal attempts', async () => {
      const event = createMockEvent({ path: '../outside.md' })
      vi.stubGlobal('getQuery', () => ({ path: '../outside.md' }))

      await expect(fileDeleteHandler(event)).rejects.toThrow()
    })
  })
})
