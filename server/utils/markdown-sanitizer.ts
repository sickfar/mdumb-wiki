import type MarkdownIt from 'markdown-it'
import { loadConfig } from './config'

/**
 * Simple but effective HTML sanitizer plugin for markdown-it
 * Removes dangerous tags and attributes while preserving safe ones
 */
export async function markdownSanitizerPlugin(md: MarkdownIt): Promise<void> {
  const config = await loadConfig()

  if (!config.security.sanitizeHtml) {
    return
  }

  const allowedTags = new Set(config.security.allowedTags)
  const allowedAttrs = config.security.allowedAttributes

  // List of event handler attributes to always block
  const blockedEventAttrs = /^on\w+$/i

  // List of dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript):/i

  /**
   * Sanitize HTML attributes
   */
  function sanitizeAttributes(
    tagName: string,
    attrs: Array<[string, string]>
  ): Array<[string, string]> {
    const tagAllowedAttrs = allowedAttrs[tagName] || []
    const globalAttrs = allowedAttrs['*'] || []
    const permitted = new Set([...tagAllowedAttrs, ...globalAttrs])

    return attrs.filter(([name, value]) => {
      // Block event handlers
      if (blockedEventAttrs.test(name)) {
        return false
      }

      // Block dangerous protocols in href/src
      if ((name === 'href' || name === 'src') && dangerousProtocols.test(value)) {
        return false
      }

      // Only allow permitted attributes
      return permitted.has(name)
    })
  }

  // Store original renderers
  const defaultHtmlBlockRender =
    md.renderer.rules.html_block ||
    function (tokens, idx) {
      return tokens[idx].content
    }

  const defaultHtmlInlineRender =
    md.renderer.rules.html_inline ||
    function (tokens, idx) {
      return tokens[idx].content
    }

  // Override html_block renderer
  md.renderer.rules.html_block = function (tokens, idx, options, env, self) {
    const token = tokens[idx]
    const html = token.content

    // Remove the HTML content if it contains dangerous tags
    const sanitized = sanitizeHtml(html)

    // Return sanitized HTML or empty string
    return sanitized
  }

  // Override html_inline renderer
  md.renderer.rules.html_inline = function (tokens, idx, options, env, self) {
    const token = tokens[idx]
    const html = token.content

    // Remove the HTML content if it contains dangerous tags
    const sanitized = sanitizeHtml(html)

    // Return sanitized HTML or empty string
    return sanitized
  }

  /**
   * Sanitize HTML string
   */
  function sanitizeHtml(html: string): string {
    // Parse HTML tags and sanitize
    return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)\s*([^>]*)>/g, (match, tagName, attrs) => {
      const tag = tagName.toLowerCase()

      // Check if tag is allowed
      if (!allowedTags.has(tag)) {
        return '' // Remove disallowed tags
      }

      // Parse and sanitize attributes
      const attrPairs: Array<[string, string]> = []
      const attrRegex = /(\w+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*)))?/g
      let attrMatch

      while ((attrMatch = attrRegex.exec(attrs)) !== null) {
        const attrName = attrMatch[1]
        const attrValue = attrMatch[2] || attrMatch[3] || attrMatch[4] || ''
        attrPairs.push([attrName, attrValue])
      }

      // Sanitize attributes
      const sanitizedAttrs = sanitizeAttributes(tag, attrPairs)

      // Rebuild tag
      if (sanitizedAttrs.length === 0) {
        // Self-closing tag without attributes
        if (match.endsWith('/>')) {
          return `<${tag} />`
        }
        // Opening/closing tag without attributes
        return match.startsWith('</') ? `</${tag}>` : `<${tag}>`
      } else {
        // Tag with attributes
        const attrString = sanitizedAttrs
          .map(([name, value]) => `${name}="${value}"`)
          .join(' ')

        if (match.endsWith('/>')) {
          return `<${tag} ${attrString} />`
        }
        return match.startsWith('</') ? `</${tag}>` : `<${tag} ${attrString}>`
      }
    })
  }
}
