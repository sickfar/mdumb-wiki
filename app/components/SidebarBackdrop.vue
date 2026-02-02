<template>
  <!-- Backdrop for mobile sidebar - only visible when sidebar is open on mobile -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="sidebar-backdrop"
        aria-hidden="true"
        @click="close"
      />
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { isOpen, close } = useMobileSidebar()
</script>

<style scoped>
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

/* Hidden on desktop */
@media (min-width: 768px) {
  .sidebar-backdrop {
    display: none;
  }
}
</style>
