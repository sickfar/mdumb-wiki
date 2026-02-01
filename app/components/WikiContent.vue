<script setup lang="ts">
import type { WikiPage } from '../../types/wiki'

defineProps<{
  page: WikiPage
}>()
</script>

<template>
  <article class="wiki-content">
    <header class="wiki-header">
      <h1 class="wiki-title">{{ page.title }}</h1>
      <p v-if="page.description" class="wiki-description">
        {{ page.description }}
      </p>
    </header>

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
  border-bottom: 1px solid #e2e8f0;
}

.wiki-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.wiki-description {
  font-size: 1.125rem;
  color: #4a5568;
  margin: 0;
  line-height: 1.6;
}

/* Markdown content styles */
.markdown-body {
  font-size: 1rem;
  line-height: 1.7;
  color: #2d3748;
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
  color: #1a202c;
}

.markdown-body :deep(h1) {
  font-size: 2rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.3em;
}

.markdown-body :deep(h2) {
  font-size: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
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
  color: #3182ce;
  text-decoration: none;
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
  background-color: #f7fafc;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.9em;
}

.markdown-body :deep(pre) {
  background-color: #1a202c;
  padding: 1em;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1.5em 0;
}

.markdown-body :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: #e2e8f0;
  font-size: 0.875rem;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #cbd5e0;
  padding-left: 1em;
  margin: 1em 0;
  color: #4a5568;
  font-style: italic;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1.5em 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 0.75em;
  text-align: left;
}

.markdown-body :deep(th) {
  background-color: #f7fafc;
  font-weight: 600;
}

.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1.5em 0;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 2em 0;
}
</style>
