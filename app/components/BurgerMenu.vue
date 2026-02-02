<template>
  <!-- Burger menu on right side, only visible on mobile (hidden on md+) -->
  <button
    class="burger-menu"
    aria-label="Toggle navigation menu"
    :aria-expanded="isOpen"
    @click="toggle"
  >
    <span class="burger-line" :class="{ 'line-top-active': isOpen }" />
    <span class="burger-line" :class="{ 'line-middle-active': isOpen }" />
    <span class="burger-line" :class="{ 'line-bottom-active': isOpen }" />
  </button>
</template>

<script setup lang="ts">
const { isOpen, toggle } = useMobileSidebar()
</script>

<style scoped>
.burger-menu {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.2s ease;
}

.burger-menu:hover {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
}

.burger-menu:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-accent);
}

/* Hidden on desktop */
@media (min-width: 768px) {
  .burger-menu {
    display: none;
  }
}

.burger-line {
  display: block;
  width: 24px;
  height: 2px;
  background-color: white;
  transition: all 0.3s ease;
}

.burger-line:nth-child(2) {
  margin: 6px 0;
}

/* Animated X when open */
.line-top-active {
  transform: rotate(45deg) translateY(5.5px) translateX(5.5px);
}

.line-middle-active {
  opacity: 0;
}

.line-bottom-active {
  transform: rotate(-45deg) translateY(-5.5px) translateX(5.5px);
}
</style>
