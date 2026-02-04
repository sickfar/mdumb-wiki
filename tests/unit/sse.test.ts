import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendSSEMessage } from '../../server/utils/sse'
import { fileWatcher } from '../../server/utils/file-watcher'

describe('sendSSEMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should emit file:created event', () => {
    const emitSpy = vi.spyOn(fileWatcher, 'emit')

    sendSSEMessage({
      type: 'file:created',
      path: 'test.md'
    })

    expect(emitSpy).toHaveBeenCalledWith(
      'file:created',
      expect.objectContaining({
        path: 'test.md',
        type: 'file:created',
        timestamp: expect.any(Number)
      })
    )
  })

  it('should emit file:changed event', () => {
    const emitSpy = vi.spyOn(fileWatcher, 'emit')

    sendSSEMessage({
      type: 'file:changed',
      path: 'test.md'
    })

    expect(emitSpy).toHaveBeenCalledWith(
      'file:changed',
      expect.objectContaining({
        path: 'test.md',
        type: 'file:changed',
        timestamp: expect.any(Number)
      })
    )
  })

  it('should emit file:deleted event', () => {
    const emitSpy = vi.spyOn(fileWatcher, 'emit')

    sendSSEMessage({
      type: 'file:deleted',
      path: 'test.md'
    })

    expect(emitSpy).toHaveBeenCalledWith(
      'file:deleted',
      expect.objectContaining({
        path: 'test.md',
        type: 'file:deleted',
        timestamp: expect.any(Number)
      })
    )
  })

  it('should include timestamp in emitted event', () => {
    const emitSpy = vi.spyOn(fileWatcher, 'emit')
    const beforeTimestamp = Date.now()

    sendSSEMessage({
      type: 'file:created',
      path: 'test.md'
    })

    const afterTimestamp = Date.now()
    const emittedEvent = emitSpy.mock.calls[0][1]

    expect(emittedEvent.timestamp).toBeGreaterThanOrEqual(beforeTimestamp)
    expect(emittedEvent.timestamp).toBeLessThanOrEqual(afterTimestamp)
  })

  it('should handle different file paths', () => {
    const emitSpy = vi.spyOn(fileWatcher, 'emit')

    const paths = [
      'simple.md',
      'folder/nested.md',
      'deep/nested/path/file.md'
    ]

    paths.forEach(path => {
      sendSSEMessage({
        type: 'file:created',
        path
      })
    })

    expect(emitSpy).toHaveBeenCalledTimes(3)
    paths.forEach((path, index) => {
      expect(emitSpy.mock.calls[index][1].path).toBe(path)
    })
  })
})
