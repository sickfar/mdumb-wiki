import { buildSearchIndex } from '../utils/search-index'
import { loadConfig } from '../utils/config'
import type { SearchIndexItem } from '../../types/wiki'

// Cache for search index
let searchIndexCache: SearchIndexItem[] | null = null

/**
 * Search API endpoint
 * Returns pre-built search index for client-side fuzzy search
 */
export default defineEventHandler(async () => {
  // Return cached index if available
  if (searchIndexCache) {
    return searchIndexCache
  }

  // Build index
  const config = await loadConfig()
  searchIndexCache = await buildSearchIndex(config.contentPath)

  return searchIndexCache
})

/**
 * Invalidate search cache (called when files change)
 */
export function invalidateSearchCache(): void {
  searchIndexCache = null
}
