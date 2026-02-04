import { refreshNuxtData } from '#app'

export function useLiveReload() {
  // Global singleton state for SSR-safe live reload connection
  const globalEventSource = useState<EventSource | null>('live-reload-connection', () => null)
  const globalReconnectAttempts = useState<number>('live-reload-reconnect', () => 0)
  const connectionCount = useState<number>('live-reload-count', () => 0)
  const lastSaveTimestamp = useState<number>('last-save-timestamp', () => 0)

  const showUpdateBanner = ref(false)
  const maxReconnectAttempts = 5
  const route = useRoute()
  const SUPPRESS_NOTIFICATION_WINDOW = 3000 // 3 seconds

  const connect = () => {
    // Prevent multiple connections
    if (globalEventSource.value) {
      connectionCount.value++
      return
    }

    try {
      const es = new EventSource('/api/events')
      globalEventSource.value = es
      connectionCount.value = 1

      es.addEventListener('connected', () => {
        globalReconnectAttempts.value = 0
      })

      // Listen for generic messages
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)

          if (data.type === 'file:changed' && data.path) {
            if (isCurrentPage(data.path)) {
              // Suppress notification if it's within the window after a save
              const timeSinceLastSave = Date.now() - lastSaveTimestamp.value
              if (timeSinceLastSave > SUPPRESS_NOTIFICATION_WINDOW) {
                showUpdateBanner.value = true
              }
            }
          }

          if (data.type === 'file:created') {
            refreshNuxtData('navigation')
          }

          if (data.type === 'file:deleted') {
            if (isCurrentPage(data.path)) {
              showUpdateBanner.value = true
            }
            refreshNuxtData('navigation')
          }
        } catch (error) {
          console.error('[LiveReload] Failed to parse:', error)
        }
      }

      globalEventSource.value.onerror = (error) => {
        console.error('[LiveReload] Connection error:', error)
        disconnect()
        attemptReconnect()
      }
    } catch (error) {
      console.error('[LiveReload] Failed to connect:', error)
    }
  }

  const disconnect = () => {
    // Only disconnect if this is the last active connection
    connectionCount.value--
    if (connectionCount.value <= 0 && globalEventSource.value) {
      globalEventSource.value.close()
      globalEventSource.value = null
      connectionCount.value = 0
    }
  }

  const attemptReconnect = () => {
    if (globalReconnectAttempts.value >= maxReconnectAttempts) {
      console.error('[LiveReload] Max reconnection attempts reached')
      return
    }

    globalReconnectAttempts.value++
    const delay = Math.min(1000 * Math.pow(2, globalReconnectAttempts.value), 30000)

    setTimeout(() => {
      connect()
    }, delay)
  }

  const isCurrentPage = (filePath: string): boolean => {
    // Extract path from file system path
    // E.g., /wiki/guides/installation.md -> /guides/installation
    // Or: wiki/test-index.md -> /test-index
    const normalizedPath = filePath
      .replace(/^\.?\/?(wiki\/)?/, '/') // Remove leading ./ or wiki/ or /wiki/
      .replace(/\.md$/, '') // Remove .md extension

    const routePath = route.path

    // Handle index files
    if (filePath.includes('index.md')) {
      const folderPath = normalizedPath.replace(/\/index$/, '') || '/'
      return routePath === folderPath || routePath === '/'
    }

    // Check if the file path matches current route
    return normalizedPath === routePath
  }

  const reload = async () => {
    // Refresh Nuxt data without full page reload
    await refreshNuxtData()
    showUpdateBanner.value = false
  }

  const dismiss = () => {
    showUpdateBanner.value = false
  }

  const markSaved = () => {
    lastSaveTimestamp.value = Date.now()
  }

  // Connect on mount (client-side only), disconnect on unmount
  onMounted(() => {
    // Only connect on client side (not during SSR)
    if (import.meta.client) {
      connect()
    }
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    showUpdateBanner,
    reload,
    dismiss,
    markSaved,
  }
}
