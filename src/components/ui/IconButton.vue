<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    disabled: false,
    type: 'button',
  },
)
</script>

<template>
  <button
    :type="type"
    :aria-label="label"
    :disabled="disabled"
    class="ui-icon-button"
  >
    <slot />
  </button>
</template>

<style scoped>
.ui-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  color: var(--text);
  font: inherit;
  cursor: pointer;
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    opacity 120ms ease;
}

.ui-icon-button:hover:not(:disabled) {
  background: var(--bg-surface);
}

.ui-icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
