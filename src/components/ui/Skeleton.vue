<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string
    height?: string
    radius?: 'sm' | 'md' | 'lg'
  }>(),
  {
    width: '100%',
    height: '1rem',
    radius: 'md',
  },
)
</script>

<template>
  <div
    class="ui-skeleton"
    :class="`ui-skeleton--${radius}`"
    :style="{ width, height }"
    aria-hidden="true"
  />
</template>

<style scoped>
.ui-skeleton {
  background: var(--bg-surface);
  animation: ui-skeleton-pulse 1.4s ease-in-out infinite;
}

.ui-skeleton--sm {
  border-radius: var(--radius-sm);
}

.ui-skeleton--md {
  border-radius: var(--radius-md);
}

.ui-skeleton--lg {
  border-radius: var(--radius-lg);
}

@keyframes ui-skeleton-pulse {
  0%,
  100% {
    opacity: 0.55;
  }

  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-skeleton {
    animation: none;
  }
}
</style>
