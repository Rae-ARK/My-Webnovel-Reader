<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    disabled: false,
    type: 'button',
  },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="ui-button"
    :class="`ui-button--${variant}`"
  >
    <slot />
  </button>
</template>

<style scoped>
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.5rem;
  padding: 0.625rem 0.875rem;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font: inherit;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    opacity 120ms ease;
}

.ui-button--primary {
  background: var(--accent);
  color: var(--text-on-accent);
}

.ui-button--primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.ui-button--secondary {
  background: var(--bg-elevated);
  color: var(--text);
  border-color: var(--border);
}

.ui-button--secondary:hover:not(:disabled) {
  background: var(--bg-surface);
}

.ui-button--ghost {
  background: transparent;
  color: var(--text);
}

.ui-button--ghost:hover:not(:disabled) {
  background: var(--bg-surface);
}

.ui-button--danger {
  background: var(--danger);
  color: var(--text-on-accent);
}

.ui-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
