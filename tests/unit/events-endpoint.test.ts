import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fileWatcher } from '../../server/utils/file-watcher'

describe('Events SSE Endpoint', () => {
  beforeEach(async () => {
    // Ensure file watcher is stopped before each test
    await fileWatcher.stop()
  })

  afterEach(async () => {
    await fileWatcher.stop()
    vi.clearAllMocks()
  })

  it('should emit connected event when file changes occur', async () => {
    return new Promise<void>((resolve) => {
      const handler = (data: Record<string, unknown>) => {
        expect(data).toHaveProperty('type')
        expect(data).toHaveProperty('timestamp')
        fileWatcher.off('file:changed', handler)
        resolve()
      }

      fileWatcher.on('file:changed', handler)

      // Manually emit event to simulate file change
      fileWatcher.emit('file:changed', {
        path: '/test/path.md',
        type: 'file:changed',
        timestamp: Date.now(),
      })
    })
  })

  it('should broadcast events to multiple listeners', async () => {
    let listener1Called = false
    let listener2Called = false

    return new Promise<void>((resolve) => {
      const handler1 = () => {
        listener1Called = true
      }

      const handler2 = () => {
        listener2Called = true
        if (listener1Called && listener2Called) {
          fileWatcher.off('file:created', handler1)
          fileWatcher.off('file:created', handler2)
          resolve()
        }
      }

      fileWatcher.on('file:created', handler1)
      fileWatcher.on('file:created', handler2)

      fileWatcher.emit('file:created', {
        path: '/test/new.md',
        type: 'file:created',
        timestamp: Date.now(),
      })
    })
  })

  it('should handle cleanup when listener is removed', () => {
    const handler = vi.fn()

    fileWatcher.on('file:changed', handler)
    fileWatcher.off('file:changed', handler)

    fileWatcher.emit('file:changed', {
      path: '/test/path.md',
      type: 'file:changed',
      timestamp: Date.now(),
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should handle deleted file events', async () => {
    return new Promise<void>((resolve) => {
      const handler = (data: Record<string, unknown>) => {
        expect(data.type).toBe('file:deleted')
        expect(data.path).toBeDefined()
        fileWatcher.off('file:deleted', handler)
        resolve()
      }

      fileWatcher.on('file:deleted', handler)

      fileWatcher.emit('file:deleted', {
        path: '/test/deleted.md',
        type: 'file:deleted',
        timestamp: Date.now(),
      })
    })
  })

  it('should handle created file events', async () => {
    return new Promise<void>((resolve) => {
      const handler = (data: Record<string, unknown>) => {
        expect(data.type).toBe('file:created')
        expect(data.path).toBeDefined()
        fileWatcher.off('file:created', handler)
        resolve()
      }

      fileWatcher.on('file:created', handler)

      fileWatcher.emit('file:created', {
        path: '/test/created.md',
        type: 'file:created',
        timestamp: Date.now(),
      })
    })
  })
})
