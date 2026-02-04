<script setup lang="ts">
defineProps<{
  isOpen: boolean
  currentHash: string
  yourHash: string
}>()

const emit = defineEmits<{
  reload: []
  saveAsNew: []
  forceSave: []
  close: []
}>()
</script>

<template>
  <Modal :is-open="isOpen" title="File Conflict Detected" size="md" @close="emit('close')">
    <div class="conflict-content">
      <div class="conflict-warning">
        <span class="warning-icon" aria-hidden="true">⚠️</span>
        <p class="warning-text">
          The file has been modified by another source since you started editing.
          Your changes may overwrite recent updates.
        </p>
      </div>

      <div class="hash-info">
        <div class="hash-row">
          <span class="hash-label">Current file hash:</span>
          <code class="hash-value">{{ currentHash.substring(0, 8) }}</code>
        </div>
        <div class="hash-row">
          <span class="hash-label">Your version hash:</span>
          <code class="hash-value">{{ yourHash.substring(0, 8) }}</code>
        </div>
      </div>

      <p class="conflict-help">
        Choose how to proceed:
      </p>
    </div>

    <template #actions>
      <button class="conflict-button button-secondary" @click="emit('reload')">
        Reload
        <span class="button-hint">Discard your changes</span>
      </button>
      <button class="conflict-button button-secondary" @click="emit('saveAsNew')">
        Save As New
        <span class="button-hint">Keep both versions</span>
      </button>
      <button class="conflict-button button-danger" @click="emit('forceSave')">
        Force Save
        <span class="button-hint">Overwrite file</span>
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.conflict-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.conflict-warning {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
}

.warning-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.warning-text {
  margin: 0;
  color: var(--color-text-primary);
  line-height: 1.5;
  transition: color 0.2s ease;
}

.hash-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.hash-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.hash-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  transition: color 0.2s ease;
}

.hash-value {
  font-family: monospace;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-code-bg);
  border: 1px solid var(--color-border-secondary);
  border-radius: 4px;
  color: var(--color-text-primary);
  transition: all 0.2s ease;
}

.conflict-help {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  transition: color 0.2s ease;
}

.conflict-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
  min-width: 120px;
}

.button-secondary {
  background: var(--color-bg-primary);
  border-color: var(--color-border-secondary);
  color: var(--color-text-primary);
}

.button-secondary:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border);
}

.button-danger {
  background: #ef4444;
  color: white;
}

.button-danger:hover {
  background: #dc2626;
}

.button-hint {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.8;
}
</style>
