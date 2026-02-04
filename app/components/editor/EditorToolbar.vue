<script setup lang="ts">
const emit = defineEmits<{
  insert: [text: string]
  insertFrontmatter: []
}>()

interface ToolbarButton {
  id: string
  label: string
  icon: string
  tooltip: string
  action: () => void
}

const buttons: ToolbarButton[] = [
  {
    id: 'bold',
    label: 'Bold',
    icon: '𝐁',
    tooltip: 'Bold (**text**)',
    action: () => emit('insert', '**text**')
  },
  {
    id: 'italic',
    label: 'Italic',
    icon: '𝐼',
    tooltip: 'Italic (*text*)',
    action: () => emit('insert', '*text*')
  },
  {
    id: 'link',
    label: 'Link',
    icon: '🔗',
    tooltip: 'Link ([text](url))',
    action: () => emit('insert', '[text](url)')
  },
  {
    id: 'code',
    label: 'Code',
    icon: '</>',
    tooltip: 'Inline code (`code`)',
    action: () => emit('insert', '`code`')
  },
  {
    id: 'list',
    label: 'List',
    icon: '≡',
    tooltip: 'List (- item)',
    action: () => emit('insert', '- ')
  },
  {
    id: 'frontmatter',
    label: 'Frontmatter',
    icon: '📋',
    tooltip: 'Insert frontmatter template (title, date, tags)',
    action: () => emit('insertFrontmatter')
  }
]
</script>

<template>
  <div class="editor-toolbar">
    <button
      v-for="button in buttons"
      :key="button.id"
      type="button"
      class="toolbar-button"
      :title="button.tooltip"
      :aria-label="button.label"
      @click.prevent="button.action"
    >
      <span class="toolbar-icon" aria-hidden="true">{{ button.icon }}</span>
    </button>
  </div>
</template>

<style scoped>
.editor-toolbar {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  transition: all 0.2s ease;
  flex-wrap: wrap;
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--color-text-primary);
  font-size: 1rem;
}

.toolbar-button:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-button:active {
  transform: translateY(0);
}

.toolbar-icon {
  display: block;
  line-height: 1;
}
</style>
