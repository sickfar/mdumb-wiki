import { promises as fs } from 'node:fs'
import { join, relative, basename } from 'node:path'
import matter from 'gray-matter'
import type { SearchIndexItem } from '../../types/wiki'

/**
 * Build search index from all markdown files in the wiki directory
 */
export async function buildSearchIndex(wikiPath: string): Promise<SearchIndexItem[]> {
  const items: SearchIndexItem[] = []

  try {
    await walkDirectory(wikiPath, wikiPath, items)
  } catch (error) {
    console.error('Error building search index:', error)
    return []
  }

  return items
}

/**
 * Recursively walk directory and collect markdown files
 */
async function walkDirectory(
  dirPath: string,
  basePath: string,
  items: SearchIndexItem[]
): Promise<void> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      // Skip hidden files and directories
      if (entry.name.startsWith('.')) {
        continue
      }

      const fullPath = join(dirPath, entry.name)

      if (entry.isDirectory()) {
        // Recursively walk subdirectories
        await walkDirectory(fullPath, basePath, items)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Process markdown file
        try {
          const indexItem = await processMarkdownFile(fullPath, basePath)
          items.push(indexItem)
        } catch (error) {
          console.error(`Error processing ${fullPath}:`, error)
          // Continue with other files
        }
      }
    }
  } catch (error) {
    console.error(`Error walking directory ${dirPath}:`, error)
  }
}

/**
 * Process a single markdown file and extract searchable data
 */
async function processMarkdownFile(
  filePath: string,
  basePath: string
): Promise<SearchIndexItem> {
  const content = await fs.readFile(filePath, 'utf-8')

  // Parse front-matter
  let frontMatter: Record<string, unknown> = {}
  let markdownContent = content

  try {
    const parsed = matter(content)
    frontMatter = parsed.data
    markdownContent = parsed.content
  } catch (error) {
    console.error(`Failed to parse front matter in ${filePath}:`, error)
  }

  // Extract title (from front-matter or filename)
  const title = frontMatter.title || basename(filePath, '.md')

  // Extract tags
  const tags = Array.isArray(frontMatter.tags) ? frontMatter.tags : []

  // Extract excerpt (first 200 chars of content, stripped of markdown)
  const excerpt = extractExcerpt(markdownContent)

  // Generate path (relative to wiki base, without .md extension)
  const relativePath = relative(basePath, filePath)
  const path = '/' + relativePath.replace(/\.md$/, '').replace(/\\/g, '/')

  return {
    title,
    path,
    tags,
    excerpt,
  }
}

/**
 * Extract excerpt from markdown content
 */
function extractExcerpt(content: string): string {
  // Remove markdown syntax (headers, links, etc.)
  let text = content
    .replace(/^#{1,6}\s+/gm, '') // Remove headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .trim()

  // Take first 200 characters
  if (text.length > 200) {
    text = text.substring(0, 200) + '...'
  }

  return text
}
