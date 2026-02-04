<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core'

const props = defineProps<{
  charCount: number
  isDirty: boolean
  lastSaved?: Date | null
  draftSavedAt?: Date | null
}>()

const timeAgo = computed(() => {
  if (!props.lastSaved) return null
  return useTimeAgo(props.lastSaved)
})

const draftTimeAgo = computed(() => {
  if (!props.draftSavedAt) return null
  return useTimeAgo(props.draftSavedAt)
})
</script>

<template>
  <div class="editor-footer">
    <div class="footer-left">
      <span class="char-count">{{ charCount }} characters</span>
      <span v-if="isDirty" class="unsaved-badge">Unsaved changes</span>
      <span v-if="draftSavedAt && isDirty" class="draft-saved">Draft saved: {{ draftTimeAgo }}</span>
    </div>
    <div v-if="lastSaved" class="footer-right">
      <span class="last-saved">Last saved: {{ timeAgo }}</span>
    </div>
  </div>
</template>

<style scoped>
.editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
  transition: all 0.2s ease;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.char-count {
  font-family: monospace;
}

.unsaved-badge {
  padding: 0.25rem 0.625rem;
  background: #f59e0b;
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.last-saved {
  font-style: italic;
}

.draft-saved {
  font-style: italic;
  color: var(--color-text-tertiary);
  font-size: 0.75rem;
}
</style>
