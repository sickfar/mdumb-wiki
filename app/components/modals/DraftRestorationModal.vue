<template>
  <Modal :is-open="isOpen" @close="handleReject">
    <div class="draft-restoration-modal">
      <div class="modal-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </div>

      <h2>Draft Available</h2>

      <p class="info-text">
        A draft was found for this page, saved
        <strong>{{ timeAgo }}</strong>.
        Would you like to restore it?
      </p>

      <div v-if="draftPreview" class="preview-section">
        <h3>Draft Preview:</h3>
        <div class="preview-content">
          {{ draftPreview }}
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn-secondary" @click="handleReject">
          Discard Draft
        </button>
        <button type="button" class="btn-primary" @click="handleRestore">
          Restore Draft
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isOpen: boolean
  draftContent: string
  draftTimestamp: number
}>()

const emit = defineEmits<{
  restore: []
  reject: []
}>()

// Calculate time ago
const timeAgo = computed(() => {
  const now = Date.now()
  const diff = now - props.draftTimestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
})

// Show first 200 characters of draft
const draftPreview = computed(() => {
  if (!props.draftContent) return ''
  const preview = props.draftContent.slice(0, 200)
  return props.draftContent.length > 200 ? `${preview}...` : preview
})

const handleRestore = () => {
  emit('restore')
}

const handleReject = () => {
  emit('reject')
}
</script>

<style scoped>
.draft-restoration-modal {
  text-align: center;
  padding: 1rem;
}

.modal-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(49, 130, 206, 0.1);
  color: var(--color-accent);
}

h2 {
  margin: 0 0 1rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.info-text {
  margin: 0 0 1.5rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.preview-section {
  margin: 0 0 2rem;
  text-align: left;
}

.preview-section h3 {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-content {
  padding: 1rem;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn-secondary,
.btn-primary {
  padding: 0.625rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.875rem;
}

.btn-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background: var(--color-border);
}

.btn-primary {
  background: var(--color-accent);
  color: white;
}

.btn-primary:hover {
  background: var(--color-accent-hover);
}
</style>
