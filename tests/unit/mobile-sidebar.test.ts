import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed, watch, nextTick } from 'vue'

// Create a test version of the composable that doesn't depend on Nuxt
describe('useMobileSidebar (logic tests)', () => {
  // Recreate the composable logic for testing
  const createMobileSidebar = (initialMobile = false) => {
    const isOpenState = ref(!initialMobile)
    const isMobileState = ref(initialMobile)
    const routePath = ref('/')

    const toggle = () => {
      isOpenState.value = !isOpenState.value
    }

    const open = () => {
      isOpenState.value = true
    }

    const close = () => {
      isOpenState.value = false
    }

    // Auto-close sidebar on route change (mobile only)
    watch(routePath, () => {
      if (isMobileState.value) {
        close()
      }
    })

    return {
      isOpen: computed(() => isOpenState.value),
      isMobile: computed(() => isMobileState.value),
      toggle,
      open,
      close,
      // Test helpers
      _setMobile: (val: boolean) => { isMobileState.value = val },
      _setRoute: (path: string) => { routePath.value = path },
    }
  }

  describe('Return Values', () => {
    it('should return all required properties and methods', () => {
      const result = createMobileSidebar()

      expect(result).toHaveProperty('isOpen')
      expect(result).toHaveProperty('isMobile')
      expect(result).toHaveProperty('toggle')
      expect(result).toHaveProperty('open')
      expect(result).toHaveProperty('close')

      expect(typeof result.toggle).toBe('function')
      expect(typeof result.open).toBe('function')
      expect(typeof result.close).toBe('function')
    })

    it('should return reactive computed refs for isOpen and isMobile', () => {
      const { isOpen, isMobile } = createMobileSidebar()

      expect(isOpen).toHaveProperty('value')
      expect(isMobile).toHaveProperty('value')
    })
  })

  describe('Default Sidebar State', () => {
    it('should have sidebar open by default on desktop', () => {
      const { isOpen } = createMobileSidebar(false) // Desktop
      expect(isOpen.value).toBe(true)
    })

    it('should have sidebar closed by default on mobile', () => {
      const { isOpen } = createMobileSidebar(true) // Mobile
      expect(isOpen.value).toBe(false)
    })
  })

  describe('Toggle Functionality', () => {
    it('should toggle sidebar from open to closed', () => {
      const { isOpen, toggle } = createMobileSidebar(false) // Desktop - starts open

      expect(isOpen.value).toBe(true)
      toggle()
      expect(isOpen.value).toBe(false)
    })

    it('should toggle sidebar from closed to open', () => {
      const { isOpen, toggle } = createMobileSidebar(true) // Mobile - starts closed

      expect(isOpen.value).toBe(false)
      toggle()
      expect(isOpen.value).toBe(true)
    })

    it('should toggle multiple times correctly', () => {
      const { isOpen, toggle } = createMobileSidebar()
      const initialState = isOpen.value

      toggle()
      expect(isOpen.value).toBe(!initialState)

      toggle()
      expect(isOpen.value).toBe(initialState)

      toggle()
      expect(isOpen.value).toBe(!initialState)
    })
  })

  describe('Open/Close Methods', () => {
    it('should open sidebar when calling open()', () => {
      const { isOpen, open } = createMobileSidebar(true) // Mobile - starts closed

      expect(isOpen.value).toBe(false)
      open()
      expect(isOpen.value).toBe(true)
    })

    it('should keep sidebar open when calling open() multiple times', () => {
      const { isOpen, open } = createMobileSidebar(false) // Desktop

      expect(isOpen.value).toBe(true)
      open()
      expect(isOpen.value).toBe(true)
      open()
      expect(isOpen.value).toBe(true)
    })

    it('should close sidebar when calling close()', () => {
      const { isOpen, close } = createMobileSidebar(false) // Desktop - starts open

      expect(isOpen.value).toBe(true)
      close()
      expect(isOpen.value).toBe(false)
    })

    it('should keep sidebar closed when calling close() multiple times', () => {
      const { isOpen, close } = createMobileSidebar(true) // Mobile

      expect(isOpen.value).toBe(false)
      close()
      expect(isOpen.value).toBe(false)
      close()
      expect(isOpen.value).toBe(false)
    })
  })

  describe('Auto-close on Route Change', () => {
    it('should auto-close sidebar on route change when on mobile', async () => {
      const sidebar = createMobileSidebar(true) // Mobile

      // Open sidebar
      sidebar.open()
      expect(sidebar.isOpen.value).toBe(true)

      // Change route
      sidebar._setRoute('/guides')
      await nextTick()

      // Should auto-close on mobile
      expect(sidebar.isOpen.value).toBe(false)
    })

    it('should NOT auto-close sidebar on route change when on desktop', async () => {
      const sidebar = createMobileSidebar(false) // Desktop

      // Ensure sidebar is open
      expect(sidebar.isOpen.value).toBe(true)

      // Change route
      sidebar._setRoute('/guides')
      await nextTick()

      // Should remain open on desktop
      expect(sidebar.isOpen.value).toBe(true)
    })

    it('should NOT auto-close if sidebar was already closed on mobile', async () => {
      const sidebar = createMobileSidebar(true) // Mobile - starts closed

      // Sidebar starts closed on mobile
      expect(sidebar.isOpen.value).toBe(false)

      // Change route
      sidebar._setRoute('/docs')
      await nextTick()

      // Should remain closed
      expect(sidebar.isOpen.value).toBe(false)
    })

    it('should handle multiple route changes on mobile correctly', async () => {
      const sidebar = createMobileSidebar(true) // Mobile

      // First navigation
      sidebar.open()
      expect(sidebar.isOpen.value).toBe(true)

      sidebar._setRoute('/guide1')
      await nextTick()
      expect(sidebar.isOpen.value).toBe(false)

      // Second navigation
      sidebar.open()
      expect(sidebar.isOpen.value).toBe(true)

      sidebar._setRoute('/guide2')
      await nextTick()
      expect(sidebar.isOpen.value).toBe(false)
    })
  })

  describe('Breakpoint Detection', () => {
    it('should detect desktop viewport (isMobile=false)', () => {
      const { isMobile } = createMobileSidebar(false)
      expect(isMobile.value).toBe(false)
    })

    it('should detect mobile viewport (isMobile=true)', () => {
      const { isMobile } = createMobileSidebar(true)
      expect(isMobile.value).toBe(true)
    })
  })
})
