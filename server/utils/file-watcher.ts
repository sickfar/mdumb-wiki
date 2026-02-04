import { watch, type FSWatcher } from 'chokidar'
import { EventEmitter } from 'node:events'
import { invalidateCache } from './markdown-cache'

export interface FileChangeEvent {
  path: string
  type: 'file:created' | 'file:changed' | 'file:deleted'
  timestamp: number
}

export interface WatcherStatus {
  active: boolean
  watchedPath: string
  fileCount?: number
}

class FileWatcher extends EventEmitter {
  private watcher: FSWatcher | null = null
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map()
  private watchedPath: string = ''
  private readonly DEBOUNCE_MS = 300

  /**
   * Start watching the specified directory for file changes
   * Note: If a watcher is already active, it will be stopped first (synchronously)
   */
  start(wikiPath: string): void {
    if (this.watcher) {
      // Synchronously close the existing watcher to avoid race conditions
      // This is a workaround since start() is sync but stop() is async
      this.watcher.close()
      this.watcher = null
      // Clear all debounce timers
      for (const timer of this.debounceTimers.values()) {
        clearTimeout(timer)
      }
      this.debounceTimers.clear()
    }

    this.watchedPath = wikiPath

    this.watcher = watch(wikiPath, {
      ignoreInitial: true, // Don't emit events for existing files
      ignored: [
        /(^|[/\\])\../, // Ignore hidden files (starting with .)
        '**/node_modules/**',
        '**/.git/**',
      ],
      persistent: true,
      // Use polling in test environment to avoid EMFILE issues with FSEvents
      usePolling: process.env.NODE_ENV === 'test',
      interval: process.env.NODE_ENV === 'test' ? 100 : undefined,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    })

    // Handle file addition
    this.watcher.on('add', (path: string) => {
      this.emitDebouncedEvent(path, 'file:created')
    })

    // Handle file change
    this.watcher.on('change', (path: string) => {
      this.emitDebouncedEvent(path, 'file:changed')
    })

    // Handle file deletion
    this.watcher.on('unlink', (path: string) => {
      this.emitDebouncedEvent(path, 'file:deleted')
    })

    // Handle errors
    this.watcher.on('error', (error: Error) => {
      console.error('File watcher error:', error)
    })
  }

  /**
   * Stop the file watcher and cleanup resources
   * @returns Promise that resolves when the watcher is fully closed
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close()
      this.watcher = null
    }

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer)
    }
    this.debounceTimers.clear()
    this.watchedPath = ''
  }

  /**
   * Get current watcher status
   */
  getStatus(): WatcherStatus {
    return {
      active: this.watcher !== null,
      watchedPath: this.watchedPath,
    }
  }

  /**
   * Emit debounced event to prevent spam during rapid changes
   */
  private emitDebouncedEvent(
    path: string,
    type: 'file:created' | 'file:changed' | 'file:deleted'
  ): void {
    // Clear existing timer for this path
    const existingTimer = this.debounceTimers.get(path)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set new timer
    const timer = setTimeout(() => {
      const event: FileChangeEvent = {
        path,
        type,
        timestamp: Date.now(),
      }

      // Invalidate markdown cache for the changed file
      invalidateCache(path)

      this.emit(type, event)
      this.debounceTimers.delete(path)
    }, this.DEBOUNCE_MS)

    this.debounceTimers.set(path, timer)
  }
}

// Export singleton instance
export const fileWatcher = new FileWatcher()
