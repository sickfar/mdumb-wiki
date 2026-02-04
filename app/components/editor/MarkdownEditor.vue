<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Note: Removed auto-resize to allow textarea to fill available height
// The textarea will now stretch to fill its container with flex: 1

// Handle toolbar insert
const handleInsert = (text: string) => {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = textarea.value.substring(start, end)

  let insertText = text
  let selectStart = 0
  let selectEnd = 0

  if (selectedText) {
    // Handle different formatting patterns when text is selected
    if (text.includes('**text**')) {
      // Bold: toggle bold markers
      if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length > 4) {
        // Remove bold markers
        insertText = selectedText.slice(2, -2)
        selectStart = 0
        selectEnd = insertText.length
      } else {
        // Add bold markers
        insertText = `**${selectedText}**`
        selectStart = 2
        selectEnd = 2 + selectedText.length
      }
    } else if (text === '*text*') {
      // Italic: toggle italic markers
      if (selectedText.startsWith('*') && selectedText.endsWith('*') &&
          !selectedText.startsWith('**') && !selectedText.endsWith('**') &&
          selectedText.length > 2) {
        // Remove italic markers
        insertText = selectedText.slice(1, -1)
        selectStart = 0
        selectEnd = insertText.length
      } else {
        // Add italic markers
        insertText = `*${selectedText}*`
        selectStart = 1
        selectEnd = 1 + selectedText.length
      }
    } else if (text.includes('[text](url)')) {
      // Link: use selection as link text, select URL for editing
      insertText = `[${selectedText}](url)`
      selectStart = insertText.indexOf('url')
      selectEnd = selectStart + 3
    } else if (text.includes('`code`')) {
      // Code: toggle code markers
      if (selectedText.startsWith('`') && selectedText.endsWith('`') && selectedText.length > 2) {
        // Remove code markers
        insertText = selectedText.slice(1, -1)
        selectStart = 0
        selectEnd = insertText.length
      } else {
        // Add code markers
        insertText = `\`${selectedText}\``
        selectStart = 1
        selectEnd = 1 + selectedText.length
      }
    } else {
      // Default: replace selection with text
      insertText = text
      selectEnd = insertText.length
    }
  } else {
    // No selection, insert placeholder and select it for easy replacement
    insertText = text
    if (text.includes('text')) {
      selectStart = text.indexOf('text')
      selectEnd = selectStart + 4
    } else if (text.includes('code')) {
      selectStart = text.indexOf('code')
      selectEnd = selectStart + 4
    } else if (text.includes('url')) {
      selectStart = text.indexOf('url')
      selectEnd = selectStart + 3
    } else {
      selectEnd = insertText.length
    }
  }

  // Focus the textarea first (required for execCommand)
  textarea.focus({ preventScroll: true })

  // Use execCommand to insert text (preserves undo stack)
  document.execCommand('insertText', false, insertText)

  // Set cursor/selection position
  nextTick(() => {
    const finalStart = start + selectStart
    const finalEnd = start + selectEnd
    textarea.setSelectionRange(finalStart, finalEnd)
  })
}
</script>

<template>
  <div class="markdown-editor">
    <EditorToolbar @insert="handleInsert" />
    <textarea
      ref="textareaRef"
      v-model="localValue"
      class="editor-textarea"
      :disabled="disabled"
      placeholder="Write your markdown here..."
      spellcheck="true"
    />
  </div>
</template>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-primary);
  transition: all 0.2s ease;
}

.markdown-editor:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.editor-textarea {
  flex: 1;
  padding: 1rem;
  border: none;
  outline: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9375rem;
  line-height: 1.6;
  resize: none;
  background: transparent;
  color: var(--color-text-primary);
  transition: color 0.2s ease;
  overflow-y: auto;
  min-height: 100%; /* Fill available height */
  height: 0; /* Allow flex to control height */
}

.editor-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.editor-textarea::placeholder {
  color: var(--color-text-tertiary);
  transition: color 0.2s ease;
}
</style>
