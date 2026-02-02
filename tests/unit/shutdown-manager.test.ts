import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockProcessExit } from 'vitest-mock-process'

// Mock process.exit using vitest-mock-process
let mockExit: ReturnType<typeof mockProcessExit>

// Mock dependencies
const mockFileWatcherStop = vi.fn()
const mockStopSyncManager = vi.fn()
const mockCommitPendingChanges = vi.fn()
const mockGetConfig = vi.fn()
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

vi.mock('../../server/utils/file-watcher', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../server/utils/file-watcher')>()
  return {
    ...actual,
    fileWatcher: {
      ...(actual.fileWatcher || {}),
      stop: mockFileWatcherStop
    }
  }
})

vi.mock('../../server/utils/sync-manager', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../server/utils/sync-manager')>()
  return {
    ...actual,
    stop: mockStopSyncManager
  }
})

vi.mock('../../server/utils/git-sync', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../server/utils/git-sync')>()
  return {
    ...actual,
    commitPendingChanges: mockCommitPendingChanges
  }
})

vi.mock('../../server/utils/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../server/utils/config')>()
  return {
    ...actual,
    getConfig: mockGetConfig
  }
})

vi.mock('../../server/utils/logger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../server/utils/logger')>()
  return {
    ...actual,
    getLogger: vi.fn(async () => mockLogger)
  }
})

// Import after mocks
const shutdownManager = await import('../../server/utils/shutdown-manager')
const { shutdown, resetShutdownState } = shutdownManager

describe('shutdown-manager', () => {
  beforeEach(() => {
    // Setup process.exit mock before each test
    mockExit = mockProcessExit()

    // Reset all mocks before each test
    vi.clearAllMocks()
    resetShutdownState()
    vi.useRealTimers() // Ensure real timers are used by default

    // Default config
    mockGetConfig.mockReturnValue({
      git: { enabled: true }
    })

    // Default successful responses - fileWatcher.stop() is now async
    mockFileWatcherStop.mockResolvedValue(undefined)
    mockStopSyncManager.mockResolvedValue(undefined)
    mockCommitPendingChanges.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.useRealTimers() // Always restore real timers after test
    mockExit.mockRestore()
  })

  describe('shutdown()', () => {
    it('should log shutdown start with signal name', async () => {
      await shutdown('SIGTERM')

      expect(mockLogger.info).toHaveBeenCalledWith(
        { signal: 'SIGTERM' },
        'MDumb Wiki shutting down'
      )
    })

    it('should stop file watcher first', async () => {
      await shutdown('SIGTERM')

      expect(mockFileWatcherStop).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith('File watcher stopped')
    })

    it('should stop sync manager second', async () => {
      await shutdown('SIGTERM')

      expect(mockStopSyncManager).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith('Sync manager stopped')
    })

    it('should stop file watcher before sync manager', async () => {
      const callOrder: string[] = []
      mockFileWatcherStop.mockImplementation(async () => {
        callOrder.push('watcher')
      })
      mockStopSyncManager.mockImplementation(async () => {
        callOrder.push('sync')
      })

      await shutdown('SIGTERM')

      expect(callOrder).toEqual(['watcher', 'sync'])
    })

    it('should commit pending changes when git is enabled', async () => {
      mockGetConfig.mockReturnValue({
        git: { enabled: true }
      })

      await shutdown('SIGTERM')

      expect(mockCommitPendingChanges).toHaveBeenCalledWith('Shutdown: pending changes')
      expect(mockLogger.info).toHaveBeenCalledWith('Pending changes committed')
    })

    it('should not commit pending changes when git is disabled', async () => {
      mockGetConfig.mockReturnValue({
        git: { enabled: false }
      })

      await shutdown('SIGTERM')

      expect(mockCommitPendingChanges).not.toHaveBeenCalled()
    })

    it('should not log commit success when commitPendingChanges returns false', async () => {
      mockCommitPendingChanges.mockResolvedValue(false)

      await shutdown('SIGTERM')

      expect(mockCommitPendingChanges).toHaveBeenCalled()
      expect(mockLogger.info).not.toHaveBeenCalledWith('Pending changes committed')
    })

    it('should exit with code 0 on successful shutdown', async () => {
      await shutdown('SIGTERM')

      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should log completion message before exit', async () => {
      await shutdown('SIGTERM')

      expect(mockLogger.info).toHaveBeenCalledWith('Cleanup completed, goodbye!')
    })

    it('should exit with code 1 on error', async () => {
      const error = new Error('Sync failed')
      mockStopSyncManager.mockRejectedValue(error)

      await shutdown('SIGTERM')

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error },
        'Error during shutdown'
      )
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should prevent duplicate shutdowns with isShuttingDown flag', async () => {
      // Start first shutdown but don't await
      const firstShutdown = shutdown('SIGTERM')
      // Try second shutdown immediately
      await shutdown('SIGINT')
      await firstShutdown

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { signal: 'SIGINT' },
        'Shutdown already in progress, ignoring signal'
      )
      expect(mockFileWatcherStop).toHaveBeenCalledTimes(1)
      expect(mockExit).toHaveBeenCalledTimes(1)
    })

    it('should set a 30 second timeout', async () => {
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

      await shutdown('SIGTERM')

      // Verify setTimeout was called with 30000ms
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 30000)

      setTimeoutSpy.mockRestore()
    })

    it('should clear timeout if shutdown completes before 30 seconds', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      await shutdown('SIGTERM')

      // Should have called clearTimeout at least once
      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })

    it('should handle file watcher errors gracefully and continue shutdown', async () => {
      mockFileWatcherStop.mockRejectedValue(new Error('Watcher error'))

      await shutdown('SIGTERM')

      expect(mockLogger.error).toHaveBeenCalled()
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should handle sync manager errors gracefully and continue shutdown', async () => {
      mockStopSyncManager.mockRejectedValue(new Error('Sync error'))

      await shutdown('SIGTERM')

      expect(mockLogger.error).toHaveBeenCalled()
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should handle git commit errors gracefully', async () => {
      mockCommitPendingChanges.mockRejectedValue(new Error('Git error'))

      await shutdown('SIGTERM')

      expect(mockLogger.error).toHaveBeenCalled()
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should work with different signal names', async () => {
      const signals = ['SIGTERM', 'SIGINT', 'NITRO_CLOSE']

      for (const signal of signals) {
        resetShutdownState()
        vi.clearAllMocks()
        mockExit.mockClear()

        await shutdown(signal)

        expect(mockLogger.info).toHaveBeenCalledWith(
          { signal },
          'MDumb Wiki shutting down'
        )
      }
    })
  })

  describe('resetShutdownState()', () => {
    it('should allow shutdown to run again after reset', async () => {
      // First shutdown
      await shutdown('SIGTERM')

      expect(mockFileWatcherStop).toHaveBeenCalledTimes(1)

      // Reset and try again
      resetShutdownState()
      vi.clearAllMocks()
      mockExit.mockClear()

      await shutdown('SIGINT')

      expect(mockFileWatcherStop).toHaveBeenCalledTimes(1)
      expect(mockLogger.warn).not.toHaveBeenCalled()
    })
  })
})
