<script setup lang="ts">
const model = defineModel<number>({ default: 50 })

withDefaults(
  defineProps<{
    label?: string
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    id?: string
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
  },
)
</script>

<template>
  <label class="ui-slider-field">
    <span v-if="label" class="ui-slider-label">
      {{ label }}
      <output>{{ model }}</output>
    </span>

    <input
      v-model.number="model"
      :id="id"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      class="ui-slider"
    />
  </label>
</template>

<style scoped>
.ui-slider-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ui-slider-label {
  display: flex;
  justify-content: space-between;
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 600;
}

.ui-slider {
  width: 100%;
  accent-color: var(--accent);
  cursor: pointer;
}

.ui-slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
