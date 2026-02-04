<template>
  <div>
    <SearchModal />
    <CreateFileModal
      :is-open="modals.createFileOpen.value"
      :current-path="modals.currentPath.value"
      @close="handleModalClose"
      @created="handleFileCreated"
    />
    <CreateFolderModal
      :is-open="modals.createFolderOpen.value"
      :current-path="modals.currentPath.value"
      @close="handleModalClose"
      @created="handleFolderCreated"
    />
    <DeleteConfirmModal
      :is-open="modals.deleteConfirmOpen.value"
      :target="modals.deleteTarget.value"
      @close="handleModalClose"
      @deleted="handleFileDeleted"
    />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const modals = useModals()
const router = useRouter()
const route = useRoute()

const handleModalClose = () => {
  modals.closeAll()
}

const handleFileCreated = async (path: string) => {
  // Immediately refresh navigation for instant UI feedback
  await refreshNuxtData('navigation')

  // Navigate to edit page for the newly created file
  // Remove .md extension since the edit page expects slug without extension
  const pathWithoutExt = path.replace(/\.md$/, '')
  router.push(`/edit/${pathWithoutExt}`)
  modals.closeAll()
}

const handleFolderCreated = async (path: string) => {
  // Immediately refresh navigation for instant UI feedback
  await refreshNuxtData('navigation')

  // Navigate to the folder's index page
  router.push(`/${path}`)
  modals.closeAll()
}

const handleFileDeleted = async (deletedPath: string) => {
  // Immediately refresh navigation for instant UI feedback
  await refreshNuxtData('navigation')

  // Check if we're currently viewing the deleted file
  const currentPath = route.path.replace(/^\//, '').replace(/^edit\//, '')

  if (currentPath === deletedPath || currentPath.startsWith(deletedPath + '/')) {
    // Redirect to home if we deleted the current page or its parent folder
    router.push('/')
  }

  modals.closeAll()
}
</script>

<style>
/* Global styles */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#__nuxt {
  min-height: 100vh;
}

/* Theme CSS Custom Properties */
:root[data-theme="light"] {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f7fafc;
  --color-bg-tertiary: #edf2f7;
  --color-text-primary: #2d3748;
  --color-text-secondary: #4a5568;
  --color-text-tertiary: #718096;
  --color-border: #e2e8f0;
  --color-border-secondary: #cbd5e0;
  --color-accent: #3182ce;
  --color-accent-hover: #2c5282;
  --color-code-bg: #f7fafc;
  --color-pre-bg: #1a202c;
  --color-pre-text: #e2e8f0;
}

:root[data-theme="dark"] {
  --color-bg-primary: #1a202c;
  --color-bg-secondary: #2d3748;
  --color-bg-tertiary: #4a5568;
  --color-text-primary: #e2e8f0;
  --color-text-secondary: #cbd5e0;
  --color-text-tertiary: #a0aec0;
  --color-border: #4a5568;
  --color-border-secondary: #2d3748;
  --color-accent: #63b3ed;
  --color-accent-hover: #4299e1;
  --color-code-bg: #2d3748;
  --color-pre-bg: #0d1117;
  --color-pre-text: #c9d1d9;
}

/* Apply theme to body */
html,
body {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: background-color 0.2s ease, color 0.2s ease;
}
</style>
