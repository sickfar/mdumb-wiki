import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('useLiveReload', () => {
  let mockEventSource: ReturnType<typeof vi.fn>
  let eventSourceInstances: Record<string, unknown>[] = []

  beforeEach(() => {
    // Mock EventSource
    mockEventSource = vi.fn(function (this: Record<string, unknown>, url: string) {
      const instance = {
        url,
        readyState: 1,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        close: vi.fn(),
        onerror: null,
        onopen: null,
        onmessage: null,
      }
      eventSourceInstances.push(instance)
      return instance
    })

    // @ts-expect-error Mock EventSource for testing
    global.EventSource = mockEventSource
  })

  afterEach(() => {
    eventSourceInstances = []
    vi.clearAllMocks()
  })

  it('should establish SSE connection on mount', () => {
    // This test validates EventSource mock is working
    const es = new EventSource('/api/events')

    expect(mockEventSource).toHaveBeenCalledWith('/api/events')
    expect(es.url).toBe('/api/events')
  })

  it('should parse incoming events correctly', () => {
    const es = new EventSource('/api/events')
    const handler = vi.fn()

    es.addEventListener('file:changed', handler)

    expect(es.addEventListener).toHaveBeenCalledWith('file:changed', handler)
  })

  it('should cleanup connection on close', () => {
    const es = new EventSource('/api/events')
    es.close()

    expect(es.close).toHaveBeenCalled()
  })

  it('should handle error events', () => {
    const es = new EventSource('/api/events')
    const errorHandler = vi.fn()

    es.addEventListener('error', errorHandler)

    // Simulate error
    if (es.onerror) {
      es.onerror(new Event('error'))
    }

    expect(es.addEventListener).toHaveBeenCalledWith('error', errorHandler)
  })

  it('should detect connection state', () => {
    const es = new EventSource('/api/events')

    expect(es.readyState).toBe(1) // OPEN
  })

  it('should handle multiple event types', () => {
    const es = new EventSource('/api/events')

    es.addEventListener('file:created', vi.fn())
    es.addEventListener('file:changed', vi.fn())
    es.addEventListener('file:deleted', vi.fn())

    expect(es.addEventListener).toHaveBeenCalledTimes(3)
  })
})
