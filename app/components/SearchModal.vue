<template>
  <Teleport to="body">
    <div v-if="search.isOpen.value" class="search-modal-overlay" @click="search.close()">
      <div class="search-modal" @click.stop>
        <div class="search-input-container">
          <div class="search-icon">🔍</div>
          <input
            ref="inputRef"
            v-model="search.query.value"
            type="text"
            class="search-input"
            placeholder="Search pages... (↑↓ to navigate, Enter to select, Esc to close)"
          >
        </div>

        <div v-if="search.isLoading.value" class="search-loading">
          Loading search index...
        </div>

        <div v-else-if="search.results.value.length > 0" class="search-results">
          <div
            v-for="(result, index) in search.results.value"
            :key="result.path"
            :class="['search-result-item', { selected: index === search.selectedIndex.value }]"
            @click="navigateTo(result.path); search.close()"
          >
            <div class="result-title">{{ result.title }}</div>
            <div class="result-path">{{ result.path }}</div>
            <div class="result-excerpt">{{ result.excerpt }}</div>
            <div v-if="result.tags.length > 0" class="result-tags">
              <span v-for="tag in result.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
        </div>

        <div v-else-if="search.query.value.length >= 2" class="no-results">
          No results found for "{{ search.query.value }}"
        </div>

        <div v-else class="search-hint">
          Type at least 2 characters to search
        </div>

        <div class="search-footer">
          <div class="shortcut-hints">
            <span><kbd>/</kbd> to open</span>
            <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
            <span><kbd>Enter</kbd> to select</span>
            <span><kbd>Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const search = useSearch()
useKeyboardShortcuts(search)

const inputRef = ref<HTMLInputElement | null>(null)

watch(() => search.isOpen.value, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})
</script>

<style scoped>
.search-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  z-index: 10000;
  backdrop-filter: blur(2px);
}

.search-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 640px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.search-input-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.search-icon {
  font-size: 1.5rem;
}

.search-input {
  flex: 1;
  font-size: 1.125rem;
  border: none;
  outline: none;
  background: transparent;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-loading {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
}

.search-results {
  max-height: 400px;
  overflow-y: auto;
}

.search-result-item {
  padding: 1rem 1.5rem;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.15s;
}

.search-result-item:hover,
.search-result-item.selected {
  background: #f9fafb;
}

.search-result-item.selected {
  background: linear-gradient(90deg, #f0f9ff 0%, #f9fafb 100%);
  border-left: 3px solid #3b82f6;
}

.result-title {
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.result-path {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-family: monospace;
}

.result-excerpt {
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.5;
}

.result-tags {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 4px;
}

.no-results,
.search-hint {
  padding: 2.5rem;
  text-align: center;
  color: #6b7280;
}

.search-footer {
  border-top: 1px solid #e5e7eb;
  padding: 0.75rem 1.5rem;
  background: #f9fafb;
}

.shortcut-hints {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #6b7280;
  flex-wrap: wrap;
}

.shortcut-hints kbd {
  font-family: monospace;
  background: white;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  border: 1px solid #d1d5db;
  font-size: 0.6875rem;
}
</style>
