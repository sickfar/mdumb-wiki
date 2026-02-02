<script setup lang="ts">
import type { NavigationItem, WikiPage } from '../../types/wiki'

const { data: navigation, error: navError } = await useFetch<NavigationItem[]>('/api/navigation', { key: 'navigation' })
const { data: page, error: pageError } = await useFetch<WikiPage>('/api/content/index')

const error = navError.value || pageError.value

const { showUpdateBanner, reload, dismiss } = useLiveReload()
</script>

<template>
  <div class="wiki-container">
    <UpdateBanner :show="showUpdateBanner" @reload="reload" @dismiss="dismiss" />
    <BurgerMenu />
    <SidebarBackdrop />
    <WikiSidebar v-if="navigation" :navigation="navigation" />
    <main class="wiki-main">
      <div v-if="error" class="error-container">
        <h1>Error Loading Page</h1>
        <p>{{ error }}</p>
      </div>
      <WikiContent v-else-if="page" :page="page" />
      <div v-else class="loading">Loading...</div>
    </main>
  </div>
</template>

<style scoped>
.wiki-container {
  display: flex;
  min-height: 100vh;
}

.wiki-main {
  flex: 1;
  padding: 2rem;
  max-width: 900px;
}

.error-container {
  color: #e53e3e;
  padding: 2rem;
  border: 1px solid #fc8181;
  border-radius: 0.5rem;
  background-color: #fff5f5;
}

.loading {
  padding: 2rem;
  text-align: center;
  color: #718096;
}
</style>
