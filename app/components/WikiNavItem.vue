<script setup lang="ts">
import type { NavigationItem } from '../../types/wiki'
import type { ContextMenuItem } from './ContextMenu.vue'

const props = defineProps<{
  item: NavigationItem
}>()

const route = useRoute()
const router = useRouter()
const isOpen = ref(false)
const modals = useModals()
const { promoteToFolder } = useFileManagement()
const selection = useSelection()

// Context menu state
const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)

// Determine if this item is active (current page)
const isActive = computed(() => {
  const currentPath = route.path.replace(/^\//, '')
  return currentPath === props.item.slug || currentPath === props.item.slug + '/index'
})

// Auto-expand if this item or a child is active
const hasActiveChild = computed(() => {
  if (!props.item.children) return false

  const currentPath = route.path.replace(/^\//, '')
  return props.item.children.some(child =>
    currentPath.startsWith(child.slug)
  )
})

// Start expanded if active or has active child (client-side only to avoid hydration mismatch)
onMounted(() => {
  if (isActive.value || hasActiveChild.value) {
    isOpen.value = true
  }
})

// Handle right-click context menu
const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  contextMenuX.value = e.clientX
  contextMenuY.value = e.clientY
  showContextMenu.value = true
}

// Check if item is a folder (has children property, even if empty)
const isFolder = computed(() => props.item.children !== undefined)

// Handle item selection (for create file/folder buttons)
const handleSelect = () => {
  selection.select({
    slug: props.item.slug,
    title: props.item.title,
    isFolder: isFolder.value
  })
}

// Context menu items
const contextMenuItems = computed<ContextMenuItem[]>(() => {

  if (isFolder.value) {
    // Folder items
    return [
      { label: 'Edit', icon: '✏️', action: 'edit' },
      { label: 'Add Subpage', icon: '➕', action: 'add-subpage' },
      { label: 'Delete', icon: '🗑️', action: 'delete' }
    ]
  } else {
    // File items
    return [
      { label: 'Edit', icon: '✏️', action: 'edit' },
      { label: 'Promote to Folder', icon: '📁', action: 'promote' },
      { label: 'Delete', icon: '🗑️', action: 'delete' }
    ]
  }
})

// Handle context menu actions
const handleContextAction = async (action: string) => {
  switch (action) {
    case 'edit':
      navigateTo(`/edit/${props.item.slug}`)
      break
    case 'add-subpage':
      // Open CreateFileModal with currentPath set to this folder
      modals.openCreateFile(props.item.slug)
      break
    case 'promote':
      // Promote file to folder
      await handlePromote()
      break
    case 'delete':
      // Open delete confirmation modal
      // Only add .md extension for files, not folders
      modals.openDeleteConfirm({
        path: isFolder.value ? props.item.slug : `${props.item.slug}.md`,
        title: props.item.title,
        isFolder: isFolder.value
      })
      break
  }
}

// Handle promote to folder action
const handlePromote = async () => {
  const result = await promoteToFolder(`${props.item.slug}.md`)

  if (result.success) {
    // Immediately refresh navigation for instant UI feedback
    await refreshNuxtData('navigation')

    // Navigate to the new folder's index page
    router.push(`/${props.item.slug}`)
  } else {
    console.error('Failed to promote file:', result.error)
    // TODO: Show error notification
  }
}

const closeContextMenu = () => {
  showContextMenu.value = false
}
</script>

<template>
  <div class="nav-item">
    <!-- Folder (has children property, even if empty) -->
    <details v-if="item.children !== undefined" :open="isOpen" class="nav-folder">
      <summary class="nav-folder-title" @contextmenu="handleContextMenu">
        <span class="nav-folder-icon" @click.stop>▶</span>
        <NuxtLink
          :to="`/${item.slug}`"
          class="nav-folder-link"
          :class="{ 'nav-link-active': isActive }"
          @click="handleSelect"
          @click.stop
        >
          {{ item.title }}
        </NuxtLink>
      </summary>
      <div class="nav-folder-children">
        <WikiNavItem
          v-for="child in item.children"
          :key="child.slug"
          :item="child"
        />
      </div>
    </details>

    <!-- File/link -->
    <NuxtLink
      v-else
      :to="`/${item.slug}`"
      class="nav-link"
      :class="{ 'nav-link-active': isActive }"
      @click="handleSelect"
      @contextmenu="handleContextMenu"
    >
      {{ item.title }}
    </NuxtLink>

    <!-- Context menu -->
    <ContextMenu
      :is-open="showContextMenu"
      :x="contextMenuX"
      :y="contextMenuY"
      :items="contextMenuItems"
      @action="handleContextAction"
      @close="closeContextMenu"
    />
  </div>
</template>

<style scoped>
.nav-item {
  margin: 0;
}

.nav-folder {
  margin: 0;
}

.nav-folder-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  user-select: none;
  border-radius: 0.375rem;
  font-weight: 500;
  color: var(--color-text-primary);
  transition: background-color 0.15s ease, color 0.2s ease;
}

.nav-folder-title:hover {
  background-color: var(--color-bg-tertiary);
}

.nav-folder-link {
  flex: 1;
  color: inherit;
  text-decoration: none;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.15s ease;
}

.nav-folder-link:hover {
  color: var(--color-accent);
}

.nav-folder-icon {
  display: inline-block;
  font-size: 0.75rem;
  transition: transform 0.2s ease;
}

.nav-folder[open] .nav-folder-icon {
  transform: rotate(90deg);
}

.nav-folder-children {
  margin-left: 1rem;
  padding-left: 0.75rem;
  border-left: 1px solid var(--color-border);
  transition: border-color 0.2s ease;
}

.nav-link {
  display: block;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.15s ease;
}

.nav-link:hover {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.nav-link-active {
  background-color: var(--color-accent);
  color: white;
  font-weight: 500;
}

.nav-link-active:hover {
  background-color: var(--color-accent-hover);
}
</style>
