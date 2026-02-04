import { simpleGit, type SimpleGit, type StatusResult } from 'simple-git'
import { getLogger } from './logger'
import type { HealthStatus } from '~/types/wiki'

let gitInstance: SimpleGit | null = null
let currentPath: string | null = null
let lastSync: Date | null = null

function logger() {
  return getLogger()
}

/**
 * Initialize git instance for the wiki content directory
 */
export function initGit(contentPath: string): SimpleGit {
  if (gitInstance && currentPath === contentPath) {
    return gitInstance
  }

  logger().info({ contentPath }, 'Initializing git instance')
  gitInstance = simpleGit(contentPath)
  currentPath = contentPath

  return gitInstance
}

/**
 * Clear git instance (for testing)
 */
export function clearGitInstance(): void {
  gitInstance = null
  currentPath = null
  lastSync = null
}

/**
 * Check if there are uncommitted changes
 */
export async function checkForChanges(): Promise<boolean> {
  if (!gitInstance) {
    throw new Error('Git not initialized. Call initGit() first.')
  }

  try {
    const status: StatusResult = await gitInstance.status()
    const hasChanges = status.files.length > 0
    logger().debug({ hasChanges, fileCount: status.files.length }, 'Checked for git changes')
    return hasChanges
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger().error({ error: message }, 'Failed to check for git changes')
    return false
  }
}

/**
 * Get git status for health endpoint
 */
export async function getGitStatus(): Promise<HealthStatus['git']> {
  if (!gitInstance) {
    return {
      enabled: false,
      errors: ['Git not initialized']
    }
  }

  try {
    const status: StatusResult = await gitInstance.status()
    const log = await gitInstance.log({ maxCount: 1 })

    const upToDate = status.behind === 0 && status.ahead === 0
    lastSync = new Date()

    return {
      enabled: true,
      branch: status.current || 'unknown',
      lastCommit: log.latest?.hash || 'none',
      upToDate,
      lastSync,
      errors: []
    }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger().error({ error: message }, 'Failed to get git status')

    return {
      enabled: false,
      errors: [message]
    }
  }
}

/**
 * Commit all changes with message
 */
export async function commitChanges(message: string): Promise<void> {
  if (!gitInstance) {
    throw new Error('Git not initialized. Call initGit() first.')
  }

  try {
    logger().info({ message }, 'Committing changes')
    await gitInstance.add('.')
    await gitInstance.commit(message)
    lastSync = new Date()
    logger().info({ message }, 'Changes committed successfully')
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger().error({ error: errorMessage, message }, 'Failed to commit changes')
    throw error
  }
}

/**
 * Push changes to remote
 */
export async function pushChanges(): Promise<void> {
  if (!gitInstance) {
    throw new Error('Git not initialized. Call initGit() first.')
  }

  try {
    logger().info('Pushing changes to remote')
    await gitInstance.push()
    lastSync = new Date()
    logger().info('Changes pushed successfully')
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger().error({ error: errorMessage }, 'Failed to push changes')
    throw error
  }
}

/**
 * Handle merge conflicts with configurable strategy
 */
export async function handleConflict(strategy: 'rebase' | 'merge' | 'branch'): Promise<void> {
  if (!gitInstance) {
    throw new Error('Git not initialized. Call initGit() first.')
  }

  logger().info({ strategy }, 'Handling conflict with strategy')

  try {
    if (strategy === 'rebase') {
      logger().info('Attempting pull with rebase')
      await gitInstance.pull({ '--rebase': 'true' })
      await gitInstance.push()
      logger().info('Rebase and push successful')
    }
    else if (strategy === 'merge') {
      logger().info('Attempting pull with merge')
      await gitInstance.pull({ '--no-rebase': null })
      await gitInstance.push()
      logger().info('Merge and push successful')
    }
    else if (strategy === 'branch') {
      const branchName = `conflict-${Date.now()}`
      logger().info({ branchName }, 'Creating conflict branch')
      await gitInstance.checkout(['-b', branchName])
      await gitInstance.push('origin', branchName)
      logger().info({ branchName }, 'Pushed to conflict branch')
    }

    lastSync = new Date()
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger().error({ error: errorMessage, strategy }, 'Conflict resolution failed')
    throw error
  }
}

/**
 * Best-effort commit for shutdown (no throw)
 */
export async function commitPendingChanges(message: string): Promise<boolean> {
  if (!gitInstance) {
    logger().debug('Git not initialized, skipping pending changes commit')
    return false
  }

  try {
    const hasChanges = await checkForChanges()

    if (!hasChanges) {
      logger().debug('No pending changes to commit')
      return false
    }

    logger().info({ message }, 'Committing pending changes (best-effort)')
    await gitInstance.add('.')
    await gitInstance.commit(message)
    lastSync = new Date()
    logger().info('Pending changes committed successfully')
    return true
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger().warn({ error: errorMessage, message }, 'Failed to commit pending changes (best-effort)')
    return false
  }
}
