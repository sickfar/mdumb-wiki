<script setup lang="ts">
import type { NavigationItem } from '../../types/wiki'

defineProps<{
  navigation: NavigationItem[]
}>()

const search = useSearch()
const theme = useTheme()
const { isOpen } = useMobileSidebar()
const modals = useModals()
const selection = useSelection()

// Handle create file/folder - use selected item's context
const handleCreateFile = () => {
  modals.openCreateFile(selection.getCreatePath())
}

const handleCreateFolder = () => {
  modals.openCreateFolder(selection.getCreatePath())
}
</script>

<template>
  <aside
    class="wiki-sidebar"
    :class="{ 'sidebar-open': isOpen }"
  >
    <div class="sidebar-header">
      <h2 class="sidebar-title">MDumb Wiki</h2>
      <button
        class="theme-toggle"
        :title="`Theme: ${theme.theme}`"
        aria-label="Toggle theme"
        @click="theme.toggle()"
      >
        <span v-if="theme.resolvedTheme === 'light'" aria-hidden="true">🌙</span>
        <span v-else aria-hidden="true">☀️</span>
      </button>
      <button class="search-button" title="Search (/)" @click="search.open()">
        <span class="search-icon">🔍</span>
        <span class="search-text">Search</span>
        <kbd class="search-kbd">/</kbd>
      </button>
      <div class="action-buttons">
        <button class="action-button" title="New File" @click="handleCreateFile">
          <span class="action-icon">📄</span>
          <span class="action-text">New File</span>
        </button>
        <button class="action-button" title="New Folder" @click="handleCreateFolder">
          <span class="action-icon">📁</span>
          <span class="action-text">New Folder</span>
        </button>
      </div>
    </div>
    <nav class="wiki-nav">
      <WikiNavItem
        v-for="item in navigation"
        :key="item.slug"
        :item="item"
      />
    </nav>
  </aside>
</template>

<style scoped>
/* Mobile-first: sidebar hidden by default on small screens */
.wiki-sidebar {
  width: 280px;
  border-right: 1px solid var(--color-border);
  background-color: var(--color-bg-secondary);
  padding: 1.5rem 1rem;
  overflow-y: auto;
  height: 100vh;
  transition: transform 0.3s ease-in-out, background-color 0.2s ease, border-color 0.2s ease;

  /* Mobile default: fixed, off-screen */
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
  transform: translateX(-100%);
}

/* When open on mobile, slide in */
.wiki-sidebar.sidebar-open {
  transform: translateX(0);
}

/* Desktop: always visible, sticky, ignore mobile classes */
@media (min-width: 768px) {
  .wiki-sidebar {
    position: sticky;
    top: 0;
    transform: translateX(0) !important;
    z-index: 10;
  }
}

.sidebar-header {
  margin-bottom: 1.5rem;
}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
  transition: color 0.2s ease;
}

.theme-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
}

.theme-toggle:hover {
  border-color: var(--color-accent);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}

.search-button:hover {
  border-color: var(--color-accent);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-icon {
  font-size: 1rem;
}

.search-text {
  flex: 1;
  text-align: left;
}

.search-kbd {
  font-family: monospace;
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  background: var(--color-bg-tertiary);
  border-radius: 3px;
  border: 1px solid var(--color-border-secondary);
  transition: all 0.15s;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.625rem 0.5rem;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.action-button:hover {
  border-color: var(--color-accent);
  background: var(--color-bg-tertiary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.action-icon {
  font-size: 1.25rem;
}

.action-text {
  font-weight: 500;
  white-space: nowrap;
}

.wiki-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
