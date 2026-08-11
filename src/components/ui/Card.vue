<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'default' | 'elevated'
  }>(),
  {
    variant: 'default',
  },
)
</script>

<template>
  <section
    class="ui-card"
    :class="`ui-card--${variant}`"
  >
    <slot />
  </section>
</template>

<style scoped>
.ui-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-elevated);
  color: var(--text);
}

.ui-card--default {
  box-shadow: var(--shadow-sm);
}

.ui-card--elevated {
  box-shadow: var(--shadow-md);
}
</style>
