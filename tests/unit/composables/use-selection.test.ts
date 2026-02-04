import { describe, it, expect, beforeEach } from 'vitest'
import { useSelection } from '../../../app/composables/useSelection'

describe('useSelection', () => {
  beforeEach(() => {
    // Clear selection before each test
    const selection = useSelection()
    selection.clear()
  })

  describe('select', () => {
    it('should select an item', () => {
      const selection = useSelection()

      selection.select({
        slug: 'guides/getting-started',
        title: 'Getting Started',
        isFolder: false
      })

      expect(selection.selectedItem.value).toEqual({
        slug: 'guides/getting-started',
        title: 'Getting Started',
        isFolder: false
      })
    })

    it('should update selection when different item is selected', () => {
      const selection = useSelection()

      selection.select({
        slug: 'guides',
        title: 'Guides',
        isFolder: true
      })

      selection.select({
        slug: 'tutorials',
        title: 'Tutorials',
        isFolder: true
      })

      expect(selection.selectedItem.value).toEqual({
        slug: 'tutorials',
        title: 'Tutorials',
        isFolder: true
      })
    })
  })

  describe('clear', () => {
    it('should clear selected item', () => {
      const selection = useSelection()

      selection.select({
        slug: 'test',
        title: 'Test',
        isFolder: false
      })

      selection.clear()

      expect(selection.selectedItem.value).toBeUndefined()
    })
  })

  describe('getCreatePath', () => {
    it('should return undefined when nothing is selected', () => {
      const selection = useSelection()

      expect(selection.getCreatePath()).toBeUndefined()
    })

    it('should return folder path when folder is selected', () => {
      const selection = useSelection()

      selection.select({
        slug: 'guides',
        title: 'Guides',
        isFolder: true
      })

      // When folder is selected, create inside it
      expect(selection.getCreatePath()).toBe('guides')
    })

    it('should return nested folder path when nested folder is selected', () => {
      const selection = useSelection()

      selection.select({
        slug: 'guides/tutorials',
        title: 'Tutorials',
        isFolder: true
      })

      // When nested folder is selected, create inside it
      expect(selection.getCreatePath()).toBe('guides/tutorials')
    })

    it('should return parent folder path when file is selected', () => {
      const selection = useSelection()

      selection.select({
        slug: 'guides/getting-started',
        title: 'Getting Started',
        isFolder: false
      })

      // When file is selected, create at same level (in parent folder)
      expect(selection.getCreatePath()).toBe('guides')
    })

    it('should return undefined when root-level file is selected', () => {
      const selection = useSelection()

      selection.select({
        slug: 'readme',
        title: 'README',
        isFolder: false
      })

      // When root-level file is selected, create at root (undefined)
      expect(selection.getCreatePath()).toBeUndefined()
    })

    it('should return parent folder for deeply nested file', () => {
      const selection = useSelection()

      selection.select({
        slug: 'guides/advanced/optimization',
        title: 'Optimization',
        isFolder: false
      })

      // When deeply nested file is selected, return parent folder
      expect(selection.getCreatePath()).toBe('guides/advanced')
    })
  })

  describe('singleton behavior', () => {
    it('should share state across multiple instances', () => {
      const selection1 = useSelection()
      const selection2 = useSelection()

      selection1.select({
        slug: 'test',
        title: 'Test',
        isFolder: false
      })

      // Both instances should see the same selection
      expect(selection1.selectedItem.value).toEqual(selection2.selectedItem.value)
    })

    it('should clear from one instance affect other instance', () => {
      const selection1 = useSelection()
      const selection2 = useSelection()

      selection1.select({
        slug: 'test',
        title: 'Test',
        isFolder: false
      })

      selection2.clear()

      expect(selection1.selectedItem.value).toBeUndefined()
      expect(selection2.selectedItem.value).toBeUndefined()
    })
  })
})
