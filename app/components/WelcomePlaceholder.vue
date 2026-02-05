<script setup lang="ts">
const wikiTitle = 'MDumb Wiki'
</script>

<template>
  <div class="welcome-placeholder">
    <div class="welcome-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>

    <h1 class="welcome-title">Welcome to {{ wikiTitle }}</h1>

    <p class="welcome-subtitle">
      Your wiki is ready, but there's no content yet.
    </p>

    <div class="getting-started">
      <h2>Getting Started</h2>

      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Mount your content</h3>
            <p>Mount a directory with markdown files to <code>/wiki</code></p>
            <pre><code>docker run -v ./my-docs:/wiki:ro -p 3020:3020 mdumb-wiki</code></pre>
          </div>
        </div>

        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>Create an index file</h3>
            <p>Create <code>index.md</code> in your wiki root as the home page</p>
            <pre><code>---
title: Home
---

# Welcome to my wiki!</code></pre>
          </div>
        </div>

        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Organize with folders</h3>
            <p>Use folders to create navigation hierarchy</p>
            <pre><code>wiki/
  index.md
  guides/
    getting-started.md
    advanced.md
  reference/
    api.md</code></pre>
          </div>
        </div>
      </div>
    </div>

    <div class="features">
      <div class="feature">
        <span class="feature-icon">✨</span>
        <span>Syntax highlighting</span>
      </div>
      <div class="feature">
        <span class="feature-icon">🔍</span>
        <span>Full-text search</span>
      </div>
      <div class="feature">
        <span class="feature-icon">🌙</span>
        <span>Dark mode</span>
      </div>
      <div class="feature">
        <span class="feature-icon">📱</span>
        <span>Mobile friendly</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.welcome-placeholder {
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.welcome-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  color: var(--color-accent);
  opacity: 0.9;
}

.welcome-icon svg {
  width: 100%;
  height: 100%;
}

.welcome-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin: 0 0 0.5rem;
  color: var(--color-text-primary);
  transition: color 0.2s ease;
}

.welcome-subtitle {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 1.125rem;
  margin: 0 0 2.5rem;
  transition: color 0.2s ease;
}

.getting-started {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.getting-started h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.25rem;
  color: var(--color-text-primary);
  transition: color 0.2s ease;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.step {
  display: flex;
  gap: 1rem;
}

.step-number {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  background: var(--color-accent);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-content h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  color: var(--color-text-primary);
  transition: color 0.2s ease;
}

.step-content p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0 0 0.5rem;
  transition: color 0.2s ease;
}

.step-content code {
  background: var(--color-bg-tertiary);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.8125rem;
  color: var(--color-text-primary);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.step-content pre {
  background: var(--color-pre-bg);
  color: var(--color-pre-text);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.step-content pre code {
  background: none;
  padding: 0;
  color: inherit;
}

.features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

.feature-icon {
  font-size: 1rem;
}

@media (max-width: 640px) {
  .welcome-title {
    font-size: 1.5rem;
  }

  .welcome-subtitle {
    font-size: 1rem;
  }

  .step {
    flex-direction: column;
    gap: 0.5rem;
  }

  .step-number {
    width: 24px;
    height: 24px;
    font-size: 0.75rem;
  }
}
</style>
