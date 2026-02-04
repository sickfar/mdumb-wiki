<script setup lang="ts">
defineProps<{
  isSaving: boolean
  isDirty: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  save: []
  cancel: []
}>()
</script>

<template>
  <div class="editor-actions">
    <div class="actions-left">
      <span class="keyboard-hint">
        <kbd>Ctrl</kbd>+<kbd>S</kbd> to save
      </span>
    </div>
    <div class="actions-right">
      <button
        type="button"
        class="action-button action-cancel"
        :disabled="disabled"
        @click.prevent="emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="button"
        class="action-button action-save"
        :disabled="disabled || isSaving || !isDirty"
        @click.prevent="emit('save')"
      >
        <LoadingSpinner v-if="isSaving" size="sm" />
        <span v-else>Save</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.editor-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  transition: all 0.2s ease;
  flex-wrap: wrap;
  gap: 1rem;
}

.actions-left,
.actions-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.keyboard-hint {
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
  transition: color 0.2s ease;
}

.keyboard-hint kbd {
  font-family: monospace;
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  background: var(--color-bg-tertiary);
  border-radius: 3px;
  border: 1px solid var(--color-border-secondary);
  transition: all 0.15s;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
  min-width: 100px;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-cancel {
  background: var(--color-bg-primary);
  border-color: var(--color-border-secondary);
  color: var(--color-text-primary);
}

.action-cancel:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border);
}

.action-save {
  background: var(--color-accent);
  color: white;
}

.action-save:hover:not(:disabled) {
  background: var(--color-accent-hover);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
