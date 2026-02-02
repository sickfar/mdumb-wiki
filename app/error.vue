<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const config = useRuntimeConfig()

const isNotFound = computed(() => props.error.statusCode === 404)
const isServerError = computed(() => props.error.statusCode && props.error.statusCode >= 500)

const handleReload = () => {
  window.location.reload()
}

const handleClearError = () => {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="error-page">
    <!-- 404 Section -->
    <div v-if="isNotFound" class="error-container">
      <div class="error-code">404</div>
      <h1 class="error-title">Page Not Found</h1>
      <p class="error-message">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div class="error-actions">
        <NuxtLink to="/" class="button button-primary">
          Return to Home
        </NuxtLink>
      </div>
    </div>

    <!-- 500 Section -->
    <div v-else-if="isServerError" class="error-container">
      <div class="error-code">500</div>
      <h1 class="error-title">Server Error</h1>
      <p class="error-message">
        Something went wrong on our end. Please try again later.
      </p>
      <div class="error-actions">
        <button class="button button-primary" @click="handleReload">
          Reload Page
        </button>
        <button class="button button-secondary" @click="handleClearError">
          Go Home
        </button>
      </div>

      <!-- Dev-only error details -->
      <details v-if="config.public.isDev" class="error-details">
        <summary>Error Details (Development Only)</summary>
        <pre>{{ error }}</pre>
      </details>
    </div>

    <!-- Other errors -->
    <div v-else class="error-container">
      <div class="error-code">{{ error.statusCode || '500' }}</div>
      <h1 class="error-title">{{ error.statusMessage || 'An Error Occurred' }}</h1>
      <p class="error-message">
        {{ error.message || 'Something went wrong. Please try again.' }}
      </p>
      <div class="error-actions">
        <button class="button button-primary" @click="handleClearError">
          Go Home
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

.error-container {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.error-code {
  font-size: 6rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 1rem;
}

.error-message {
  font-size: 1.125rem;
  color: #4a5568;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.button {
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.button-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.button-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

.button-secondary {
  background: #e2e8f0;
  color: #2d3748;
}

.button-secondary:hover {
  background: #cbd5e0;
  transform: translateY(-2px);
}

.error-details {
  margin-top: 2rem;
  text-align: left;
  background: #f7fafc;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e2e8f0;
}

.error-details summary {
  cursor: pointer;
  font-weight: 600;
  color: #2d3748;
  padding: 0.5rem;
}

.error-details pre {
  margin-top: 1rem;
  padding: 1rem;
  background: #2d3748;
  color: #e2e8f0;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.5;
}
</style>
