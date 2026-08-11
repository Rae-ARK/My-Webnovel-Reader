<script setup lang="ts">
const model = defineModel<string>({ default: '' })

withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    type?: string
    disabled?: boolean
    id?: string
  }>(),
  {
    type: 'text',
    disabled: false,
  },
)
</script>

<template>
  <label
    v-if="label"
    class="ui-input-field"
  >
    <span class="ui-input-label">{{ label }}</span>

    <input
      :id="id"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      class="ui-input"
    >
  </label>

  <input
    v-else
    :id="id"
    v-model="model"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    class="ui-input"
  >
</template>

<style scoped>
.ui-input-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.ui-input-label {
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 600;
}

.ui-input {
  width: 100%;
  min-height: 2.5rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  color: var(--text);
  outline: none;
}

.ui-input::placeholder {
  color: var(--text-subtle);
}

.ui-input:focus {
  border-color: var(--focus-ring);
}

.ui-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
