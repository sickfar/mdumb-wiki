export interface WikiConfig {
  /**
   * Path to the wiki content directory containing markdown files
   * @default './wiki'
   */
  contentPath: string

  /**
   * Port number for the development server
   * @default 3000
   */
  port: number

  /**
   * Host address for the development server
   * @default 'localhost'
   */
  host: string

  /**
   * Enable file watching for hot reload during development
   * @default true
   */
  watch: boolean

  /**
   * Log level for application logging
   * @default 'info'
   */
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

  /**
   * Custom title for the wiki
   * @default 'MDumb Wiki'
   */
  title: string

  /**
   * Custom description for the wiki
   */
  description?: string

  /**
   * Syntax highlighting theme for code blocks
   * @default 'github-dark'
   */
  syntaxTheme: string

  /**
   * Maximum number of concurrent file operations
   * @default 10
   */
  maxConcurrentOps: number

  /**
   * Cache time-to-live in milliseconds
   * @default 60000 (1 minute)
   */
  cacheTTL: number

  /**
   * Enable or disable caching
   * @default true
   */
  enableCache: boolean

  /**
   * Security configuration for HTML sanitization
   */
  security: {
    /**
     * Enable HTML sanitization to prevent XSS attacks
     * @default true
     */
    sanitizeHtml: boolean
    /**
     * Allowed HTML tags that won't be stripped
     */
    allowedTags: string[]
    /**
     * Allowed HTML attributes per tag
     */
    allowedAttributes: Record<string, string[]>
  }

  /**
   * Asset handling configuration
   */
  assets: {
    /**
     * File extensions allowed for serving as assets
     */
    allowedExtensions: string[]
    /**
     * Maximum file size in bytes (0 = unlimited)
     * @default 10485760 (10MB)
     */
    maxFileSize: number
    /**
     * Enable caching for asset responses
     * @default true
     */
    enableCache: boolean
    /**
     * Cache duration in seconds
     * @default 3600 (1 hour)
     */
    cacheDuration: number
  }
}

export type PartialWikiConfig = Partial<WikiConfig>
