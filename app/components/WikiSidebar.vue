<script setup lang="ts">
import type { NavigationItem } from '../../types/wiki'

defineProps<{
  navigation: NavigationItem[]
}>()
</script>

<template>
  <aside class="wiki-sidebar">
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

.wiki-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
