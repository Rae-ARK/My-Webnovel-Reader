<script setup lang="ts">
interface SelectOption {
  label: string
  value: string
}

const model = defineModel<string>({ default: '' })

withDefaults(
  defineProps<{
    label?: string
    options: SelectOption[]
    disabled?: boolean
    id?: string
  }>(),
  {
    disabled: false,
  },
)
</script>

<template>
  <label
    v-if="label"
    class="ui-select-field"
  >
    <span class="ui-select-label">{{ label }}</span>

    <select
      :id="id"
      v-model="model"
      :disabled="disabled"
      class="ui-select"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </label>

  <select
    v-else
    :id="id"
    v-model="model"
    :disabled="disabled"
    class="ui-select"
  >
    <option
      v-for="option in options"
      :key="option.value"
      :value="option.value"
    >
      {{ option.label }}
    </option>
  </select>
</template>

<style scoped>
.ui-select-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.ui-select-label {
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 600;
}

.ui-select {
  width: 100%;
  min-height: 2.5rem;
  padding: 0.625rem 2rem 0.625rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  color: var(--text);
  font: inherit;
}

.ui-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
