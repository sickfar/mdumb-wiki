export interface FrontMatter {
  title?: string
  description?: string
  author?: string
  date?: string
  tags?: string[]
  [key: string]: unknown
}

export interface WikiPage {
  /**
   * Unique slug/path for the page
   */
  slug: string

  /**
   * Page title (from frontmatter or inferred from filename)
   */
  title: string

  /**
   * Page description from frontmatter
   */
  description?: string

  /**
   * Raw markdown content
   */
  content: string

  /**
   * Rendered HTML content
   */
  html: string

  /**
   * Parsed frontmatter data
   */
  frontmatter: FrontMatter

  /**
   * File path relative to content directory
   */
  path: string

  /**
   * Last modified timestamp
   */
  modifiedAt: Date

  /**
   * Created timestamp
   */
  createdAt: Date

  /**
   * Parent page slug (for hierarchical navigation)
   */
  parent?: string

  /**
   * Child page slugs
   */
  children?: string[]

  /**
   * Navigation order/weight
   */
  order?: number

  /**
   * Whether this represents a folder without index.md
   */
  isFolder?: boolean

  /**
   * List of files in the folder (for folder stubs)
   */
  files?: string[]
}

export interface NavigationItem {
  /**
   * Display title for navigation
   */
  title: string

  /**
   * Page slug/path
   */
  slug: string

  /**
   * Navigation order
   */
  order: number

  /**
   * Nested child navigation items
   */
  children?: NavigationItem[]

  /**
   * Parent slug
   */
  parent?: string

  /**
   * File path
   */
  path: string
}

export interface HealthStatus {
  /**
   * Overall health status
   */
  status: 'healthy' | 'degraded' | 'unhealthy'

  /**
   * Timestamp of health check
   */
  timestamp: Date

  /**
   * Number of pages loaded
   */
  pagesLoaded: number

  /**
   * Content path being watched
   */
  contentPath: string

  /**
   * Whether file watcher is active
   */
  watcherActive: boolean

  /**
   * Application uptime in milliseconds
   */
  uptime: number

  /**
   * Any error messages
   */
  errors?: string[]

  /**
   * Git sync status (if enabled)
   */
  git?: {
    /**
     * Whether git sync is enabled
     */
    enabled: boolean
    /**
     * Last sync timestamp
     */
    lastSync: Date | null
    /**
     * Whether working directory is clean
     */
    upToDate: boolean
    /**
     * Current branch name
     */
    branch: string
    /**
     * Last commit hash
     */
    lastCommit: string | null
    /**
     * Any git errors
     */
    errors?: string[]
  }
}

export interface SearchResult {
  /**
   * Page slug
   */
  slug: string

  /**
   * Page title
   */
  title: string

  /**
   * Matching excerpt with highlighting
   */
  excerpt: string

  /**
   * Search relevance score
   */
  score: number

  /**
   * Matched terms
   */
  matches: string[]
}

export interface SearchIndexItem {
  /**
   * Page title
   */
  title: string

  /**
   * Page path/slug
   */
  path: string

  /**
   * Tags from front-matter
   */
  tags: string[]

  /**
   * Content excerpt (first 200 chars)
   */
  excerpt: string
}
