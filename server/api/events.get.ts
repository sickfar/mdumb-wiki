import { fileWatcher } from '../utils/file-watcher'

export default defineEventHandler(async (event) => {
  // Set SSE headers
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  // Don't use createEventStream - write directly to response
  const encoder = new TextEncoder()
  let closed = false

  // Helper to send SSE messages
  const sendSSE = (data: Record<string, unknown>) => {
    if (closed) return
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`
      event.node.res.write(encoder.encode(message))
    } catch {
      closed = true
    }
  }

  // Send initial connection event
  setTimeout(() => {
    sendSSE({ type: 'connected', timestamp: Date.now() })
  }, 100)

  // Create event handlers - send as generic data messages
  const handleFileChanged = (data: Record<string, unknown>) => {
    sendSSE(data)
  }

  const handleFileDeleted = (data: Record<string, unknown>) => {
    sendSSE(data)
  }

  const handleFileCreated = (data: Record<string, unknown>) => {
    sendSSE(data)
  }

  // Subscribe to file watcher events
  fileWatcher.on('file:changed', handleFileChanged)
  fileWatcher.on('file:deleted', handleFileDeleted)
  fileWatcher.on('file:created', handleFileCreated)

  // Cleanup on client disconnect
  event.node.req.on('close', () => {
    closed = true
    fileWatcher.off('file:changed', handleFileChanged)
    fileWatcher.off('file:deleted', handleFileDeleted)
    fileWatcher.off('file:created', handleFileCreated)
  })

  // Keep connection alive
  return new Promise(() => {
    // Never resolve - keep stream open
  })
})
