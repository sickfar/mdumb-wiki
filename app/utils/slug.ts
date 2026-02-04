/**
 * Converts a string to a URL-friendly slug
 * - Lowercases everything
 * - Replaces spaces and underscores with dashes
 * - Removes special characters except dashes
 * - Collapses multiple dashes into one
 * - Trims dashes from start/end
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')           // Replace spaces and underscores with dash
    .replace(/[^\w-]+/g, '')           // Remove all non-word chars except dash
    .replace(/--+/g, '-')              // Replace multiple dashes with single dash
    .replace(/^-+/, '')                // Trim dashes from start
    .replace(/-+$/, '')                // Trim dashes from end
}
