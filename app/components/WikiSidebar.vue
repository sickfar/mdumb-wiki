<script setup lang="ts">
import type { NavigationItem } from '../../types/wiki'

defineProps<{
  navigation: NavigationItem[]
}>()

const search = useSearch()
const theme = useTheme()
const { isOpen } = useMobileSidebar()
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

.wiki-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
