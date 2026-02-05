<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const slug = computed(() => {
  const s = Array.isArray(route.params.slug) ? route.params.slug.join('/') : route.params.slug
  return s || 'index'
})

const filePath = computed(() => `${slug.value}.md`)

// Use actual composables
const editor = useEditor()
const { html: previewHtml } = useMarkdownPreview(computed(() => editor.content.value))

// Load file on mount
onMounted(async () => {
  await editor.load(filePath.value)
})

// Get live reload composable to suppress notifications after our own save
const liveReload = useLiveReload()

// Save file
const save = async () => {
  const success = await editor.save(filePath.value)
  if (success) {
    // Mark the save timestamp to suppress file watcher notifications
    liveReload.markSaved()

    // Clear the fetch cache for the content page before navigating
    await clearNuxtData(`/api/content/${slug.value}`)

    // Dismiss any pending live reload notifications since we're already loading fresh content
    liveReload.dismiss()

    // Navigate back to view mode (use canonical URL, strip /index or /README suffix)
    const viewPath = slug.value.replace(/\/(index|README)$/, '') || 'index'
    router.push(`/${viewPath}`)
  }
}

// Cancel editing
const cancel = () => {
  editor.reset()
  router.back()
}

// Keyboard shortcuts (including Ctrl+S)
const search = useSearch()
useKeyboardShortcuts(search, undefined, save)

// Draft restoration handlers
const handleRestoreDraft = () => {
  editor.restoreFromDraft()
}

const handleRejectDraft = () => {
  editor.rejectDraft(filePath.value)
}

// Insert frontmatter template
const insertFrontmatter = () => {
  const currentContent = editor.content.value

  // Check if frontmatter already exists
  if (currentContent.trim().startsWith('---')) {
    // Already has frontmatter, don't insert
    return
  }

  // Get the page title from the slug
  const title = slug.value.split('/').pop()?.replace(/-/g, ' ') || 'Untitled'
  const today = new Date().toISOString().split('T')[0]

  const frontmatterTemplate = `---
title: ${title}
date: ${today}
tags: []
---

`

  // Insert frontmatter at the beginning
  editor.content.value = frontmatterTemplate + currentContent
}
</script>

<template>
  <div class="edit-page">
    <LoadingSpinner v-if="editor.isLoading.value" />

    <div v-else-if="editor.error.value" class="error-container">
      <div class="error-box">
        <h2 class="error-title">Failed to Load File</h2>
        <p class="error-message">{{ editor.error.value }}</p>
        <button class="error-button" @click="cancel">
          Go Back
        </button>
      </div>
    </div>

    <div v-else class="editor-layout">
      <!-- Editor pane -->
      <div class="editor-pane">
        <MarkdownEditor
          v-model="editor.content.value"
          :disabled="editor.isSaving.value"
          @insert-frontmatter="insertFrontmatter"
        />
        <EditorFooter
          :char-count="editor.content.value.length"
          :is-dirty="editor.isDirty.value"
          :last-saved="editor.lastSaved.value"
          :draft-saved-at="editor.draftSavedAt.value"
        />
        <EditorActions
          :is-saving="editor.isSaving.value"
          :is-dirty="editor.isDirty.value"
          @save="save"
          @cancel="cancel"
        />
      </div>

      <!-- Preview pane -->
      <div class="preview-pane">
        <MarkdownPreview :html="previewHtml" />
      </div>
    </div>

    <!-- Draft restoration modal -->
    <DraftRestorationModal
      v-if="editor.hasDraft.value"
      :is-open="editor.hasDraft.value"
      :draft-content="editor.draftContent.value"
      :draft-timestamp="editor.draftTimestamp.value"
      @restore="handleRestoreDraft"
      @reject="handleRejectDraft"
    />

    <!-- Conflict resolution modal -->
    <ConflictResolutionModal
      v-if="editor.hasConflict.value"
      :is-open="editor.hasConflict.value"
      @reload="() => editor.load(filePath.value)"
      @force-save="save"
      @close="editor.hasConflict.value = false"
    />
  </div>
</template>

<style scoped>
.edit-page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  transition: background-color 0.2s ease;
}

.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.error-box {
  max-width: 500px;
  padding: 2rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  text-align: center;
  transition: all 0.2s ease;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 1rem 0;
  transition: color 0.2s ease;
}

.error-message {
  color: var(--color-text-secondary);
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
  transition: color 0.2s ease;
}

.error-button {
  padding: 0.75rem 1.5rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.error-button:hover {
  background: var(--color-accent-hover);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.editor-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  padding: 1.5rem;
  min-height: 100vh;
}

/* Responsive: stack vertically on mobile */
@media (max-width: 768px) {
  .editor-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
}

.editor-pane,
.preview-pane {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: calc(100vh - 3rem); /* Fill viewport height minus padding */
}

.editor-pane {
  position: sticky;
  top: 1.5rem;
}

@media (max-width: 768px) {
  .editor-pane {
    position: static;
  }
}
</style>
