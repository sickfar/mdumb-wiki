/**
 * Convert text to URL-safe slug
 * - Converts to lowercase
 * - Replaces spaces with dashes
 * - Removes special characters except dash and underscore
 * - Collapses multiple dashes
 * - Trims leading/trailing dashes
 *
 * @param text - Input text to slugify
 * @returns URL-safe slug string
 *
 * @example
 * slugify('My Page!') // 'my-page'
 * slugify('Hello World') // 'hello-world'
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces with dashes
    .replace(/\s+/g, '-')
    // Remove all characters except alphanumeric, dash, and underscore
    .replace(/[^a-z0-9\-_]/g, '')
    // Collapse multiple dashes into one
    .replace(/-+/g, '-')
    // Remove leading and trailing dashes
    .replace(/^-+|-+$/g, '')
}
