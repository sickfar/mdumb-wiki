import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTheme, resetThemeState } from '../../../app/composables/useTheme'

describe('useTheme Composable', () => {
  let mockLocalStorage: Record<string, string>
  let mockMatchMedia: MediaQueryList
  let mediaQueryListeners: ((event: MediaQueryListEvent) => void)[]

  beforeEach(() => {
    // Reset theme state between tests
    resetThemeState()

    // Mock localStorage
    mockLocalStorage = {}
    global.localStorage = {
      getItem: vi.fn((key) => mockLocalStorage[key] || null),
      setItem: vi.fn((key, value) => { mockLocalStorage[key] = value }),
      removeItem: vi.fn((key) => {
        const { [key]: _removed, ...rest } = mockLocalStorage
        mockLocalStorage = rest
      }),
      clear: vi.fn(() => { mockLocalStorage = {} }),
      length: 0,
      key: vi.fn(),
    } as Storage

    // Mock matchMedia
    mediaQueryListeners = []
    mockMatchMedia = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn((event, handler) => {
        mediaQueryListeners.push(handler)
      }),
      removeEventListener: vi.fn(),
    }
    global.matchMedia = vi.fn(() => mockMatchMedia)

    // Mock document.documentElement
    // @ts-expect-error Mock document for testing
    global.document = {
      documentElement: {
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
      }
    }

    // Mock window with matchMedia
    // @ts-expect-error Mock window for testing
    global.window = {
      matchMedia: global.matchMedia,
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should default to auto mode when no stored preference', () => {
      const { theme } = useTheme()
      expect(theme.value).toBe('auto')
    })

    it('should load theme from localStorage if available', () => {
      mockLocalStorage['mdumb-wiki-theme'] = 'dark'

      const { theme } = useTheme()
      expect(theme.value).toBe('dark')
    })

    it('should resolve to light when auto mode and system prefers light', () => {
      mockMatchMedia.matches = false // System prefers light

      const { resolvedTheme } = useTheme()
      expect(resolvedTheme.value).toBe('light')
    })

    it('should resolve to dark when auto mode and system prefers dark', () => {
      mockMatchMedia.matches = true // System prefers dark

      const { resolvedTheme } = useTheme()
      expect(resolvedTheme.value).toBe('dark')
    })
  })

  describe('Theme Setting', () => {
    it('should save theme preference to localStorage', () => {
      const { setTheme } = useTheme()

      setTheme('dark')

      expect(localStorage.setItem).toHaveBeenCalledWith('mdumb-wiki-theme', 'dark')
    })

    it('should apply data-theme attribute to html element', () => {
      const { setTheme } = useTheme()

      setTheme('dark')

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    })

    it('should update resolvedTheme when setting explicit theme', () => {
      const { setTheme, resolvedTheme } = useTheme()

      setTheme('dark')

      expect(resolvedTheme.value).toBe('dark')
    })
  })

  describe('Theme Toggle', () => {
    it('should cycle from light to dark', () => {
      const { setTheme, toggle, theme } = useTheme()
      setTheme('light')

      toggle()

      expect(theme.value).toBe('dark')
    })

    it('should cycle from dark to auto', () => {
      const { setTheme, toggle, theme } = useTheme()
      setTheme('dark')

      toggle()

      expect(theme.value).toBe('auto')
    })

    it('should cycle from auto to light', () => {
      const { setTheme, toggle, theme } = useTheme()
      setTheme('auto')

      toggle()

      expect(theme.value).toBe('light')
    })

    it('should complete full cycle: light → dark → auto → light', () => {
      const { setTheme, toggle, theme } = useTheme()
      setTheme('light')

      toggle() // light → dark
      expect(theme.value).toBe('dark')

      toggle() // dark → auto
      expect(theme.value).toBe('auto')

      toggle() // auto → light
      expect(theme.value).toBe('light')
    })
  })

  describe('System Preference Changes', () => {
    it('should listen to matchMedia changes', () => {
      useTheme()

      expect(mockMatchMedia.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })

    it('should update resolved theme when system preference changes in auto mode', () => {
      mockMatchMedia.matches = false // Start with light
      const { resolvedTheme, setTheme } = useTheme()
      setTheme('auto')

      expect(resolvedTheme.value).toBe('light')

      // Simulate system switching to dark
      mockMatchMedia.matches = true
      mediaQueryListeners.forEach(listener => listener(mockMatchMedia))

      expect(resolvedTheme.value).toBe('dark')
    })

    it('should NOT update when in explicit light mode', () => {
      const { setTheme, resolvedTheme } = useTheme()
      setTheme('light')

      // Simulate system switching to dark
      mockMatchMedia.matches = true
      mediaQueryListeners.forEach(listener => listener(mockMatchMedia))

      expect(resolvedTheme.value).toBe('light') // Should stay light
    })

    it('should NOT update when in explicit dark mode', () => {
      const { setTheme, resolvedTheme } = useTheme()
      setTheme('dark')

      // Simulate system switching to light
      mockMatchMedia.matches = false
      mediaQueryListeners.forEach(listener => listener(mockMatchMedia))

      expect(resolvedTheme.value).toBe('dark') // Should stay dark
    })
  })

  describe('Singleton Behavior', () => {
    it('should return same state instance on multiple calls', () => {
      const instance1 = useTheme()
      const instance2 = useTheme()

      instance1.setTheme('dark')

      expect(instance2.theme.value).toBe('dark')
    })
  })
})
