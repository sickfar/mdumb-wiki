<script setup lang="ts">
defineProps<{
  html: string
}>()
</script>

<template>
  <div class="markdown-preview">
    <div class="preview-header">
      <h3 class="preview-title">Preview</h3>
    </div>
    <div class="preview-content">
      <div class="markdown-body" v-html="html" />
    </div>
  </div>
</template>

<style scoped>
.markdown-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-primary);
  transition: all 0.2s ease;
}

.preview-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  transition: all 0.2s ease;
}

.preview-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  transition: color 0.2s ease;
}

.preview-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.markdown-body {
  /* Inherits styles from existing WikiContent.vue markdown-body class */
  max-width: 100%;
}

/* Make links non-clickable in preview */
.markdown-body :deep(a) {
  pointer-events: none;
  cursor: default;
  opacity: 0.7;
  position: relative;
}

/* Add visual indicator that links are disabled */
.markdown-body :deep(a:hover::after) {
  content: '(preview only)';
  position: absolute;
  bottom: 100%;
  left: 0;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  margin-bottom: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}
</style>
