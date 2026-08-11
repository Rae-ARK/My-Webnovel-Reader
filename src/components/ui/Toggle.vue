<script setup lang="ts">
const model = defineModel<boolean>({ default: false })

withDefaults(
  defineProps<{
    label?: string
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)
</script>

<template>
  <label class="ui-toggle">
    <button
      type="button"
      role="switch"
      :aria-checked="model"
      :disabled="disabled"
      class="ui-toggle-control"
      :class="{ 'ui-toggle-control--on': model }"
      @click="model = !model"
    >
      <span class="ui-toggle-thumb" />
    </button>

    <span
      v-if="label"
      class="ui-toggle-label"
    >{{ label }}</span>
  </label>
</template>

<style scoped>
.ui-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  color: var(--text);
}

.ui-toggle-control {
  position: relative;
  width: 2.75rem;
  height: 1.625rem;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-surface);
  cursor: pointer;
  transition:
    background-color 120ms ease,
    border-color 120ms ease;
}

.ui-toggle-control--on {
  border-color: var(--accent);
  background: var(--accent);
}

.ui-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: var(--text-on-accent);
  transition: transform 120ms ease;
}

.ui-toggle-control--on .ui-toggle-thumb {
  transform: translateX(1.125rem);
}

.ui-toggle-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ui-toggle-label {
  font-size: 0.875rem;
  font-weight: 600;
}
</style>
