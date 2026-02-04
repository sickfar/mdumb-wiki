import { ref, watch, type Ref, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import MarkdownIt from 'markdown-it'
import Shiki from '@shikijs/markdown-it'
import { createHighlighter } from 'shiki'

let md: MarkdownIt | null = null
let isInitializing = false

// Simple front-matter extraction (browser-compatible)
function extractFrontMatter(content: string): string {
  // Match YAML front-matter: content between --- delimiters at start of file
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n/
  const match = content.match(frontMatterRegex)

  if (match) {
    // Remove front-matter and return just the markdown body
    return content.slice(match[0].length)
  }

  // No front-matter found, return original content
  return content
}

// Initialize markdown-it with Shiki syntax highlighting (async)
async function initializeMarkdown() {
  if (md || isInitializing) return

  isInitializing = true

  try {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
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
        'vue',
        'jsx',
        'tsx',
        'sql',
        'rust',
        'go',
        'java',
        'c',
        'cpp',
        'csharp',
        'php'
      ]
    })

    md = new MarkdownIt({
      html: true, // Allow HTML tags (matches server config)
      linkify: true,
      typographer: true
    })

    md.use(
      await Shiki({
        highlighter,
        theme: 'github-dark'
      })
    )

    // Fix relative image/asset paths for preview mode
    // Transforms ./images/foo.png -> /images/foo.png (removes ./ and makes absolute)
    const defaultImageRender = md.renderer.rules.image || function(tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options)
    }

    md.renderer.rules.image = function(tokens, idx, options, env, self) {
      const token = tokens[idx]
      const srcIndex = token.attrIndex('src')

      if (srcIndex >= 0 && token.attrs) {
        let src = token.attrs[srcIndex][1]

        // Transform relative paths to absolute paths
        if (src.startsWith('./')) {
          src = src.substring(1) // Remove leading dot: ./images/foo.png -> /images/foo.png
        } else if (src.startsWith('../')) {
          // Handle parent directory references
          src = '/' + src.replace(/^(\.\.\/)+/, '')
        } else if (!src.startsWith('/') && !src.startsWith('http://') && !src.startsWith('https://')) {
          // Relative path without ./ prefix
          src = '/' + src
        }

        token.attrs[srcIndex][1] = src
      }

      return defaultImageRender(tokens, idx, options, env, self)
    }
  } catch (err) {
    console.error('[MarkdownPreview] Failed to initialize Shiki:', err)
    // Fallback to basic markdown-it without highlighting
    md = new MarkdownIt({
      html: true, // Allow HTML tags (matches server config)
      linkify: true,
      typographer: true
    })

    // Add image path fix to fallback too
    const defaultImageRender = md.renderer.rules.image || function(tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options)
    }

    md.renderer.rules.image = function(tokens, idx, options, env, self) {
      const token = tokens[idx]
      const srcIndex = token.attrIndex('src')

      if (srcIndex >= 0 && token.attrs) {
        let src = token.attrs[srcIndex][1]

        if (src.startsWith('./')) {
          src = src.substring(1)
        } else if (src.startsWith('../')) {
          src = '/' + src.replace(/^(\.\.\/)+/, '')
        } else if (!src.startsWith('/') && !src.startsWith('http://') && !src.startsWith('https://')) {
          src = '/' + src
        }

        token.attrs[srcIndex][1] = src
      }

      return defaultImageRender(tokens, idx, options, env, self)
    }
  }

  isInitializing = false
}

export function useMarkdownPreview(content: Ref<string>) {
  const html = ref('<p class="preview-loading">Loading preview...</p>')

  // Render markdown to HTML
  const render = () => {
    if (!md) {
      return // Still initializing
    }

    try {
      // Extract front-matter (YAML between --- delimiters)
      const markdownBody = extractFrontMatter(content.value)

      // Render only the markdown body (without front-matter)
      html.value = md.render(markdownBody)
    } catch (err) {
      console.error('[MarkdownPreview] Failed to render markdown:', err)
      html.value = '<p class="preview-error">Error rendering markdown</p>'
    }
  }

  // Debounced render function (300ms delay)
  const debouncedRender = useDebounceFn(render, 300)

  // Watch content changes
  watch(content, () => {
    debouncedRender()
  })

  // Initialize on mount (client-side only)
  onMounted(async () => {
    await initializeMarkdown()
    render() // Initial render after initialization
  })

  return {
    html
  }
}
