<script setup lang="ts">
export interface ContextMenuItem {
  label: string
  icon?: string
  action: string
  danger?: boolean
}

const props = defineProps<{
  isOpen: boolean
  x: number
  y: number
  items: ContextMenuItem[]
}>()

const emit = defineEmits<{
  action: [action: string]
  close: []
}>()

const menuRef = ref<HTMLDivElement | null>(null)

// Handle click outside
const handleClickOutside = (e: MouseEvent) => {
  if (!menuRef.value) return
  if (!menuRef.value.contains(e.target as Node)) {
    emit('close')
  }
}

// Add/remove click listener
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      document.addEventListener('click', handleClickOutside)
    })
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleAction = (action: string) => {
  emit('action', action)
  emit('close')
}

// Position menu within viewport
const menuStyle = computed(() => {
  return {
    left: `${props.x}px`,
    top: `${props.y}px`
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="menuRef"
      class="context-menu"
      :style="menuStyle"
    >
      <button
        v-for="item in items"
        :key="item.action"
        :class="['context-menu-item', { 'item-danger': item.danger }]"
        @click="handleAction(item.action)"
      >
        <span v-if="item.icon" class="item-icon" aria-hidden="true">{{ item.icon }}</span>
        <span class="item-label">{{ item.label }}</span>
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.context-menu {
  position: fixed;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  padding: 0.5rem;
  min-width: 180px;
  z-index: 10001;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
  font-size: 0.9375rem;
}

.context-menu-item:hover {
  background: var(--color-bg-tertiary);
}

.context-menu-item.item-danger {
  color: #ef4444;
}

.context-menu-item.item-danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.item-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.item-label {
  flex: 1;
}
</style>
