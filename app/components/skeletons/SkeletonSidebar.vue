<template>
  <div class="skeleton-sidebar">
    <!-- Logo skeleton -->
    <div class="skeleton-logo skeleton-pulse" />

    <!-- Navigation items skeleton -->
    <div class="skeleton-nav">
      <div
        v-for="i in 8"
        :key="i"
        class="skeleton-nav-item skeleton-pulse"
        :style="{ width: getRandomWidth() }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Generate random widths for more natural-looking skeleton
const widths = ['60%', '75%', '65%', '80%', '70%', '85%', '55%', '90%']
const getRandomWidth = () => widths[Math.floor(Math.random() * widths.length)]
</script>

<style scoped>
.skeleton-sidebar {
  padding: 1.5rem;
  height: 100%;
}

.skeleton-logo {
  height: 2rem;
  width: 60%;
  margin-bottom: 2rem;
  border-radius: 0.5rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
}

.skeleton-nav {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-nav-item {
  height: 1.5rem;
  border-radius: 0.375rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
}

.skeleton-pulse {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .skeleton-logo,
  .skeleton-nav-item {
    background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
    background-size: 200% 100%;
  }
}
</style>
