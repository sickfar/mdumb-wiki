<template>
  <div
    class="loading-spinner"
    :class="sizeClass"
    role="status"
    aria-label="Loading"
  >
    <svg
      class="spinner-svg"
      viewBox="0 0 50 50"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        class="spinner-circle"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke-width="4"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const sizeClass = computed(() => `spinner-${props.size}`)
</script>

<style scoped>
.loading-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spinner-svg {
  animation: spinner-rotate 1.4s linear infinite;
}

.spinner-circle {
  stroke: currentColor;
  stroke-linecap: round;
  animation: spinner-dash 1.4s ease-in-out infinite;
}

/* Size variants */
.spinner-sm {
  width: 1rem;
  height: 1rem;
}

.spinner-md {
  width: 2rem;
  height: 2rem;
}

.spinner-lg {
  width: 3rem;
  height: 3rem;
}

/* Animations */
@keyframes spinner-rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes spinner-dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
</style>
