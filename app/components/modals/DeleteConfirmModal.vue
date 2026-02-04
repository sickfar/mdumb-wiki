<template>
  <Modal :is-open="isOpen" @close="handleClose">
    <div class="delete-confirm-modal">
      <div class="modal-icon danger">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
        </svg>
      </div>

      <h2>Delete {{ target?.isFolder ? 'Folder' : 'File' }}?</h2>

      <p class="warning-text">
        Are you sure you want to delete <strong>{{ target?.title }}</strong>?
        <template v-if="target?.isFolder">
          <br>
          <span class="danger-highlight">This will permanently delete the folder and all its contents.</span>
        </template>
        <br>
        This action cannot be undone.
      </p>

      <div class="modal-actions">
        <button type="button" class="btn-secondary" :disabled="isDeleting" @click="handleClose">
          Cancel
        </button>
        <button type="button" class="btn-danger" :disabled="isDeleting" @click="handleDelete">
          {{ isDeleting ? 'Deleting...' : 'Delete' }}
        </button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DeleteTarget } from '~/composables/useModals'

const props = defineProps<{
  isOpen: boolean
  target?: DeleteTarget
}>()

const emit = defineEmits<{
  close: []
  deleted: [path: string]
}>()

const { deleteFile } = useFileManagement()
const isDeleting = ref(false)
const error = ref<string | null>(null)

// Reset state when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    error.value = null
    isDeleting.value = false
  }
})

const handleClose = () => {
  if (!isDeleting.value) {
    emit('close')
  }
}

const handleDelete = async () => {
  if (!props.target || isDeleting.value) return

  isDeleting.value = true
  error.value = null

  try {
    await deleteFile(props.target.path)
    emit('deleted', props.target.path)
    emit('close')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete'
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.delete-confirm-modal {
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
}

.modal-icon.danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

h2 {
  margin: 0 0 1rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.warning-text {
  margin: 0 0 2rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.danger-highlight {
  color: #ef4444;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn-secondary,
.btn-danger {
  padding: 0.625rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.875rem;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border-color);
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-secondary:disabled,
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-radius: 6px;
  font-size: 0.875rem;
}
</style>
