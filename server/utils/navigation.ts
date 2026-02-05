import fs from 'node:fs'
import path from 'node:path'
import type { NavigationItem } from '../../types/wiki'
import { isPathIgnored } from './ignore'

/**
 * Simple front matter parser
 * Extracts title from YAML front matter
 */
function extractTitle(content: string): string | null {
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontMatterMatch) {
    return null
  }

  const frontMatter = frontMatterMatch[1]
  const titleMatch = frontMatter.match(/^title:\s*(.+)$/m)

  if (titleMatch) {
    // Remove quotes if present
    return titleMatch[1].trim().replace(/^["']|["']$/g, '')
  }

  return null
}

/**
 * Build navigation tree from directory structure
 * @param rootPath - Root directory to scan
 * @param currentPath - Current relative path (used for recursion)
 * @param order - Starting order index (used for recursion)
 * @returns Array of NavigationItem objects
 */
export function buildNavigation(
  rootPath: string,
  currentPath: string = '',
  order: number = 0
): NavigationItem[] {
  // Verify that the directory exists
  if (!fs.existsSync(rootPath)) {
    throw new Error(`Directory does not exist: ${rootPath}`)
  }

  const fullPath = currentPath ? path.join(rootPath, currentPath) : rootPath

  // Check if path is a directory
  const stats = fs.statSync(fullPath)
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${fullPath}`)
  }

  // Read directory entries
  const entries = fs.readdirSync(fullPath, { withFileTypes: true })

  // Separate folders and files, skip hidden files
  const folders: fs.Dirent[] = []
  const files: fs.Dirent[] = []

  for (const entry of entries) {
    // Skip hidden files and directories (starting with .)
    if (entry.name.startsWith('.')) {
      continue
    }

    // Check if this entry should be ignored via .mdumbignore
    const entryRelativePath = currentPath
      ? `${currentPath}/${entry.name}`
      : entry.name
    if (isPathIgnored(entryRelativePath, entry.isDirectory(), rootPath)) {
      continue
    }

    if (entry.isDirectory()) {
      folders.push(entry)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(entry)
    }
  }

  // Sort folders and files alphabetically
  folders.sort((a, b) => a.name.localeCompare(b.name))
  files.sort((a, b) => a.name.localeCompare(b.name))

  const navigationItems: NavigationItem[] = []
  let currentOrder = order

  // Process folders first
  for (const folder of folders) {
    const folderPath = currentPath
      ? path.join(currentPath, folder.name)
      : folder.name
    const folderFullPath = path.join(fullPath, folder.name)

    // Check if folder has an index.md
    const indexPath = path.join(folderFullPath, 'index.md')
    const hasIndex = fs.existsSync(indexPath)
    let title = folder.name

    if (hasIndex) {
      // Extract title from index.md front matter
      try {
        const indexContent = fs.readFileSync(indexPath, 'utf-8')
        const extractedTitle = extractTitle(indexContent)
        if (extractedTitle) {
          title = extractedTitle
        }
      } catch {
        // If we can't read the index, use folder name
        console.error(`Error reading index.md for ${folderPath}:`, error)
      }
    }

    // Recursively build navigation for children
    const children = buildNavigation(rootPath, folderPath, 0)

    // Always show folders in navigation, even without index.md
    // This allows users to see and access folders without index pages
    const slug = folderPath.replace(/\\/g, '/')

    navigationItems.push({
      title,
      slug,
      order: currentOrder++,
      path: folderPath.replace(/\\/g, '/'),
      children
    })
  }

  // Process files
  for (const file of files) {
    const fileName = path.basename(file.name, '.md')
    const filePath = currentPath
      ? path.join(currentPath, file.name)
      : file.name
    const fileFullPath = path.join(fullPath, file.name)

    // Skip index.md files in subdirectories (they represent the folder itself)
    // But include index.md at the root level
    if (file.name === 'index.md' && currentPath !== '') {
      continue
    }

    let title = fileName

    // Extract title from front matter
    try {
      const fileContent = fs.readFileSync(fileFullPath, 'utf-8')
      const extractedTitle = extractTitle(fileContent)
      if (extractedTitle) {
        title = extractedTitle
      }
    } catch (error) {
      // If we can't read the file, use filename
      console.error(`Error reading file ${filePath}:`, error)
    }

    const slug = currentPath
      ? path.join(currentPath, fileName).replace(/\\/g, '/')
      : fileName

    navigationItems.push({
      title,
      slug,
      order: currentOrder++,
      path: filePath.replace(/\\/g, '/')
    })
  }

  return navigationItems
}
