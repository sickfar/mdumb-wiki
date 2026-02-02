import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest'
import type { StatusResult } from 'simple-git'

// Import after mocking
import {
  initGit,
  checkForChanges,
  getStatus,
  commitChanges,
  pushChanges,
  handleConflict,
  commitPendingChanges,
  clearGitInstance
} from '../../server/utils/git-sync'

// Mock simple-git before importing the module
const mockStatus = vi.fn()
const mockAdd = vi.fn()
const mockCommit = vi.fn()
const mockPush = vi.fn()
const mockPull = vi.fn()
const mockBranch = vi.fn()
const mockCheckout = vi.fn()
const mockLog = vi.fn()

const mockSimpleGitInstance = {
  status: mockStatus,
  add: mockAdd,
  commit: mockCommit,
  push: mockPush,
  pull: mockPull,
  branch: mockBranch,
  checkout: mockCheckout,
  log: mockLog
}

vi.mock('simple-git', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    simpleGit: vi.fn(() => mockSimpleGitInstance)
  }
})

// Mock logger
vi.mock('../../server/utils/logger', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    getLogger: vi.fn(() => ({
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }))
  }
})

describe('git-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearGitInstance()
  })

  afterEach(() => {
    clearGitInstance()
  })

  describe('initGit', () => {
    it('should initialize git instance with content path', () => {
      const git = initGit('/path/to/wiki')
      expect(git).toBeDefined()
    })

    it('should return same instance on subsequent calls', () => {
      const git1 = initGit('/path/to/wiki')
      const git2 = initGit('/path/to/wiki')
      expect(git1).toBe(git2)
    })

    it('should create new instance if path changes', () => {
      initGit('/path/to/wiki1')
      clearGitInstance()
      const git2 = initGit('/path/to/wiki2')
      expect(git2).toBeDefined()
    })
  })

  describe('checkForChanges', () => {
    it('should return true when there are uncommitted changes', async () => {
      initGit('/path/to/wiki')
      mockStatus.mockResolvedValue({
        files: [{ path: 'test.md', working_dir: 'M' }],
        modified: ['test.md']
      } as StatusResult)

      const hasChanges = await checkForChanges()
      expect(hasChanges).toBe(true)
      expect(mockStatus).toHaveBeenCalled()
    })

    it('should return true when there are staged changes', async () => {
      initGit('/path/to/wiki')
      mockStatus.mockResolvedValue({
        files: [{ path: 'test.md', index: 'M' }],
        staged: ['test.md']
      } as StatusResult)

      const hasChanges = await checkForChanges()
      expect(hasChanges).toBe(true)
    })

    it('should return false when there are no changes', async () => {
      initGit('/path/to/wiki')
      mockStatus.mockResolvedValue({
        files: [],
        modified: [],
        staged: []
      } as StatusResult)

      const hasChanges = await checkForChanges()
      expect(hasChanges).toBe(false)
    })

    it('should return false and log error on git failure', async () => {
      initGit('/path/to/wiki')
      mockStatus.mockRejectedValue(new Error('Git error'))

      const hasChanges = await checkForChanges()
      expect(hasChanges).toBe(false)
    })

    it('should throw error if git not initialized', async () => {
      await expect(checkForChanges()).rejects.toThrow('Git not initialized')
    })
  })

  describe('getStatus', () => {
    it('should return complete status with branch and last commit', async () => {
      initGit('/path/to/wiki')
      mockStatus.mockResolvedValue({
        current: 'main',
        tracking: 'origin/main',
        behind: 0,
        ahead: 0,
        files: []
      } as StatusResult)

      mockLog.mockResolvedValue({
        latest: {
          hash: 'abc123',
          date: '2024-01-01',
          message: 'Test commit',
          author_name: 'Test Author'
        }
      })

      const status = await getStatus()
      expect(status).toEqual({
        enabled: true,
        branch: 'main',
        lastCommit: 'abc123',
        upToDate: true,
        lastSync: expect.any(Date),
        errors: []
      })
    })

    it('should indicate not up to date when behind remote', async () => {
      initGit('/path/to/wiki')
      mockStatus.mockResolvedValue({
        current: 'main',
        tracking: 'origin/main',
        behind: 2,
        ahead: 0,
        files: []
      } as StatusResult)

      mockLog.mockResolvedValue({
        latest: { hash: 'abc123' }
      })

      const status = await getStatus()
      expect(status.upToDate).toBe(false)
    })

    it('should indicate not up to date when ahead of remote', async () => {
      initGit('/path/to/wiki')
      mockStatus.mockResolvedValue({
        current: 'main',
        tracking: 'origin/main',
        behind: 0,
        ahead: 1,
        files: []
      } as StatusResult)

      mockLog.mockResolvedValue({
        latest: { hash: 'abc123' }
      })

      const status = await getStatus()
      expect(status.upToDate).toBe(false)
    })

    it('should return error status when git fails', async () => {
      initGit('/path/to/wiki')
      mockStatus.mockRejectedValue(new Error('Git error'))

      const status = await getStatus()
      expect(status.enabled).toBe(false)
      expect(status.errors).toHaveLength(1)
      expect(status.errors[0]).toContain('Git error')
    })

    it('should return disabled status when git not initialized', async () => {
      const status = await getStatus()
      expect(status.enabled).toBe(false)
      expect(status.errors).toHaveLength(1)
    })
  })

  describe('commitChanges', () => {
    it('should stage all changes and commit with message', async () => {
      initGit('/path/to/wiki')
      mockAdd.mockResolvedValue(undefined)
      mockCommit.mockResolvedValue({ commit: 'abc123' })

      await commitChanges('Test commit message')

      expect(mockAdd).toHaveBeenCalledWith('.')
      expect(mockCommit).toHaveBeenCalledWith('Test commit message')
    })

    it('should throw error if git not initialized', async () => {
      await expect(commitChanges('Test')).rejects.toThrow('Git not initialized')
    })

    it('should throw error when commit fails', async () => {
      initGit('/path/to/wiki')
      mockAdd.mockResolvedValue(undefined)
      mockCommit.mockRejectedValue(new Error('Commit failed'))

      await expect(commitChanges('Test')).rejects.toThrow('Commit failed')
    })

    it('should throw error when staging fails', async () => {
      initGit('/path/to/wiki')
      mockAdd.mockRejectedValue(new Error('Stage failed'))

      await expect(commitChanges('Test')).rejects.toThrow('Stage failed')
    })
  })

  describe('pushChanges', () => {
    it('should push changes to remote', async () => {
      initGit('/path/to/wiki')
      mockPush.mockResolvedValue(undefined)

      await pushChanges()

      expect(mockPush).toHaveBeenCalled()
    })

    it('should throw error if git not initialized', async () => {
      await expect(pushChanges()).rejects.toThrow('Git not initialized')
    })

    it('should throw error when push fails', async () => {
      initGit('/path/to/wiki')
      mockPush.mockRejectedValue(new Error('Push failed'))

      await expect(pushChanges()).rejects.toThrow('Push failed')
    })
  })

  describe('handleConflict - rebase strategy', () => {
    it('should pull with rebase and push on success', async () => {
      initGit('/path/to/wiki')
      mockPull.mockResolvedValue(undefined)
      mockPush.mockResolvedValue(undefined)

      await handleConflict('rebase')

      expect(mockPull).toHaveBeenCalledWith({ '--rebase': 'true' })
      expect(mockPush).toHaveBeenCalled()
    })

    it('should throw error when rebase fails', async () => {
      initGit('/path/to/wiki')
      mockPull.mockRejectedValue(new Error('Rebase conflict'))

      await expect(handleConflict('rebase')).rejects.toThrow('Rebase conflict')
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('handleConflict - merge strategy', () => {
    it('should pull with merge and push on success', async () => {
      initGit('/path/to/wiki')
      mockPull.mockResolvedValue(undefined)
      mockPush.mockResolvedValue(undefined)

      await handleConflict('merge')

      expect(mockPull).toHaveBeenCalledWith({ '--no-rebase': null })
      expect(mockPush).toHaveBeenCalled()
    })

    it('should throw error when merge fails', async () => {
      initGit('/path/to/wiki')
      mockPull.mockRejectedValue(new Error('Merge conflict'))

      await expect(handleConflict('merge')).rejects.toThrow('Merge conflict')
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('handleConflict - branch strategy', () => {
    it('should create conflict branch and push', async () => {
      initGit('/path/to/wiki')
      mockCheckout.mockResolvedValue(undefined)
      mockPush.mockResolvedValue(undefined)

      await handleConflict('branch')

      expect(mockCheckout).toHaveBeenCalledWith(expect.arrayContaining(['-b', expect.stringMatching(/^conflict-\d+$/)]))
      expect(mockPush).toHaveBeenCalledWith('origin', expect.stringMatching(/^conflict-\d+$/))
    })

    it('should throw error when branch creation fails', async () => {
      initGit('/path/to/wiki')
      mockCheckout.mockRejectedValue(new Error('Branch creation failed'))

      await expect(handleConflict('branch')).rejects.toThrow('Branch creation failed')
    })

    it('should throw error when push to new branch fails', async () => {
      initGit('/path/to/wiki')
      mockCheckout.mockResolvedValue(undefined)
      mockPush.mockRejectedValue(new Error('Push failed'))

      await expect(handleConflict('branch')).rejects.toThrow('Push failed')
    })
  })

  describe('handleConflict - error handling', () => {
    it('should throw error if git not initialized', async () => {
      await expect(handleConflict('rebase')).rejects.toThrow('Git not initialized')
    })
  })

  describe('commitPendingChanges', () => {
    it('should commit and return true on success', async () => {
      initGit('/path/to/wiki')
      mockStatus.mockResolvedValue({
        files: [{ path: 'test.md', working_dir: 'M' }]
      } as StatusResult)
      mockAdd.mockResolvedValue(undefined)
      mockCommit.mockResolvedValue({ commit: 'abc123' })

      const result = await commitPendingChanges('Auto-commit')

      expect(result).toBe(true)
      expect(mockAdd).toHaveBeenCalledWith('.')
      expect(mockCommit).toHaveBeenCalledWith('Auto-commit')
    })

    it('should return false when no changes to commit', async () => {
      initGit('/path/to/wiki')
      mockStatus.mockResolvedValue({
        files: []
      } as StatusResult)

      const result = await commitPendingChanges('Auto-commit')

      expect(result).toBe(false)
      expect(mockAdd).not.toHaveBeenCalled()
      expect(mockCommit).not.toHaveBeenCalled()
    })

    it('should return false and not throw on git error', async () => {
      initGit('/path/to/wiki')
      mockStatus.mockRejectedValue(new Error('Git error'))

      const result = await commitPendingChanges('Auto-commit')

      expect(result).toBe(false)
    })

    it('should return false when git not initialized', async () => {
      const result = await commitPendingChanges('Auto-commit')

      expect(result).toBe(false)
    })

    it('should return false when commit fails', async () => {
      initGit('/path/to/wiki')
      mockStatus.mockResolvedValue({
        files: [{ path: 'test.md', working_dir: 'M' }]
      } as StatusResult)
      mockAdd.mockResolvedValue(undefined)
      mockCommit.mockRejectedValue(new Error('Commit failed'))

      const result = await commitPendingChanges('Auto-commit')

      expect(result).toBe(false)
    })
  })
})
