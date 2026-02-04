<script setup lang="ts">
import { slugify } from '~/utils/slug'

const props = defineProps<{
  isOpen: boolean
  currentPath?: string
}>()

const emit = defineEmits<{
  created: [path: string]
  close: []
}>()

const filename = ref('')
const sluggedFilename = ref('')
const useTemplate = ref(false)
const isCreating = ref(false)
const error = ref<string | null>(null)
const fileExists = ref(false)

// Auto-slugify on blur
const handleBlur = () => {
  if (filename.value) {
    sluggedFilename.value = slugify(filename.value)
  }
}

// Validate filename
const isValid = computed(() => {
  return sluggedFilename.value.length > 0 && !fileExists.value
})

// Preview path
const previewPath = computed(() => {
  if (!sluggedFilename.value) return ''
  const base = props.currentPath || ''
  return `${base}/${sluggedFilename.value}.md`.replace(/^\//, '')
})

// Check if file exists
const checkFileExists = async () => {
  if (!sluggedFilename.value) {
    fileExists.value = false
    return
  }

  try {
    const path = previewPath.value
    await $fetch(`/api/file?path=${encodeURIComponent(path)}`, {
      method: 'HEAD'
    })
    fileExists.value = true
  } catch (err) {
    // 404 means file doesn't exist, which is good
    fileExists.value = (err as { statusCode?: number }).statusCode !== 404
  }
}

watch(sluggedFilename, () => {
  checkFileExists()
})

// Create file
const handleCreate = async () => {
  if (!isValid.value) return

  isCreating.value = true
  error.value = null

  try {
    const path = previewPath.value
    const content = useTemplate.value
      ? `---\ntitle: ${filename.value}\ndate: ${new Date().toISOString().split('T')[0]}\n---\n\n# ${filename.value}\n\nStart writing here...\n`
      : ''

    await $fetch(`/api/file`, {
      method: 'POST',
      body: {
        path,
        content
      }
    })

    emit('created', path)
    emit('close')

    // Reset form
    filename.value = ''
    sluggedFilename.value = ''
    useTemplate.value = false
  } catch (err) {
    error.value = (err as { data?: { message?: string } }).data?.message || 'Failed to create file'
  } finally {
    isCreating.value = false
  }
}

// Reset on close
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    filename.value = ''
    sluggedFilename.value = ''
    useTemplate.value = false
    error.value = null
    fileExists.value = false
  }
})
</script>

<template>
  <Modal :is-open="isOpen" title="Create New File" size="md" @close="emit('close')">
    <div class="create-file-content">
      <div class="form-group">
        <label for="filename" class="form-label">File Name</label>
        <input
          id="filename"
          v-model="filename"
          type="text"
          class="form-input"
          placeholder="My New Page"
          @blur="handleBlur"
          @keyup.enter="handleBlur"
        >
      </div>

      <div v-if="sluggedFilename" class="form-group">
        <label class="form-label">Slug</label>
        <input
          v-model="sluggedFilename"
          type="text"
          class="form-input"
          placeholder="my-new-page"
        >
      </div>

      <div v-if="previewPath" class="preview-box">
        <div class="preview-label">Will create:</div>
        <code class="preview-path">{{ previewPath }}</code>
      </div>

      <div v-if="fileExists" class="error-message">
        A file already exists at this path
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input v-model="useTemplate" type="checkbox">
          <span>Use basic template with frontmatter</span>
        </label>
      </div>
    </div>

    <template #actions>
      <button class="modal-button button-secondary" @click="emit('close')">
        Cancel
      </button>
      <button
        class="modal-button button-primary"
        :disabled="!isValid || isCreating"
        @click="handleCreate"
      >
        <LoadingSpinner v-if="isCreating" size="sm" />
        <span v-else>Create File</span>
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.create-file-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  transition: color 0.2s ease;
}

.form-input {
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-border-secondary);
  border-radius: 6px;
  font-size: 0.9375rem;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: all 0.15s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.preview-box {
  padding: 0.875rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.preview-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-tertiary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: color 0.2s ease;
}

.preview-path {
  font-family: monospace;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  word-break: break-all;
  transition: color 0.2s ease;
}

.error-message {
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #ef4444;
  font-size: 0.875rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  transition: color 0.2s ease;
}

.checkbox-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.modal-button {
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

.modal-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-secondary {
  background: var(--color-bg-primary);
  border-color: var(--color-border-secondary);
  color: var(--color-text-primary);
}

.button-secondary:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border);
}

.button-primary {
  background: var(--color-accent);
  color: white;
}

.button-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
