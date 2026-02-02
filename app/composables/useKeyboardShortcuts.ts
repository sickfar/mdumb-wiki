export function useKeyboardShortcuts(search: ReturnType<typeof useSearch>) {
  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
    const _isSearchInput = target.classList.contains('search-input')

    // "/" opens search (unless typing in an input that's NOT the search)
    if (e.key === '/' && !search.isOpen.value && !isTyping) {
      e.preventDefault()
      search.open()
      return
    }

    // "Escape" closes search (works even when typing)
    if (e.key === 'Escape' && search.isOpen.value) {
      e.preventDefault()
      search.close()
      return
    }

    // "Ctrl+K" / "Cmd+K" opens search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !search.isOpen.value) {
      e.preventDefault()
      search.open()
      return
    }

    // Navigation keys work when search is open (even when focused in search input)
    if (search.isOpen.value) {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        search.navigateUp()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        search.navigateDown()
        return
      }

      // Enter selects current result (only if there are results)
      if (e.key === 'Enter' && search.results.value.length > 0) {
        e.preventDefault()
        search.selectCurrent()
        return
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })
}
