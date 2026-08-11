<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
    label?: string
  }>(),
  {
    size: 'md',
    label: 'Loading',
  },
)
</script>

<template>
  <span
    class="ui-spinner"
    :class="`ui-spinner--${size}`"
    role="status"
    :aria-label="label"
  />
</template>

<style scoped>
.ui-spinner {
  display: inline-block;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: ui-spinner-rotate 700ms linear infinite;
}

.ui-spinner--sm {
  width: 1rem;
  height: 1rem;
}

.ui-spinner--md {
  width: 1.5rem;
  height: 1.5rem;
}

.ui-spinner--lg {
  width: 2.25rem;
  height: 2.25rem;
}

@keyframes ui-spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-spinner {
    animation-duration: 1.5s;
  }
}
</style>
