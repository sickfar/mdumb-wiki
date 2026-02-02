<template>
  <div v-if="show" class="update-banner">
    <div class="banner-content">
      <span class="banner-icon">📝</span>
      <span class="banner-message">Page updated.</span>
      <button class="reload-button" @click="$emit('reload')">Reload</button>
      <button class="dismiss-button" @click="$emit('dismiss')">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
}>()

defineEmits<{
  reload: []
  dismiss: []
}>()
</script>

<style scoped>
.update-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  max-width: 1200px;
  margin: 0 auto;
}

.banner-icon {
  font-size: 1.25rem;
}

.banner-message {
  font-weight: 500;
}

.reload-button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.375rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.reload-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.dismiss-button {
  background: transparent;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 1.25rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.dismiss-button:hover {
  opacity: 1;
}
</style>
