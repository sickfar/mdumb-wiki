<script setup lang="ts">
import type { NavigationItem } from '../../types/wiki'

defineProps<{
  navigation: NavigationItem[]
}>()

const search = useSearch()
</script>

<template>
  <aside class="wiki-sidebar">
    <div class="sidebar-header">
      <h2 class="sidebar-title">MDumb Wiki</h2>
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
.wiki-sidebar {
  width: 280px;
  border-right: 1px solid #e2e8f0;
  background-color: #f7fafc;
  padding: 1.5rem 1rem;
  overflow-y: auto;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-header {
  margin-bottom: 1.5rem;
}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 1rem;
}

.search-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  color: #6b7280;
  font-size: 0.875rem;
}

.search-button:hover {
  border-color: #9ca3af;
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
  background: #f3f4f6;
  border-radius: 3px;
  border: 1px solid #d1d5db;
}

.wiki-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
