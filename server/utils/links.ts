import { join, dirname, normalize } from 'path'

/**
 * Check if a link is an external URL
 * @param href - The link href
 * @returns True if the link is external
 */
export function isExternalLink(href: string): boolean {
  // Match protocol at the start: http://, https://, mailto:, ftp://, etc.
  return /^[a-z][a-z0-9+.-]*:/i.test(href)
}

/**
 * Check if a link is an anchor-only link (starts with #)
 * @param href - The link href
 * @returns True if the link is an anchor
 */
export function isAnchorLink(href: string): boolean {
  return href.startsWith('#')
}

/**
 * Resolve a link path from markdown to a Nuxt route
 * @param linkHref - The href from the markdown link
 * @param currentPath - The current markdown file path
 * @returns Resolved route path
 */
export function resolveLinkPath(linkHref: string, currentPath: string): string {
  // Preserve external links and anchors unchanged
  if (isExternalLink(linkHref) || isAnchorLink(linkHref)) {
    return linkHref
  }

  // Split anchor from the path if present
  const [pathPart, anchorPart] = linkHref.split('#')

  let resolvedPath: string

  if (pathPart.startsWith('/')) {
    // Absolute path from wiki root
    resolvedPath = pathPart
  } else {
    // Relative path - resolve relative to current file's directory
    const currentDir = dirname(currentPath)
    resolvedPath = join('/', currentDir, pathPart)
  }

  // Normalize the path (remove .., ., multiple slashes)
  resolvedPath = normalize(resolvedPath).replace(/\\/g, '/')

  // Remove .md extension if present
  if (resolvedPath.endsWith('.md')) {
    resolvedPath = resolvedPath.slice(0, -3)
  }

  // Handle index.md by using parent directory
  // But only if it's specifically index (not other files ending with 'index')
  if (resolvedPath === '/index' || resolvedPath.endsWith('/index')) {
    // Remove '/index' suffix, but keep at least '/'
    resolvedPath = resolvedPath.slice(0, -6) || '/'
    // Ensure we don't end up with empty string
    if (!resolvedPath) {
      resolvedPath = '/'
    }
  }

  // Ensure path starts with /
  if (!resolvedPath.startsWith('/')) {
    resolvedPath = '/' + resolvedPath
  }

  // Re-attach anchor if present
  if (anchorPart) {
    resolvedPath += '#' + anchorPart
  }

  return resolvedPath
}
