import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'

// Mock markdown-cache to avoid config dependency
vi.mock('../../server/utils/markdown-cache', () => ({
  invalidateCache: vi.fn(),
  clearCache: vi.fn(),
  getFromCache: vi.fn(),
  setInCache: vi.fn()
}))

// Import after mocks - must be after vi.mock()
// eslint-disable-next-line import/first
import { clearIgnoreCache, getIgnoreStatus } from '../../server/utils/ignore'
// eslint-disable-next-line import/first
import { fileWatcher } from '../../server/utils/file-watcher'

describe('FileWatcher', () => {
  let testDir: string

  beforeEach(async () => {
    // Ensure any previous watcher is stopped before starting fresh
    await fileWatcher.stop()
    // Create temporary test directory
    testDir = join(process.cwd(), 'tests', 'fixtures', 'watch-test-' + Date.now())
    await fs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    // Stop watcher and cleanup - must await to prevent EMFILE errors
    await fileWatcher.stop()
    await fs.rm(testDir, { recursive: true, force: true })
  })

  it('should initialize watcher with wiki path', () => {
    fileWatcher.start(testDir)
    const status = fileWatcher.getStatus()

    expect(status.active).toBe(true)
    expect(status.watchedPath).toBe(testDir)
  })

  it.skip('should detect file creation', async () => {
    return new Promise<void>((resolve) => {
      const handler = (data: Record<string, unknown>) => {
        if (data.path.includes('test-file.md')) {
          expect(data.type).toBe('file:created')
          expect(data.path).toContain('test-file.md')
          expect(data.timestamp).toBeTypeOf('number')
          fileWatcher.off('file:created', handler)
          resolve()
        }
      }

      fileWatcher.start(testDir)
      fileWatcher.on('file:created', handler)

      // Create a file after a short delay
      setTimeout(async () => {
        await fs.writeFile(join(testDir, 'test-file.md'), '# Test')
      }, 100)
    })
  }, { timeout: 15000 })

  it('should detect file changes', async () => {
    // Create file first
    const filePath = join(testDir, 'existing.md')
    await fs.writeFile(filePath, '# Initial')

    return new Promise<void>((resolve) => {
      const handler = (data: Record<string, unknown>) => {
        if (data.path.includes('existing.md')) {
          expect(data.type).toBe('file:changed')
          expect(data.path).toContain('existing.md')
          fileWatcher.off('file:changed', handler)
          resolve()
        }
      }

      fileWatcher.start(testDir)
      fileWatcher.on('file:changed', handler)

      // Modify file after a short delay
      setTimeout(async () => {
        await fs.writeFile(filePath, '# Modified')
      }, 100)
    })
  })

  it('should detect file deletion', async () => {
    // Create file first
    const filePath = join(testDir, 'to-delete.md')
    await fs.writeFile(filePath, '# Delete me')

    return new Promise<void>((resolve) => {
      const handler = (data: Record<string, unknown>) => {
        if (data.path.includes('to-delete.md')) {
          expect(data.type).toBe('file:deleted')
          expect(data.path).toContain('to-delete.md')
          fileWatcher.off('file:deleted', handler)
          resolve()
        }
      }

      fileWatcher.start(testDir)
      fileWatcher.on('file:deleted', handler)

      // Delete file after a short delay
      setTimeout(async () => {
        await fs.unlink(filePath)
      }, 100)
    })
  })

  it('should debounce rapid changes', async () => {
    const filePath = join(testDir, 'rapid-changes.md')
    await fs.writeFile(filePath, '# Initial')

    let eventCount = 0

    return new Promise<void>((resolve) => {
      fileWatcher.start(testDir)

      fileWatcher.on('file:changed', () => {
        eventCount++
      })

      // Make multiple rapid changes
      setTimeout(async () => {
        await fs.writeFile(filePath, '# Change 1')
        await fs.writeFile(filePath, '# Change 2')
        await fs.writeFile(filePath, '# Change 3')
      }, 100)

      // Check after debounce period (300ms + buffer)
      setTimeout(() => {
        // Should only emit 1 event due to debouncing
        expect(eventCount).toBeLessThan(3)
        resolve()
      }, 500)
    })
  })

  it('should ignore hidden files', async () => {
    let eventEmitted = false

    fileWatcher.start(testDir)

    fileWatcher.on('file:created', () => {
      eventEmitted = true
    })

    // Create hidden file
    await fs.writeFile(join(testDir, '.hidden'), 'secret')

    // Wait to see if event is emitted
    await new Promise(resolve => setTimeout(resolve, 200))

    expect(eventEmitted).toBe(false)
  })

  it('should stop watcher on cleanup', async () => {
    fileWatcher.start(testDir)
    expect(fileWatcher.getStatus().active).toBe(true)

    await fileWatcher.stop()
    expect(fileWatcher.getStatus().active).toBe(false)
  })

  it.skip('should handle multiple listeners', async () => {
    const filePath = join(testDir, 'multi-listener.md')

    let listener1Called = false
    let listener2Called = false

    return new Promise<void>((resolve) => {
      const handler1 = (data: Record<string, unknown>) => {
        if (data.path.includes('multi-listener.md')) {
          listener1Called = true
          fileWatcher.off('file:created', handler1)
        }
      }

      const handler2 = (data: Record<string, unknown>) => {
        if (data.path.includes('multi-listener.md')) {
          listener2Called = true
          fileWatcher.off('file:created', handler2)

          // Both should be called
          if (listener1Called && listener2Called) {
            resolve()
          }
        }
      }

      fileWatcher.start(testDir)
      fileWatcher.on('file:created', handler1)
      fileWatcher.on('file:created', handler2)

      setTimeout(async () => {
        await fs.writeFile(filePath, '# Test')
      }, 100)
    })
  }, { timeout: 15000 })
})

