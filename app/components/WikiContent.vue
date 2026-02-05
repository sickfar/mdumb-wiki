<script setup lang="ts">
import type { WikiPage } from '../../types/wiki'

const _props = defineProps<{
  page: WikiPage
}>()

const route = useRoute()
const editPath = computed(() => `/edit${route.path}`)
</script>

<template>
  <article class="wiki-content">
    <header class="wiki-header">
      <div class="header-content">
        <div>
          <h1 class="wiki-title">{{ page.title }}</h1>
          <p v-if="page.description" class="wiki-description">
            {{ page.description }}
          </p>
        </div>
        <NuxtLink :to="editPath" class="edit-button">
          ✏️ Edit
        </NuxtLink>
      </div>
    </header>

    <!-- eslint-disable-next-line vue/no-v-html, vue/html-self-closing -->
    <div class="markdown-body" v-html="page.html"></div>
  </article>
</template>

<style scoped>
.wiki-content {
  width: 100%;
}

.wiki-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
  transition: border-color 0.2s ease;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.edit-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-accent);
  color: white;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  transition: background-color 0.15s ease;
}

.edit-button:hover {
  background: var(--color-accent-hover);
}

.wiki-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
  transition: color 0.2s ease;
}

.wiki-description {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
  transition: color 0.2s ease;
}

/* Markdown content styles */
.markdown-body {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--color-text-primary);
  transition: color 0.2s ease;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.75em;
  font-weight: 600;
  line-height: 1.25;
  color: var(--color-text-primary);
  transition: color 0.2s ease;
}

.markdown-body :deep(h1) {
  font-size: 2rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.3em;
}

.markdown-body :deep(h2) {
  font-size: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.3em;
}

.markdown-body :deep(h3) {
  font-size: 1.25rem;
}

.markdown-body :deep(h4) {
  font-size: 1rem;
}

.markdown-body :deep(p) {
  margin: 1em 0;
}

.markdown-body :deep(a) {
  color: var(--color-accent);
  text-decoration: none;
  transition: color 0.2s ease;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 1em 0;
  padding-left: 2em;
}

.markdown-body :deep(li) {
  margin: 0.25em 0;
}

.markdown-body :deep(code) {
  background-color: var(--color-code-bg);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.9em;
  transition: background-color 0.2s ease;
}

.markdown-body :deep(pre) {
  background-color: var(--color-pre-bg);
  padding: 1em;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1.5em 0;
  transition: background-color 0.2s ease;
}

.markdown-body :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: var(--color-pre-text);
  font-size: 0.875rem;
  transition: color 0.2s ease;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid var(--color-border-secondary);
  padding-left: 1em;
  margin: 1em 0;
  color: var(--color-text-secondary);
  font-style: italic;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1.5em 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--color-border);
  padding: 0.75em;
  text-align: left;
  transition: border-color 0.2s ease;
}

.markdown-body :deep(th) {
  background-color: var(--color-bg-secondary);
  font-weight: 600;
  transition: background-color 0.2s ease;
}

.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1.5em 0;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 2em 0;
  transition: border-color 0.2s ease;
}
</style>
