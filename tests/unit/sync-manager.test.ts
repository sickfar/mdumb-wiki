import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest'
import type { WikiConfig } from '../../types'

// Create mock functions
const mockInitGit = vi.fn()
const mockCheckForChanges = vi.fn()
const mockCommitChanges = vi.fn()
const mockPushChanges = vi.fn()

// Mock dependencies
vi.mock('../../server/utils/git-sync', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    checkForChanges: mockCheckForChanges,
    commitChanges: mockCommitChanges,
    pushChanges: mockPushChanges,
    initGit: mockInitGit
  }
})

const mockGetConfig = vi.fn(() => ({
  contentPath: './wiki',
  git: {
    enabled: true,
    syncInterval: 5,
    autoCommit: true,
    autoPush: true,
    commitMessageTemplate: 'Auto-commit: {timestamp}',
    conflictStrategy: 'rebase'
  }
} as WikiConfig))

vi.mock('../../server/utils/config', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    getConfig: mockGetConfig
  }
})

const mockLoggerInstance = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
}

vi.mock('../../server/utils/logger', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    getLogger: vi.fn(() => mockLoggerInstance)
  }
})

// Import sync manager
const syncManager = await import('../../server/utils/sync-manager')
const { start, stop, forceSync, getStatus, resetState } = syncManager

