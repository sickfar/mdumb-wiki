export function useLiveReload() {
  const showUpdateBanner = ref(false)
  const eventSource = ref<EventSource | null>(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const route = useRoute()

  const connect = () => {
    if (eventSource.value) {
      return
    }

    try {
      const es = new EventSource('/api/events')
      eventSource.value = es

      es.addEventListener('connected', () => {
        reconnectAttempts.value = 0
      })

      // Listen for generic messages
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'file:changed' && data.path) {
            if (isCurrentPage(data.path)) {
              showUpdateBanner.value = true
            }
          }
        } catch (error) {
          console.error('[LiveReload] Failed to parse:', error)
        }
      }

      eventSource.value.addEventListener('file:changed', (e) => {
        const data = JSON.parse(e.data)
        if (isCurrentPage(data.path)) {
          showUpdateBanner.value = true
        }
      })

      eventSource.value.addEventListener('file:deleted', (e) => {
        const data = JSON.parse(e.data)
        if (isCurrentPage(data.path)) {
          showUpdateBanner.value = true
        }
      })

      eventSource.value.addEventListener('file:created', (e) => {
        const data = JSON.parse(e.data)
        // Could update navigation here
      })

      eventSource.value.onerror = (error) => {
        console.error('[LiveReload] Connection error:', error)
        disconnect()
        attemptReconnect()
      }
    } catch (error) {
      console.error('[LiveReload] Failed to connect:', error)
    }
  }

  const disconnect = () => {
    if (eventSource.value) {
      eventSource.value.close()
      eventSource.value = null
    }
  }

  const attemptReconnect = () => {
    if (reconnectAttempts.value >= maxReconnectAttempts) {
      console.error('[LiveReload] Max reconnection attempts reached')
      return
    }

    reconnectAttempts.value++
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000)

    setTimeout(() => {
      connect()
    }, delay)
  }

  const isCurrentPage = (filePath: string): boolean => {
    // Extract path from file system path
    // E.g., /wiki/guides/installation.md -> /guides/installation
    // Or: wiki/test-index.md -> /test-index
    let normalizedPath = filePath
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

  // Connect on mount (client-side only), disconnect on unmount
  onMounted(() => {
    // Only connect on client side (not during SSR)
    if (process.client) {
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
  }
}
