<script setup lang="ts">
import type { NavigationItem, WikiPage } from '../../types/wiki'

const { data: navigation, error: navError } = await useFetch<NavigationItem[]>('/api/navigation', { key: 'navigation' })
const { data: page, error: pageError } = await useFetch<WikiPage>('/api/content/index')

const error = navError.value || pageError.value

// Check if index is missing (404) - show welcome placeholder instead of error
const isIndexMissing = computed(() => {
  if (!pageError.value) return false
  const err = pageError.value as { statusCode?: number }
  return err.statusCode === 404
})

const { showUpdateBanner, reload, dismiss } = useLiveReload()
</script>

<template>
  <div class="wiki-container">
    <UpdateBanner :show="showUpdateBanner" @reload="reload" @dismiss="dismiss" />
    <BurgerMenu />
    <SidebarBackdrop />
    <WikiSidebar v-if="navigation" :navigation="navigation" />
    <SkeletonSidebar v-else class="wiki-sidebar" />
    <main class="wiki-main">
      <WelcomePlaceholder v-if="isIndexMissing" />
      <div v-else-if="error" class="error-container">
        <h1>Error Loading Page</h1>
        <p>{{ error }}</p>
      </div>
      <WikiContent v-else-if="page" :page="page" />
      <SkeletonContent v-else />
    </main>
  </div>
</template>

<style scoped>
.wiki-container {
  display: flex;
  min-height: 100vh;
  overflow-x: hidden;
}

.wiki-main {
  flex: 1;
  padding: 2rem;
  max-width: 900px;
  min-width: 0;
}

@media (max-width: 768px) {
  .wiki-main {
    padding: 1rem;
  }
}

.error-container {
  color: #e53e3e;
  padding: 2rem;
  border: 1px solid #fc8181;
  border-radius: 0.5rem;
  background-color: #fff5f5;
}

/* Sidebar styles are in WikiSidebar.vue component - removed to avoid conflicts */
</style>
