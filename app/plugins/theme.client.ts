export default defineNuxtPlugin(() => {
  // Initialize theme as early as possible on client-side
  if (typeof window !== 'undefined') {
    const STORAGE_KEY = 'mdumb-wiki-theme'
    const stored = localStorage.getItem(STORAGE_KEY) || 'auto'

    let resolvedTheme: 'light' | 'dark' = 'light'

    if (stored === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      resolvedTheme = prefersDark ? 'dark' : 'light'
    } else {
      resolvedTheme = stored as 'light' | 'dark'
    }

    // Apply theme immediately
    document.documentElement.setAttribute('data-theme', resolvedTheme)
  }
})
