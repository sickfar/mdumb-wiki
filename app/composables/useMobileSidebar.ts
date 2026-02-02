import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from '#app'

// Shared state - starts closed for mobile-first SSR
const isOpenState = ref(false)
let initialized = false

export function useMobileSidebar() {
  const router = useRouter()

  // Initialize on client only
  onMounted(() => {
    if (!initialized) {
      initialized = true

      // On desktop, open sidebar by default
      if (window.innerWidth >= 768) {
        isOpenState.value = true
      }

      // Listen for resize events
      window.addEventListener('resize', () => {
        // Auto-open on desktop, auto-close on mobile
        if (window.innerWidth >= 768) {
          isOpenState.value = true
        } else {
          isOpenState.value = false
        }
      })
    }
  })

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
  watch(
    () => router.currentRoute.value.path,
    () => {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        close()
      }
    }
  )

  return {
    isOpen: computed(() => isOpenState.value),
    isMobile: computed(() => typeof window !== 'undefined' && window.innerWidth < 768),
    toggle,
    open,
    close,
  }
}
