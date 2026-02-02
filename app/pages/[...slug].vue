<script setup lang="ts">
import type { NavigationItem, WikiPage } from '../../types/wiki'

const route = useRoute()
const slug = Array.isArray(route.params.slug)
  ? route.params.slug.join('/')
  : route.params.slug

const { data: navigation, error: navError } = await useFetch<NavigationItem[]>('/api/navigation', { key: 'navigation' })
const { data: page, error: pageError } = await useFetch<WikiPage>(`/api/content/${slug}`)

const error = navError.value || pageError.value
const notFound = pageError.value?.statusCode === 404

const { showUpdateBanner, reload, dismiss } = useLiveReload()
</script>

<template>
  <div class="wiki-container">
    <UpdateBanner :show="showUpdateBanner" @reload="reload" @dismiss="dismiss" />
    <BurgerMenu />
    <SidebarBackdrop />
    <WikiSidebar v-if="navigation" :navigation="navigation" />
    <main class="wiki-main">
      <div v-if="notFound" class="not-found">
        <h1>Page Not Found</h1>
        <p>The page "{{ slug }}" could not be found.</p>
        <NuxtLink to="/">Return to Home</NuxtLink>
      </div>
      <div v-else-if="error" class="error-container">
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

.error-container,
.not-found {
  color: #e53e3e;
  padding: 2rem;
  border: 1px solid #fc8181;
  border-radius: 0.5rem;
  background-color: #fff5f5;
}

.not-found {
  color: #2d3748;
  border-color: #cbd5e0;
  background-color: #f7fafc;
}

.not-found a {
  color: #3182ce;
  text-decoration: underline;
}

.not-found a:hover {
  color: #2c5282;
}

.loading {
  padding: 2rem;
  text-align: center;
  color: #718096;
}
</style>
