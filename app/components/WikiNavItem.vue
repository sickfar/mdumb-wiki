<script setup lang="ts">
import type { NavigationItem } from '../../types/wiki'
import { ref } from 'vue'

const props = defineProps<{
  item: NavigationItem
}>()

const route = useRoute()
const isOpen = ref(false)

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

// Start expanded if active or has active child
if (isActive.value || hasActiveChild.value) {
  isOpen.value = true
}
</script>

<template>
  <div class="nav-item">
    <!-- Folder with children -->
    <details v-if="item.children && item.children.length > 0" :open="isOpen" class="nav-folder">
      <summary class="nav-folder-title">
        <span class="nav-folder-icon" @click.stop>▶</span>
        <NuxtLink
          :to="`/${item.slug}`"
          class="nav-folder-link"
          :class="{ 'nav-link-active': isActive }"
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
    >
      {{ item.title }}
    </NuxtLink>
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
  color: #2d3748;
  transition: background-color 0.15s ease;
}

.nav-folder-title:hover {
  background-color: #e2e8f0;
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
  color: #3182ce;
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
  border-left: 1px solid #e2e8f0;
}

.nav-link {
  display: block;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  color: #4a5568;
  text-decoration: none;
  transition: all 0.15s ease;
}

.nav-link:hover {
  background-color: #e2e8f0;
  color: #2d3748;
}

.nav-link-active {
  background-color: #3182ce;
  color: white;
  font-weight: 500;
}

.nav-link-active:hover {
  background-color: #2c5282;
}
</style>
