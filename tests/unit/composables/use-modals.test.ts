import { describe, it, expect, beforeEach } from 'vitest'
import { useModals, type DeleteTarget } from '../../../app/composables/useModals'

describe('useModals', () => {
  beforeEach(() => {
    // Reset state between tests by closing all modals
    const modals = useModals()
    modals.closeAll()
  })

  describe('create file modal', () => {
    it('should open create file modal without path', () => {
      const modals = useModals()

      modals.openCreateFile()

      expect(modals.createFileOpen.value).toBe(true)
      expect(modals.currentPath.value).toBeUndefined()
    })

    it('should open create file modal with parent path', () => {
      const modals = useModals()

      modals.openCreateFile('guides')

      expect(modals.createFileOpen.value).toBe(true)
      expect(modals.currentPath.value).toBe('guides')
    })
  })

  describe('create folder modal', () => {
    it('should open create folder modal without path', () => {
      const modals = useModals()

      modals.openCreateFolder()

      expect(modals.createFolderOpen.value).toBe(true)
      expect(modals.currentPath.value).toBeUndefined()
    })

    it('should open create folder modal with parent path', () => {
      const modals = useModals()

      modals.openCreateFolder('guides')

      expect(modals.createFolderOpen.value).toBe(true)
      expect(modals.currentPath.value).toBe('guides')
    })
  })

  describe('delete confirmation modal', () => {
    it('should open delete modal for file', () => {
      const modals = useModals()
      const target: DeleteTarget = {
        path: 'test.md',
        title: 'Test File',
        isFolder: false
      }

      modals.openDeleteConfirm(target)

      expect(modals.deleteConfirmOpen.value).toBe(true)
      expect(modals.deleteTarget.value).toEqual(target)
    })

    it('should open delete modal for folder', () => {
      const modals = useModals()
      const target: DeleteTarget = {
        path: 'guides',
        title: 'Guides',
        isFolder: true
      }

      modals.openDeleteConfirm(target)

      expect(modals.deleteConfirmOpen.value).toBe(true)
      expect(modals.deleteTarget.value).toEqual(target)
    })
  })

  describe('closeAll', () => {
    it('should close all modals and reset state', () => {
      const modals = useModals()

      // Open multiple modals
      modals.openCreateFile('test')
      modals.openDeleteConfirm({
        path: 'test.md',
        title: 'Test',
        isFolder: false
      })

      modals.closeAll()

      expect(modals.createFileOpen.value).toBe(false)
      expect(modals.createFolderOpen.value).toBe(false)
      expect(modals.deleteConfirmOpen.value).toBe(false)
      expect(modals.currentPath.value).toBeUndefined()
      expect(modals.deleteTarget.value).toBeUndefined()
    })
  })

  describe('singleton behavior', () => {
    it('should share state across multiple instances', () => {
      const modals1 = useModals()
      const modals2 = useModals()

      modals1.openCreateFile('test')

      // Both instances should see the same state
      expect(modals1.createFileOpen.value).toBe(true)
      expect(modals2.createFileOpen.value).toBe(true)
      expect(modals1.currentPath.value).toBe('test')
      expect(modals2.currentPath.value).toBe('test')
    })

    it('should allow one instance to close modals opened by another', () => {
      const modals1 = useModals()
      const modals2 = useModals()

      modals1.openCreateFile('test')
      modals2.closeAll()

      expect(modals1.createFileOpen.value).toBe(false)
      expect(modals2.createFileOpen.value).toBe(false)
    })
  })
})
