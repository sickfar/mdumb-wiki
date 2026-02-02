import type MarkdownIt from 'markdown-it'
import { resolveLinkPath } from './links'

/**
 * Markdown-it plugin to convert markdown links to Nuxt routes and images to asset paths
 * @param md - The markdown-it instance
 */
export function markdownLinkPlugin(md: MarkdownIt): void {
  // Store the original link_open renderer
  const defaultLinkRender =
    md.renderer.rules.link_open ||
    function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options)
    }

  // Store the original image renderer
  const defaultImageRender =
    md.renderer.rules.image ||
    function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options)
    }

  // List of asset extensions that should be served via /api/assets/
  const assetExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
    '.pdf', '.zip', '.tar.gz', '.mp4', '.webm'
  ]

  // Check if a path is an asset
  function isAssetLink(href: string): boolean {
    return assetExtensions.some(ext => href.toLowerCase().endsWith(ext))
  }

  // Override the link_open renderer
  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    const token = tokens[idx]

    // Get the href attribute index
    const hrefIndex = token.attrIndex('href')

    if (hrefIndex >= 0 && token.attrs) {
      const href = token.attrs[hrefIndex][1]

      // Only process local links (not external URLs or anchors)
      if (!href.match(/^https?:\/\//) && !href.startsWith('#')) {
        // Check if this is an asset link
        if (isAssetLink(href)) {
          // Convert asset links to /api/assets/ path
          let assetPath = href.replace(/^\.\//, '')
          assetPath = assetPath.replace(/^\//, '')
          token.attrs[hrefIndex][1] = `/api/assets/${assetPath}`
        } else {
          // Regular page links - resolve normally
          const currentPath = env.currentPath || ''
          const resolvedHref = resolveLinkPath(href, currentPath)
          token.attrs[hrefIndex][1] = resolvedHref
        }
      }
    }

    // Call the default renderer
    return defaultLinkRender(tokens, idx, options, env, self)
  }

  // Override the image renderer to use asset API
  md.renderer.rules.image = function (tokens, idx, options, env, self) {
    const token = tokens[idx]

    // Get the src attribute index
    const srcIndex = token.attrIndex('src')

    if (srcIndex >= 0 && token.attrs) {
      const src = token.attrs[srcIndex][1]

      // Only process local images (not external URLs)
      if (!src.match(/^https?:\/\//)) {
        // Remove leading ./ if present
        let imagePath = src.replace(/^\.\//, '')

        // If it's already pointing to /api/assets, leave it
        if (!imagePath.startsWith('/api/assets/')) {
          // Remove leading slash if present
          imagePath = imagePath.replace(/^\//, '')

          // Convert to asset API path
          const assetPath = `/api/assets/${imagePath}`
          token.attrs[srcIndex][1] = assetPath
        }
      }
    }

    // Call the default renderer
    return defaultImageRender(tokens, idx, options, env, self)
  }
}