describe('FileWatcher .mdumbignore handling', () => {
  let testDir: string

  beforeEach(async () => {
    await fileWatcher.stop()
    testDir = join(process.cwd(), 'tests', 'fixtures', 'watch-ignore-test-' + Date.now())
    await fs.mkdir(testDir, { recursive: true })
    clearIgnoreCache()
  })

  afterEach(async () => {
    await fileWatcher.stop()
    await fs.rm(testDir, { recursive: true, force: true })
    clearIgnoreCache()
  })

  it('should detect .mdumbignore file changes (not filtered by hidden file rule)', async () => {
    // Create initial ignore file
    const ignorePath = join(testDir, '.mdumbignore')
    await fs.writeFile(ignorePath, 'drafts/')

    return new Promise<void>((resolve) => {
      const handler = (data: Record<string, unknown>) => {
        if (typeof data.path === 'string' && data.path.includes('.mdumbignore')) {
          expect(data.timestamp).toBeTypeOf('number')
          fileWatcher.off('ignore:changed', handler)
          resolve()
        }
      }

      fileWatcher.start(testDir)
      fileWatcher.on('ignore:changed', handler)

      // Modify ignore file after a short delay
      setTimeout(async () => {
        await fs.writeFile(ignorePath, 'drafts/\n*.tmp')
      }, 100)
    })
  })

  it('should emit ignore:changed event when .mdumbignore is modified', async () => {
    const ignorePath = join(testDir, '.mdumbignore')
    await fs.writeFile(ignorePath, 'initial/')

    return new Promise<void>((resolve) => {
      const handler = (data: Record<string, unknown>) => {
        if (typeof data.path === 'string' && data.path.includes('.mdumbignore')) {
          fileWatcher.off('ignore:changed', handler)
          resolve()
        }
      }

      fileWatcher.start(testDir)
      fileWatcher.on('ignore:changed', handler)

      // Modify the file
      setTimeout(async () => {
        await fs.writeFile(ignorePath, 'modified/')
      }, 100)
    })
  })

  it('should emit ignore:changed event when .mdumbignore is created', async () => {
    const ignorePath = join(testDir, '.mdumbignore')

    return new Promise<void>((resolve) => {
      const handler = (data: Record<string, unknown>) => {
        if (typeof data.path === 'string' && data.path.includes('.mdumbignore')) {
          fileWatcher.off('ignore:changed', handler)
          resolve()
        }
      }

      fileWatcher.start(testDir)
      fileWatcher.on('ignore:changed', handler)

      // Create the file
      setTimeout(async () => {
        await fs.writeFile(ignorePath, 'new-pattern/')
      }, 100)
    })
  })

  it('should emit ignore:changed event when .mdumbignore is deleted', async () => {
    const ignorePath = join(testDir, '.mdumbignore')
    await fs.writeFile(ignorePath, 'to-be-deleted/')

    return new Promise<void>((resolve) => {
      const handler = (data: Record<string, unknown>) => {
        if (typeof data.path === 'string' && data.path.includes('.mdumbignore')) {
          fileWatcher.off('ignore:changed', handler)
          resolve()
        }
      }

      fileWatcher.start(testDir)
      fileWatcher.on('ignore:changed', handler)

      // Delete the file
      setTimeout(async () => {
        await fs.unlink(ignorePath)
      }, 100)
    })
  })

  it('should still ignore regular hidden files (.hidden.md)', async () => {
    let hiddenFileEventFired = false

    fileWatcher.on('file:created', (data: { path: string }) => {
      if (data.path.includes('.hidden')) {
        hiddenFileEventFired = true
      }
    })

    fileWatcher.start(testDir)

    // Create hidden file
    await fs.writeFile(join(testDir, '.hidden.md'), 'secret')

    // Wait to see if event is emitted
    await new Promise(resolve => setTimeout(resolve, 500))

    expect(hiddenFileEventFired).toBe(false)
  })

  it('should clear ignore cache when .mdumbignore changes', async () => {
    const ignorePath = join(testDir, '.mdumbignore')
    await fs.writeFile(ignorePath, 'drafts/')

    // Load the cache
    const { loadIgnorePatterns } = await import('../../server/utils/ignore')
    loadIgnorePatterns(testDir)
    expect(getIgnoreStatus().loaded).toBe(true)

    return new Promise<void>((resolve) => {
      fileWatcher.on('ignore:changed', () => {
        // Cache should be cleared after event
        expect(getIgnoreStatus().loaded).toBe(false)
        resolve()
      })

      fileWatcher.start(testDir)

      // Modify the file
      setTimeout(async () => {
        await fs.writeFile(ignorePath, 'modified/')
      }, 100)
    })
  })
})
