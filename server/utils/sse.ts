import { fileWatcher } from './file-watcher'

export interface SSEMessage {
  type: 'file:created' | 'file:changed' | 'file:deleted'
  path: string
}

/**
 * Send an SSE message to all connected clients via the file watcher
 * @param message SSE message to send
 */
export function sendSSEMessage(message: SSEMessage): void {
  fileWatcher.emit(message.type, {
    path: message.path,
    type: message.type,
    timestamp: Date.now()
  })
}
