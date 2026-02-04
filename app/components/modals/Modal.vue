<script setup lang="ts">
const props = withDefaults(defineProps<{
  isOpen: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg'
}>(), {
  title: undefined,
  size: 'md'
})

const emit = defineEmits<{
  close: []
}>()

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

const handleBackdropClick = () => {
  emit('close')
}

// Add/remove escape listener
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    window.addEventListener('keydown', handleEscape)
  } else {
    window.removeEventListener('keydown', handleEscape)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape)
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'modal-sm'
    case 'lg':
      return 'modal-lg'
    default:
      return 'modal-md'
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="modal-overlay" @click="handleBackdropClick">
        <Transition name="modal-slide">
          <div v-if="isOpen" :class="['modal-container', sizeClass]" @click.stop>
            <div v-if="title" class="modal-header">
              <h2 class="modal-title">{{ title }}</h2>
              <button class="modal-close" aria-label="Close" @click="emit('close')">
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div class="modal-body">
              <slot />
            </div>

            <div v-if="$slots.actions" class="modal-footer">
              <slot name="actions" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(2px);
  padding: 1rem;
}

.modal-container {
  background: var(--color-bg-primary);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: background-color 0.2s ease;
}

.modal-sm {
  max-width: 400px;
}

.modal-md {
  max-width: 600px;
}

.modal-lg {
  max-width: 900px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  transition: border-color 0.2s ease;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  transition: color 0.2s ease;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 2rem;
  line-height: 1;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.15s;
}

.modal-close:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  transition: border-color 0.2s ease;
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-slide-enter-from,
.modal-slide-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
