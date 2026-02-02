import MarkdownIt from 'markdown-it'
import Shiki from '@shikijs/markdown-it'
import { getHighlighter } from 'shiki'
import matter from 'gray-matter'
import type { WikiPage, FrontMatter } from '../../types/wiki'
import { loadConfig } from './config'
import { markdownLinkPlugin } from './markdown-link-plugin'
import { markdownSanitizerPlugin } from './markdown-sanitizer'

/**
 * Singleton markdown parser instance
 */
let markdownParser: MarkdownIt | null = null

/**
 * Promise to track parser initialization
 */
let parserInitPromise: Promise<MarkdownIt> | null = null

/**
 * Get or initialize the markdown parser with Shiki syntax highlighting
 * Uses singleton pattern to avoid re-initializing the parser
 * @returns Initialized MarkdownIt instance
 */
export async function getMarkdownParser(): Promise<MarkdownIt> {
  // Return existing parser if already initialized
  if (markdownParser) {
    return markdownParser
  }

  // If initialization is in progress, wait for it
  if (parserInitPromise) {
    return parserInitPromise
  }

  // Start initialization
  parserInitPromise = (async () => {
    // Load configuration to get theme preference
    const config = await loadConfig()
    const theme = config.syntaxTheme || 'github-light'

    // Initialize Shiki highlighter with supported languages
    const highlighter = await getHighlighter({
      themes: [theme],
      langs: [
        'javascript',
        'typescript',
        'python',
        'bash',
        'json',
        'yaml',
        'markdown',
        'html',
        'css',
        'sql',
        'go',
        'rust',
        'java',
        'c',
        'cpp',
        'csharp',
        'php',
        'ruby',
        'shell'
      ]
    })

    // Create markdown-it instance with Shiki
    const md = MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    })

    // Add Shiki syntax highlighting plugin
    md.use(
      await Shiki({
        highlighter,
        theme
      })
    )

    // Add link conversion plugin
    md.use(markdownLinkPlugin)

    // Add HTML sanitization plugin
    await markdownSanitizerPlugin(md)

    // Cache the parser
    markdownParser = md

    return md
  })()

  return parserInitPromise
}

/**
 * Parse markdown content with front matter
 * @param content - Raw markdown content
 * @param path - File path for the page
 * @returns Parsed WikiPage object
 */
export async function parseMarkdown(
  content: string,
  path: string
): Promise<WikiPage> {
  // Get the markdown parser (will initialize if needed)
  const md = await getMarkdownParser()

  // Parse front matter with error handling
  let frontMatter: FrontMatter = {}
  let markdownContent = content

  try {
    const parsed = matter(content)
    frontMatter = parsed.data as FrontMatter
    markdownContent = parsed.content
  } catch (error) {
    // If front matter parsing fails, treat entire content as markdown
    console.warn('Failed to parse front matter:', error)
    frontMatter = {}
    markdownContent = content
  }

  // Render markdown to HTML with environment context
  const env = { currentPath: path }
  const html = md.render(markdownContent, env)

  // Extract title from front matter or use default
  const title = frontMatter.title || 'Untitled'

  // Extract description from front matter
  const description = frontMatter.description

  // Create WikiPage object
  const wikiPage: WikiPage = {
    slug: path.replace(/\.md$/, '').replace(/^\//, ''),
    title,
    description,
    content: markdownContent,
    html,
    frontmatter: frontMatter,
    path,
    // These will be set by the file system watcher
    modifiedAt: new Date(),
    createdAt: new Date()
  }

  return wikiPage
}

/**
 * Reset the parser (useful for testing)
 * @internal
 */
export function resetParser(): void {
  markdownParser = null
  parserInitPromise = null
}
