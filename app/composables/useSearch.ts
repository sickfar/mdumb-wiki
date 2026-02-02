import Fuse from 'fuse.js'
import { useDebounceFn } from '@vueuse/core'
import type { SearchIndexItem } from '~/types/wiki'

// Global shared state (singleton pattern)
const globalSearchState = {
  index: ref<SearchIndexItem[]>([]),
  fuse: ref<Fuse<SearchIndexItem> | null>(null),
  query: ref(''),
  results: ref<SearchIndexItem[]>([]),
  isOpen: ref(false),
  selectedIndex: ref(0),
  isLoading: ref(true),
}

export function useSearch() {
  const { index, fuse, query, results, isOpen, selectedIndex, isLoading } = globalSearchState

  // Fetch search index on mount (only once globally)
  const loadIndex = async () => {
    // Skip if already loaded or loading
    if (fuse.value || isLoading.value === false) {
      return
    }

    try {
      isLoading.value = true
      const data = await $fetch<SearchIndexItem[]>('/api/search')
      index.value = data

      // Initialize Fuse.js
      fuse.value = new Fuse(data, {
        keys: [
          { name: 'title', weight: 0.4 },
          { name: 'path', weight: 0.2 },
          { name: 'tags', weight: 0.2 },
          { name: 'excerpt', weight: 0.2 },
        ],
        threshold: 0.3,
        minMatchCharLength: 2,
        includeMatches: true,
        includeScore: true,
      })

      isLoading.value = false
    } catch (error) {
      console.error('[Search] Failed to load search index:', error)
      isLoading.value = false
    }
  }

  // Debounced search function
  const performSearch = () => {
    if (!fuse.value || !query.value || query.value.length < 2) {
      results.value = []
      selectedIndex.value = 0
      return
    }

    const searchResults = fuse.value.search(query.value)
    results.value = searchResults.slice(0, 10).map(r => r.item)
    selectedIndex.value = 0
  }

  const debouncedSearch = useDebounceFn(performSearch, 150)

  // Watch query changes
  watch(query, () => {
    debouncedSearch()
  })

  const navigateUp = () => {
    if (selectedIndex.value > 0) {
      selectedIndex.value--
    }
  }

  const navigateDown = () => {
    if (selectedIndex.value < results.value.length - 1) {
      selectedIndex.value++
    }
  }

  const selectCurrent = () => {
    const selected = results.value[selectedIndex.value]
    if (selected) {
      navigateTo(selected.path)
      close()
    }
  }

  const open = () => {
    isOpen.value = true
    if (!fuse.value && !isLoading.value) {
      loadIndex()
    }
  }

  const close = () => {
    isOpen.value = false
    query.value = ''
    results.value = []
    selectedIndex.value = 0
  }

  // Load index on first mount
  onMounted(() => {
    loadIndex()
  })

  return {
    query,
    results,
    isOpen,
    selectedIndex,
    isLoading,
    open,
    close,
    navigateUp,
    navigateDown,
    selectCurrent,
  }
}
