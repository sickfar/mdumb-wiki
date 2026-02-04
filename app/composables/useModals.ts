import { ref } from 'vue'

export interface DeleteTarget {
  path: string
  title: string
  isFolder: boolean
}

// Singleton state
const createFileOpen = ref(false)
const createFolderOpen = ref(false)
const deleteConfirmOpen = ref(false)
const currentPath = ref<string | undefined>(undefined)
const deleteTarget = ref<DeleteTarget | undefined>(undefined)

export const useModals = () => {
  const openCreateFile = (path?: string) => {
    currentPath.value = path
    createFileOpen.value = true
  }

  const openCreateFolder = (path?: string) => {
    currentPath.value = path
    createFolderOpen.value = true
  }

  const openDeleteConfirm = (target: DeleteTarget) => {
    deleteTarget.value = target
    deleteConfirmOpen.value = true
  }

  const closeAll = () => {
    createFileOpen.value = false
    createFolderOpen.value = false
    deleteConfirmOpen.value = false
    currentPath.value = undefined
    deleteTarget.value = undefined
  }

  return {
    // State
    createFileOpen,
    createFolderOpen,
    deleteConfirmOpen,
    currentPath,
    deleteTarget,

    // Actions
    openCreateFile,
    openCreateFolder,
    openDeleteConfirm,
    closeAll
  }
}
