<template>
  <div class="skeleton-content">
    <!-- Page title skeleton -->
    <div class="skeleton-title skeleton-pulse" />

    <!-- Subtitle/metadata skeleton -->
    <div class="skeleton-subtitle skeleton-pulse" />

    <div class="skeleton-divider" />

    <!-- Paragraph skeletons -->
    <div class="skeleton-paragraph">
      <div class="skeleton-line skeleton-pulse" style="width: 95%" />
      <div class="skeleton-line skeleton-pulse" style="width: 88%" />
      <div class="skeleton-line skeleton-pulse" style="width: 92%" />
      <div class="skeleton-line skeleton-pulse" style="width: 70%" />
    </div>

    <!-- Subheading skeleton -->
    <div class="skeleton-subheading skeleton-pulse" />

    <!-- Another paragraph -->
    <div class="skeleton-paragraph">
      <div class="skeleton-line skeleton-pulse" style="width: 90%" />
      <div class="skeleton-line skeleton-pulse" style="width: 94%" />
      <div class="skeleton-line skeleton-pulse" style="width: 85%" />
    </div>

    <!-- Code block skeleton -->
    <div class="skeleton-code-block skeleton-pulse">
      <div class="skeleton-code-line" />
      <div class="skeleton-code-line" style="width: 80%" />
      <div class="skeleton-code-line" style="width: 70%" />
      <div class="skeleton-code-line" style="width: 85%" />
    </div>

    <!-- Final paragraph -->
    <div class="skeleton-paragraph">
      <div class="skeleton-line skeleton-pulse" style="width: 92%" />
      <div class="skeleton-line skeleton-pulse" style="width: 88%" />
      <div class="skeleton-line skeleton-pulse" style="width: 75%" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-content {
  max-width: 48rem;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.skeleton-title {
  height: 2.5rem;
  width: 60%;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
}

.skeleton-subtitle {
  height: 1.25rem;
  width: 40%;
  margin-bottom: 1.5rem;
  border-radius: 0.375rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
}

.skeleton-divider {
  height: 1px;
  background-color: #e5e5e5;
  margin: 1.5rem 0;
}

.skeleton-subheading {
  height: 2rem;
  width: 45%;
  margin: 2rem 0 1rem;
  border-radius: 0.5rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
}

.skeleton-paragraph {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.skeleton-line {
  height: 1.25rem;
  border-radius: 0.375rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
}

.skeleton-code-block {
  height: 8rem;
  margin: 1.5rem 0;
  padding: 1rem;
  border-radius: 0.5rem;
  background: linear-gradient(90deg, #f8f8f8 25%, #e8e8e8 50%, #f8f8f8 75%);
  background-size: 200% 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-code-line {
  height: 1rem;
  width: 100%;
  border-radius: 0.25rem;
  background: #d0d0d0;
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
  .skeleton-title,
  .skeleton-subtitle,
  .skeleton-subheading,
  .skeleton-line {
    background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
    background-size: 200% 100%;
  }

  .skeleton-divider {
    background-color: #404040;
  }

  .skeleton-code-block {
    background: linear-gradient(90deg, #1e1e1e 25%, #2e2e2e 50%, #1e1e1e 75%);
    background-size: 200% 100%;
  }

  .skeleton-code-line {
    background: #3a3a3a;
  }
}
</style>
