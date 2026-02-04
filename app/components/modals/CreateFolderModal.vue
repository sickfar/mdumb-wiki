<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { slugify } from '~/utils/slug'

const props = defineProps<{
  isOpen: boolean
  currentPath?: string
}>()

const emit = defineEmits<{
  created: [path: string]
  close: []
}>()

const folderName = ref('')
const sluggedFolderName = ref('')
const createIndex = ref(true)
const isCreating = ref(false)
const error = ref<string | null>(null)
const folderExists = ref(false)

// Reactively update slug as user types
watch(folderName, (newName) => {
  if (newName) {
    sluggedFolderName.value = slugify(newName)
  } else {
    sluggedFolderName.value = ''
  }
})

// Validate folder name
const isValid = computed(() => {
  return sluggedFolderName.value.length > 0 && !folderExists.value
})

// Preview path
const previewPath = computed(() => {
  if (!sluggedFolderName.value) return ''
  const base = props.currentPath || ''
  return `${base}/${sluggedFolderName.value}/`.replace(/^\//, '')
})

// Check if folder exists
const checkFolderExists = async () => {
  if (!sluggedFolderName.value) {
    folderExists.value = false
    return
  }

  try {
    const path = previewPath.value
    const result = await $fetch<{ exists: boolean }>(`/api/file?path=${encodeURIComponent(path)}`)
    // The API returns { exists: true/false } rather than a 404
    folderExists.value = result.exists
  } catch (err) {
    // Network or other errors - assume folder might exist to be safe
    folderExists.value = false
  }
}

watch(sluggedFolderName, () => {
  checkFolderExists()
})

// Create folder
const handleCreate = async () => {
  if (!isValid.value) return

  isCreating.value = true
  error.value = null

  try {
    const path = previewPath.value

    await $fetch(`/api/folder`, {
      method: 'POST',
      body: {
        path
      }
    })

    // Create index.md if requested
    if (createIndex.value) {
      const indexPath = `${path}index.md`.replace(/\/+/g, '/')
      const content = `---\ntitle: ${folderName.value}\ndate: ${new Date().toISOString().split('T')[0]}\n---\n\n# ${folderName.value}\n\nWelcome to this section.\n`

      await $fetch(`/api/file`, {
        method: 'POST',
        body: {
          path: indexPath,
          content
        }
      })
    }

    emit('created', path)
    emit('close')

    // Reset form
    folderName.value = ''
    sluggedFolderName.value = ''
    createIndex.value = true
  } catch (err) {
    error.value = (err as { data?: { message?: string } }).data?.message || 'Failed to create folder'
  } finally {
    isCreating.value = false
  }
}

// Reset on close
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    folderName.value = ''
    sluggedFolderName.value = ''
    createIndex.value = true
    error.value = null
    folderExists.value = false
  }
})
</script>

<template>
  <Modal :is-open="isOpen" title="Create New Folder" size="md" @close="emit('close')">
    <div class="create-folder-content">
      <div class="form-group">
        <label for="foldername" class="form-label">Folder Name</label>
        <input
          id="foldername"
          v-model="folderName"
          type="text"
          class="form-input"
          placeholder="My New Section"
        >
      </div>

      <div class="form-group">
        <label class="form-label">Slug</label>
        <input
          v-model="sluggedFolderName"
          type="text"
          class="form-input"
          placeholder="my-new-section"
        >
      </div>

      <div class="preview-box">
        <div class="preview-label">Will create:</div>
        <code class="preview-path">{{ previewPath || '(enter a name)' }}</code>
      </div>

      <div v-if="folderExists" class="error-message">
        A folder already exists at this path
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input v-model="createIndex" type="checkbox">
          <span>Create index.md inside folder</span>
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
        <span v-else>Create Folder</span>
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.create-folder-content {
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
