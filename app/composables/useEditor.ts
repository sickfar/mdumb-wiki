import { ref, computed, watch } from 'vue'
import { useDebounceFn, useIntervalFn } from '@vueuse/core'
import type { FileReadResult, FileWriteResult } from '~/server/utils/file-operations'

interface Draft {
  content: string
  savedAt: number
}

// Global shared state (singleton pattern)
const globalEditorState = {
  content: ref(''),
  originalContent: ref(''), // Store original content for comparison
  originalHash: ref<string | null>(null),
  isSaving: ref(false),
  lastSaved: ref<Date | null>(null),
  hasConflict: ref(false),
  isLoading: ref(false),
  error: ref<string | null>(null),
  currentPath: ref<string | null>(null),
  hasDraft: ref(false),
  draftContent: ref(''),
  draftTimestamp: ref(0),
  draftSavedAt: ref<Date | null>(null)
}

export function useEditor() {
  const {
    content,
    originalContent,
    originalHash,
    isSaving,
    lastSaved,
    hasConflict,
    isLoading,
    error,
    currentPath,
    hasDraft,
    draftContent,
    draftTimestamp,
    draftSavedAt
  } = globalEditorState

  // Computed: has unsaved changes (compare with original)
  const isDirty = computed(() => {
    return content.value !== originalContent.value
  })

  /**
   * Load a file from the API
   */
  const load = async (path: string) => {
    // Guard against empty or invalid paths
    if (!path || path.trim() === '') {
      error.value = 'Invalid file path'
      return
    }

    try {
      isLoading.value = true
      error.value = null
      currentPath.value = path

      const result = await $fetch<FileReadResult>(`/api/file?path=${encodeURIComponent(path)}`)

      if (result.exists) {
        content.value = result.content || ''
        originalContent.value = result.content || '' // Store original for dirty tracking
        originalHash.value = result.hash || null
      } else {
        // File doesn't exist yet (new file)
        content.value = ''
        originalContent.value = ''
        originalHash.value = null
      }

      // Check for draft after loading file
      checkForDraft(path)

      isLoading.value = false
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      error.value = `Failed to load file: ${errorMessage}`
      isLoading.value = false
    }
  }

  /**
   * Save the file to the API with conflict detection
   */
  const save = async (path: string): Promise<boolean> => {
    try {
      isSaving.value = true
      error.value = null
      hasConflict.value = false
      currentPath.value = path

      const result = await $fetch<FileWriteResult>('/api/file', {
        method: 'POST',
        body: {
          path,
          content: content.value,
          hash: originalHash.value
        }
      })

      if (result.success) {
        originalHash.value = result.newHash || null
        originalContent.value = content.value // Update original to match current (no longer dirty)
        lastSaved.value = new Date()

        // Clear draft after successful save
        clearDraft(path)
        hasDraft.value = false
        draftContent.value = ''
        draftTimestamp.value = 0

        isSaving.value = false
        return true
      } else if (result.conflict?.conflictDetected) {
        hasConflict.value = true
        error.value = 'File has been modified by another user'
        isSaving.value = false
        return false
      }

      isSaving.value = false
      return false
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      error.value = `Failed to save file: ${errorMessage}`
      isSaving.value = false
      return false
    }
  }

  /**
   * Save draft to localStorage (debounced)
   */
  const saveDraftToStorage = (path: string) => {
    if (!path || !content.value) return

    const draft: Draft = {
      content: content.value,
      savedAt: Date.now()
    }

    try {
      localStorage.setItem(`draft-${path}`, JSON.stringify(draft))
      draftSavedAt.value = new Date()
    } catch (err) {
      console.error('[Editor] Failed to save draft:', err)
    }
  }

  const debouncedSaveDraft = useDebounceFn((path: string) => {
    saveDraftToStorage(path)
  }, 10000)

  /**
   * Watch content changes to auto-save draft
   */
  watch(content, () => {
    if (currentPath.value) {
      debouncedSaveDraft(currentPath.value)
    }
  })

  /**
   * Check for existing draft in localStorage
   */
  const checkForDraft = (path: string) => {
    try {
      const draftJson = localStorage.getItem(`draft-${path}`)
      if (draftJson) {
        const draft: Draft = JSON.parse(draftJson)
        const age = Date.now() - draft.savedAt

        // Only show drafts less than 24 hours old
        if (age < 24 * 60 * 60 * 1000) {
          hasDraft.value = true
          draftContent.value = draft.content
          draftTimestamp.value = draft.savedAt
        } else {
          // Clean up old drafts
          clearDraft(path)
        }
      }
    } catch (err) {
      console.error('[Editor] Failed to check for draft:', err)
    }
  }

  /**
   * Restore draft from localStorage
   */
  const restoreFromDraft = () => {
    if (draftContent.value) {
      content.value = draftContent.value
      hasDraft.value = false
      draftContent.value = ''
      draftTimestamp.value = 0
    }
  }

  /**
   * Reject draft and clear from localStorage
   */
  const rejectDraft = (path: string) => {
    clearDraft(path)
    hasDraft.value = false
    draftContent.value = ''
    draftTimestamp.value = 0
  }

  /**
   * Clear draft from localStorage
   */
  const clearDraft = (path: string) => {
    try {
      localStorage.removeItem(`draft-${path}`)
    } catch (err) {
      console.error('[Editor] Failed to clear draft:', err)
    }
  }

  /**
   * Poll for external changes (conflict detection)
   */
  const checkForConflicts = async () => {
    // Guard against empty or invalid paths
    if (!currentPath.value || currentPath.value.trim() === '' || isSaving.value || !originalHash.value) {
      return
    }

    try {
      const result = await $fetch<FileReadResult>(`/api/file?path=${encodeURIComponent(currentPath.value)}`)

      if (result.exists && result.hash !== originalHash.value) {
        hasConflict.value = true
      }
    } catch (err) {
      console.error('[Editor] Failed to check for conflicts:', err)
    }
  }

  // Poll every 30 seconds for conflicts
  const { pause, resume } = useIntervalFn(checkForConflicts, 30000)

  // Start polling when a file is loaded
  watch([currentPath, isLoading], () => {
    if (currentPath.value && !isLoading.value) {
      resume()
    } else {
      pause()
    }
  })

  /**
   * Reset all editor state
   */
  const reset = () => {
    content.value = ''
    originalContent.value = ''
    originalHash.value = null
    isSaving.value = false
    lastSaved.value = null
    hasConflict.value = false
    isLoading.value = false
    error.value = null
    currentPath.value = null
    hasDraft.value = false
    draftContent.value = ''
    draftTimestamp.value = 0
    draftSavedAt.value = null
    pause()
  }

  return {
    // State
    content,
    originalHash,
    isSaving,
    lastSaved,
    hasConflict,
    isLoading,
    error,
    isDirty,
    hasDraft,
    draftContent,
    draftTimestamp,
    draftSavedAt,

    // Actions
    load,
    save,
    restoreFromDraft,
    rejectDraft,
    clearDraft,
    reset
  }
}
