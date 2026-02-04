import { ref } from 'vue'

export interface SelectedItem {
  slug: string
  title: string
  isFolder: boolean
}

// Singleton state
const selectedItem = ref<SelectedItem | undefined>(undefined)

export const useSelection = () => {
  const select = (item: SelectedItem) => {
    selectedItem.value = item
  }

  const clear = () => {
    selectedItem.value = undefined
  }

  /**
   * Get the path where new items should be created
   * - If folder is selected: return folder path (create inside)
   * - If file is selected: return parent folder path (create at same level)
   * - If nothing selected: return undefined (create at root)
   */
  const getCreatePath = (): string | undefined => {
    if (!selectedItem.value) {
      return undefined
    }

    if (selectedItem.value.isFolder) {
      // Create inside the folder
      return selectedItem.value.slug
    } else {
      // Create at the same level as the file (in parent folder)
      const parts = selectedItem.value.slug.split('/')
      if (parts.length === 1) {
        // File is at root level
        return undefined
      }
      // Return parent folder path
      return parts.slice(0, -1).join('/')
    }
  }

  return {
    selectedItem,
    select,
    clear,
    getCreatePath
  }
}
