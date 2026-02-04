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
const sidebar = useMobileSidebar()
useKeyboardShortcuts(search, sidebar)

const inputRef = ref<HTMLInputElement | null>(null)

watch(() => search.isOpen.value, (isOpen) => {
  if (isOpen && inputRef.value) {
    nextTick(() => {
      // Double-check ref exists after nextTick
      if (inputRef.value) {
        inputRef.value.focus()
      }
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
  background: var(--color-bg-primary);
  border-radius: 12px;
  width: 90%;
  max-width: 640px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  transition: background-color 0.2s ease;
}

.search-input-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  transition: border-color 0.2s ease;
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
  color: var(--color-text-primary);
  transition: color 0.2s ease;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
  transition: color 0.2s ease;
}

.search-loading {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-tertiary);
  transition: color 0.2s ease;
}

.search-results {
  max-height: 400px;
  overflow-y: auto;
}

.search-result-item {
  padding: 1rem 1.5rem;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  transition: background-color 0.15s, border-color 0.2s ease;
}

.search-result-item:hover,
.search-result-item.selected {
  background: var(--color-bg-tertiary);
}

.search-result-item.selected {
  border-left: 3px solid var(--color-accent);
}

.result-title {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
  transition: color 0.2s ease;
}

.result-path {
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
  margin-bottom: 0.5rem;
  font-family: monospace;
  transition: color 0.2s ease;
}

.result-excerpt {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  transition: color 0.2s ease;
}

.result-tags {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: var(--color-accent);
  color: white;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.no-results,
.search-hint {
  padding: 2.5rem;
  text-align: center;
  color: var(--color-text-tertiary);
  transition: color 0.2s ease;
}

.search-footer {
  border-top: 1px solid var(--color-border);
  padding: 0.75rem 1.5rem;
  background: var(--color-bg-secondary);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.shortcut-hints {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  flex-wrap: wrap;
  transition: color 0.2s ease;
}

.shortcut-hints kbd {
  font-family: monospace;
  background: var(--color-bg-primary);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  border: 1px solid var(--color-border-secondary);
  font-size: 0.6875rem;
  transition: all 0.15s;
}
</style>
