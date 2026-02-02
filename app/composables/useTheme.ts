import { ref, computed, onMounted, getCurrentInstance } from 'vue'

type Theme = 'light' | 'dark' | 'auto'
type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'mdumb-wiki-theme'

// Singleton state (shared across all component instances)
const globalThemeState = {
  theme: ref<Theme>('auto'),
  resolvedTheme: ref<ResolvedTheme>('light'),
  isInitialized: ref(false),
}

export function useTheme() {
  const { theme, resolvedTheme, isInitialized } = globalThemeState

  const updateResolvedTheme = () => {
    if (theme.value === 'auto') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        resolvedTheme.value = prefersDark ? 'dark' : 'light'
      }
    } else {
      resolvedTheme.value = theme.value
    }
  }

  const applyTheme = () => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', resolvedTheme.value)
    }
  }

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newTheme)
    }

    updateResolvedTheme()
    applyTheme()
  }

  const toggle = () => {
    const cycle: Record<Theme, Theme> = {
      light: 'dark',
      dark: 'auto',
      auto: 'light',
    }
    setTheme(cycle[theme.value])
  }

  const initializeTheme = () => {
    // Check if we have access to browser APIs (client-side or test environment with mocks)
    const hasClientApis = typeof window !== 'undefined' && typeof localStorage !== 'undefined'

    if (isInitialized.value || !hasClientApis) return

    // Load from localStorage
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored && ['light', 'dark', 'auto'].includes(stored)) {
      theme.value = stored
    }

    // Set initial resolved theme
    updateResolvedTheme()
    applyTheme()

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'auto') {
        updateResolvedTheme()
        applyTheme()
      }
    })

    isInitialized.value = true
  }

  // Initialize immediately in test environment (no component instance)
  // or use onMounted in component context
  const instance = getCurrentInstance()
  if (instance) {
    onMounted(() => {
      initializeTheme()
    })
  } else {
    // No component instance (e.g., test environment), initialize immediately
    initializeTheme()
  }

  return {
    theme: computed(() => theme.value),
    resolvedTheme: computed(() => resolvedTheme.value),
    setTheme,
    toggle,
  }
}

// Testing utility - resets state between tests
export function resetThemeState() {
  globalThemeState.theme.value = 'auto'
  globalThemeState.resolvedTheme.value = 'light'
  globalThemeState.isInitialized.value = false
}
