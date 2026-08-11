<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open?: boolean
    title?: string
  }>(),
  {
    open: false,
  },
)

const emit = defineEmits<{
  close: []
}>()

function close() {
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) {
    close()
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      document.addEventListener('keydown', onKeydown)
    } else {
      document.removeEventListener('keydown', onKeydown)
    }
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="ui-modal-backdrop" @click.self="close">
      <section
        class="ui-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <header v-if="title" class="ui-modal-header">
          <h2>{{ title }}</h2>

          <button
            type="button"
            class="ui-modal-close"
            aria-label="Close dialog"
            @click="close"
          >
            ×
          </button>
        </header>

        <div class="ui-modal-body">
          <slot />
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.ui-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(0 0 0 / 55%);
}

.ui-modal {
  width: min(32rem, 100%);
  max-height: calc(100vh - 2rem);
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-elevated);
  color: var(--text);
  box-shadow: var(--shadow-md);
}

.ui-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
}

.ui-modal-header h2 {
  margin: 0;
  font-size: 1.125rem;
}

.ui-modal-close {
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.ui-modal-body {
  padding: 1.25rem;
}
</style>
