import type { FileWriteResult, FolderCreateResult, FilePromoteResult } from '~/server/utils/file-operations'

interface OperationResult {
  success: boolean
  error: string | null
}

export function useFileManagement() {
  /**
   * Create a new file
   */
  const createFile = async (path: string, content: string): Promise<OperationResult> => {
    try {
      const result = await $fetch<FileWriteResult>('/api/file', {
        method: 'POST',
        body: {
          path,
          content,
          hash: null // New files have no hash
        }
      })

      if (result.success) {
        return { success: true, error: null }
      }

      return {
        success: false,
        error: 'Failed to create file'
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      return {
        success: false,
        error: `Failed to create file: ${errorMessage}`
      }
    }
  }

  /**
   * Create a new folder
   */
  const createFolder = async (path: string, createIndex: boolean): Promise<OperationResult> => {
    try {
      const result = await $fetch<FolderCreateResult>('/api/folder', {
        method: 'POST',
        body: {
          path,
          createIndex
        }
      })

      if (result.success) {
        return { success: true, error: null }
      }

      return {
        success: false,
        error: result.error || 'Failed to create folder'
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      return {
        success: false,
        error: `Failed to create folder: ${errorMessage}`
      }
    }
  }

  /**
   * Promote a file to a folder (convert file.md to folder/index.md)
   */
  const promoteToFolder = async (path: string): Promise<OperationResult> => {
    try {
      const result = await $fetch<FilePromoteResult>('/api/file/promote', {
        method: 'POST',
        body: {
          path
        }
      })

      if (result.success) {
        return { success: true, error: null }
      }

      return {
        success: false,
        error: result.error || 'Failed to promote file'
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      return {
        success: false,
        error: `Failed to promote file: ${errorMessage}`
      }
    }
  }

  return {
    createFile,
    createFolder,
    promoteToFolder
  }
}
