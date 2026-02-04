<script setup lang="ts">
import type { NavigationItem, WikiPage } from '../../types/wiki'

const route = useRoute()
const slug = Array.isArray(route.params.slug)
  ? route.params.slug.join('/')
  : route.params.slug

const { data: navigation, error: navError } = await useFetch<NavigationItem[]>('/api/navigation', { key: 'navigation' })
const { data: page, error: pageError } = await useFetch<WikiPage>(`/api/content/${slug}`)

const error = navError.value || pageError.value

// Check if this is a folder without index.md
const isFolder = computed(() => {
  return page.value && (page.value as any).isFolder === true
})

// Robust 404 detection - check multiple error structures
const notFound = computed(() => {
  const err = pageError.value
  if (!err) return false
  return err.statusCode === 404 ||
         err.data?.statusCode === 404 ||
         err.status === 404
})

const { showUpdateBanner, reload, dismiss } = useLiveReload()

// Handle creating index.md for folder
const modals = useModals()
const handleCreateIndex = () => {
  // Navigate to edit page to create index.md
  navigateTo(`/edit/${slug}/index`)
}
</script>

<template>
  <div class="wiki-container">
    <UpdateBanner :show="showUpdateBanner" @reload="reload" @dismiss="dismiss" />
    <BurgerMenu />
    <SidebarBackdrop />
    <WikiSidebar v-if="navigation" :navigation="navigation" />
    <SkeletonSidebar v-else class="wiki-sidebar" />
    <main class="wiki-main">
      <div v-if="isFolder" class="folder-stub">
        <div class="folder-icon">📁</div>
        <h1>{{ page.title }}</h1>
        <p class="folder-description">
          This folder doesn't have an index page yet.
        </p>

        <div v-if="page.files && page.files.length > 0" class="folder-files">
          <h2>Pages in this folder:</h2>
          <ul class="file-list">
            <li v-for="file in page.files" :key="file">
              <NuxtLink :to="`/${slug}/${file}`">
                📄 {{ file }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div class="folder-actions">
          <button class="create-index-button" @click="handleCreateIndex">
            ✏️ Create Index Page
          </button>
          <NuxtLink to="/" class="return-link">
            ← Return to Home
          </NuxtLink>
        </div>
      </div>
      <div v-else-if="notFound" class="not-found">
        <h1>Page Not Found</h1>
        <p>The page "{{ slug }}" could not be found.</p>
        <NuxtLink to="/">Return to Home</NuxtLink>
      </div>
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

.folder-stub {
  padding: 3rem 2rem;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.folder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: fadeIn 0.3s ease-in;
}

.folder-stub h1 {
  color: var(--color-text-primary);
  margin: 0 0 1rem 0;
  font-size: 2rem;
  text-transform: capitalize;
}

.folder-description {
  color: var(--color-text-secondary);
  font-size: 1.125rem;
  margin-bottom: 2rem;
}

.folder-files {
  text-align: left;
  margin: 2rem 0;
  padding: 1.5rem;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.folder-files h2 {
  color: var(--color-text-primary);
  font-size: 1rem;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.file-list li {
  margin: 0.5rem 0;
}

.file-list a {
  color: var(--color-accent);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.file-list a:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-accent-hover);
}

.folder-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  margin-top: 2rem;
}

.create-index-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-index-button:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.return-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.return-link:hover {
  color: var(--color-accent);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Sidebar styles are in WikiSidebar.vue component - removed to avoid conflicts */
</style>