describe('sync-manager', () => {
  beforeEach(async () => {
    // Reset sync manager state
    resetState()

    // Clear all mocks
    mockInitGit.mockClear()
    mockCheckForChanges.mockClear()
    mockCommitChanges.mockClear()
    mockPushChanges.mockClear()
    mockGetConfig.mockClear()
    mockLoggerInstance.info.mockClear()
    mockLoggerInstance.warn.mockClear()
    mockLoggerInstance.error.mockClear()
    mockLoggerInstance.debug.mockClear()

    // Reset mock implementations to defaults
    mockGetConfig.mockReturnValue({
      contentPath: './wiki',
      git: {
        enabled: true,
        syncInterval: 5,
        autoCommit: true,
        autoPush: true,
        commitMessageTemplate: 'Auto-commit: {timestamp}',
        conflictStrategy: 'rebase'
      }
    } as WikiConfig)
  })

  afterEach(async () => {
    try {
      await stop()
    } catch {
      // Ignore errors if module doesn't exist yet
    }
  })

  describe('start()', () => {
    it('should start the sync manager', () => {
      start()
      const status = getStatus()
      expect(status.nextSync).not.toBeNull()
    })

    it('should initialize git on first start', () => {
      start()
      expect(mockInitGit).toHaveBeenCalledWith('./wiki')
    })

    it('should set up interval polling', () => {
      start()
      expect(getStatus().nextSync).not.toBeNull()
    })

    it('should not start multiple intervals if called multiple times', () => {
      start()
      const firstNextSync = getStatus().nextSync
      start()
      const secondNextSync = getStatus().nextSync
      expect(firstNextSync).toEqual(secondNextSync)
    })
  })

  describe('stop()', () => {
    it('should stop the sync manager', async () => {
      start()
      await stop()
      const status = getStatus()
      expect(status.nextSync).toBeNull()
    })

    it('should await pending operations before stopping', async () => {
      let resolveCommit: (() => void) | undefined
      mockCheckForChanges.mockResolvedValue(true)
      mockCommitChanges.mockImplementation(() => new Promise<void>(resolve => {
        resolveCommit = resolve
      }))
      mockPushChanges.mockResolvedValue(undefined)

      const syncPromise = forceSync()

      // Give time for the promise to start
      await Promise.resolve()

      // Stop while sync is in progress
      const stopPromise = stop()

      // Resolve the commit
      if (resolveCommit) {
        resolveCommit()
      }

      await syncPromise
      await stopPromise

      expect(mockCommitChanges).toHaveBeenCalled()
    })

    it('should clear the interval', async () => {
      start()
      expect(getStatus().nextSync).not.toBeNull()
      await stop()
      expect(getStatus().nextSync).toBeNull()
    })
  })

  describe('forceSync()', () => {
    beforeEach(() => {
      mockCheckForChanges.mockResolvedValue(true)
      mockCommitChanges.mockResolvedValue(undefined)
      mockPushChanges.mockResolvedValue(undefined)
    })

    it('should trigger an immediate sync', async () => {
      await forceSync()
      expect(mockCheckForChanges).toHaveBeenCalledWith('./wiki')
    })

    it('should commit changes if autoCommit is enabled', async () => {
      await forceSync()
      expect(mockCommitChanges).toHaveBeenCalledWith(
        './wiki',
        expect.stringContaining('Auto-commit:')
      )
    })

    it('should push changes if autoPush is enabled', async () => {
      await forceSync()
      expect(mockPushChanges).toHaveBeenCalledWith('./wiki', 'rebase')
    })

    it('should not commit if autoCommit is disabled', async () => {
      mockGetConfig.mockReturnValue({
        contentPath: './wiki',
        git: {
          enabled: true,
          syncInterval: 5,
          autoCommit: false,
          autoPush: true,
          commitMessageTemplate: 'Auto-commit: {timestamp}',
          conflictStrategy: 'rebase'
        }
      })

      await forceSync()
      expect(mockCommitChanges).not.toHaveBeenCalled()
    })

    it('should not push if autoPush is disabled', async () => {
      mockGetConfig.mockReturnValue({
        contentPath: './wiki',
        git: {
          enabled: true,
          syncInterval: 5,
          autoCommit: true,
          autoPush: false,
          commitMessageTemplate: 'Auto-commit: {timestamp}',
          conflictStrategy: 'rebase'
        }
      })

      await forceSync()
      expect(mockCommitChanges).toHaveBeenCalled()
      expect(mockPushChanges).not.toHaveBeenCalled()
    })

    it('should not sync if git is disabled', async () => {
      mockGetConfig.mockReturnValue({
        contentPath: './wiki',
        git: {
          enabled: false,
          syncInterval: 5,
          autoCommit: true,
          autoPush: true,
          commitMessageTemplate: 'Auto-commit: {timestamp}',
          conflictStrategy: 'rebase'
        }
      })

      await forceSync()
      expect(mockCheckForChanges).not.toHaveBeenCalled()
    })

    it('should not commit/push if no changes detected', async () => {
      mockCheckForChanges.mockResolvedValue(false)

      await forceSync()
      expect(mockCheckForChanges).toHaveBeenCalled()
      expect(mockCommitChanges).not.toHaveBeenCalled()
      expect(mockPushChanges).not.toHaveBeenCalled()
    })

    it('should replace {timestamp} in commit message template', async () => {
      await forceSync()
      const commitCall = mockCommitChanges.mock.calls[0]
      const commitMessage = commitCall[1]

      expect(commitMessage).toMatch(/^Auto-commit: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should update lastSync after successful sync', async () => {
      const beforeSync = getStatus().lastSync
      await forceSync()
      const afterSync = getStatus().lastSync
      expect(afterSync).not.toEqual(beforeSync)
      expect(afterSync).toBeInstanceOf(Date)
    })
  })

  describe('getStatus()', () => {
    it('should return initial status', () => {
      const status = getStatus()
      expect(status).toMatchObject({
        isRunning: false,
        lastSync: null,
        nextSync: null,
        currentOperation: null,
        errorCount: 0,
        lastError: null
      })
    })

    it('should track running state during sync', async () => {
      mockCheckForChanges.mockImplementation(() => {
        const status = getStatus()
        expect(status.isRunning).toBe(true)
        return Promise.resolve(false)
      })

      await forceSync()
      expect(getStatus().isRunning).toBe(false)
    })

    it('should update lastSync after successful sync', async () => {
      mockCheckForChanges.mockResolvedValue(true)
      mockCommitChanges.mockResolvedValue(undefined)
      mockPushChanges.mockResolvedValue(undefined)

      await forceSync()
      const status = getStatus()
      expect(status.lastSync).toBeInstanceOf(Date)
    })

    it('should calculate nextSync based on interval', () => {
      start()
      const status = getStatus()
      expect(status.nextSync).toBeInstanceOf(Date)

      const now = new Date()
      const nextSync = status.nextSync as Date
      const diffMinutes = (nextSync.getTime() - now.getTime()) / (1000 * 60)
      expect(diffMinutes).toBeCloseTo(5, 0)
    })
  })

  describe('overlapping sync prevention', () => {
    it('should skip sync if previous operation is still running', async () => {
      let resolveSync: () => void
      mockCheckForChanges.mockImplementation(() => new Promise(resolve => {
        resolveSync = () => resolve(false)
      }))

      const firstSync = forceSync()
      const secondSync = forceSync()

      // First sync should start
      expect(mockCheckForChanges).toHaveBeenCalledTimes(1)

      resolveSync!()
      await firstSync
      await secondSync

      // Second sync should be skipped
      expect(mockCheckForChanges).toHaveBeenCalledTimes(1)
    })

    it('should log warning when skipping overlapping sync', async () => {
      const loggerInstance = mockLoggerInstance

      let resolveSync: () => void
      mockCheckForChanges.mockImplementation(() => new Promise(resolve => {
        resolveSync = () => resolve(false)
      }))

      const firstSync = forceSync()
      await forceSync()

      expect(loggerInstance.warn).toHaveBeenCalledWith(
        expect.stringContaining('already in progress')
      )

      resolveSync!()
      await firstSync
    })
  })

  describe('error handling', () => {
    it('should handle git errors gracefully', async () => {
      mockCheckForChanges.mockRejectedValue(new Error('Git error'))

      // Should not throw - errors are caught internally
      await forceSync()
      expect(getStatus().errorCount).toBe(1)
    })

    it('should log errors', async () => {
      const loggerInstance = mockLoggerInstance
      const testError = new Error('Test error')
      mockCheckForChanges.mockRejectedValue(testError)

      await forceSync()
      expect(loggerInstance.error).toHaveBeenCalledWith(
        expect.stringContaining('Sync failed'),
        expect.objectContaining({ error: testError.message })
      )
    })

    it('should track error count', async () => {
      mockCheckForChanges.mockRejectedValue(new Error('Error 1'))
      await forceSync()
      expect(getStatus().errorCount).toBe(1)

      mockCheckForChanges.mockRejectedValue(new Error('Error 2'))
      await forceSync()
      expect(getStatus().errorCount).toBe(2)
    })

    it('should track last error message', async () => {
      const testError = new Error('Test error message')
      mockCheckForChanges.mockRejectedValue(testError)

      await forceSync()
      expect(getStatus().lastError).toBe('Test error message')
    })

    it('should not stop interval on error', async () => {
      mockCheckForChanges.mockRejectedValue(new Error('Git error'))

      start()
      await forceSync()

      expect(getStatus().nextSync).not.toBeNull()
    })
  })

  describe('interval-based syncing', () => {
    it('should perform sync at configured intervals', async () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval')

      start()

      // Verify setInterval was called with correct interval (5 minutes = 300000ms)
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        5 * 60 * 1000
      )

      setIntervalSpy.mockRestore()
    })

    it('should respect syncInterval from config', async () => {
      await stop()

      mockGetConfig.mockReturnValue({
        contentPath: './wiki',
        git: {
          enabled: true,
          syncInterval: 10,
          autoCommit: true,
          autoPush: true,
          commitMessageTemplate: 'Auto-commit: {timestamp}',
          conflictStrategy: 'rebase'
        }
      })

      const setIntervalSpy = vi.spyOn(global, 'setInterval')

      start()

      // Verify setInterval was called with correct interval (10 minutes = 600000ms)
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        10 * 60 * 1000
      )

      setIntervalSpy.mockRestore()
    })
  })
})
