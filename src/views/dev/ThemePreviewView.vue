<script setup lang="ts">
import { ref } from 'vue'
import Button from '../../components/ui/Button.vue'
import IconButton from '../../components/ui/IconButton.vue'
import Card from '../../components/ui/Card.vue'
import Input from '../../components/ui/Input.vue'
import Select from '../../components/ui/Select.vue'
import Slider from '../../components/ui/Slider.vue'
import Toggle from '../../components/ui/Toggle.vue'
import Modal from '../../components/ui/Modal.vue'
import Skeleton from '../../components/ui/Skeleton.vue'
import Spinner from '../../components/ui/Spinner.vue'
import { useThemeStore, type Theme } from '../../stores/theme'

const themeStore = useThemeStore()

const inputValue = ref('')
const selectedOption = ref('chapter')
const sliderValue = ref(65)
const toggleValue = ref(true)
const modalOpen = ref(false)

const options = [
  { label: 'Chapter', value: 'chapter' },
  { label: 'Novel', value: 'novel' },
  { label: 'Author', value: 'author' },
]
</script>

<template>
  <div class="preview">
    <header class="preview-header">
      <div>
        <p class="eyebrow">Development</p>
        <h1>Theme Preview</h1>
        <p class="description">
          Stage 1 component and theme validation.
        </p>
      </div>

      <div class="theme-switcher" aria-label="Theme selection">
        <Button
          v-for="theme in themeStore.availableThemes"
          :key="theme"
          :variant="themeStore.theme === theme ? 'primary' : 'secondary'"
          @click="themeStore.setTheme(theme as Theme)"
        >
          {{ theme }}
        </Button>
      </div>
    </header>

    <main class="sections">
      <section>
        <h2>Buttons</h2>

        <div class="row">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section>
        <h2>Icon buttons</h2>

        <div class="row">
          <IconButton label="Previous chapter">←</IconButton>
          <IconButton label="Next chapter">→</IconButton>
          <IconButton label="Settings">⚙</IconButton>
        </div>
      </section>

      <section>
        <h2>Cards</h2>

        <div class="grid grid--two">
          <Card>
            <div class="card-content">
              <h3>Default Card</h3>
              <p>Used for ordinary grouped content.</p>
            </div>
          </Card>

          <Card variant="elevated">
            <div class="card-content">
              <h3>Elevated Card</h3>
              <p>Used when the content needs more visual separation.</p>
            </div>
          </Card>
        </div>
      </section>

      <section>
        <h2>Inputs</h2>

        <div class="grid grid--two">
          <Input
            v-model="inputValue"
            label="Search"
            placeholder="Search novels..."
          />

          <Input
            label="Disabled"
            placeholder="Unavailable"
            disabled
          />
        </div>

        <p class="value-preview">Value: {{ inputValue || 'Nothing entered' }}</p>
      </section>

      <section>
        <h2>Select</h2>

        <Select
          v-model="selectedOption"
          label="Search scope"
          :options="options"
        />

        <p class="value-preview">Selected: {{ selectedOption }}</p>
      </section>

      <section>
        <h2>Slider</h2>

        <Slider
          v-model="sliderValue"
          label="Font size"
          :min="12"
          :max="32"
          :step="1"
        />

        <p class="value-preview">Font size: {{ sliderValue }}px</p>
      </section>

      <section>
        <h2>Toggle</h2>

        <Toggle v-model="toggleValue" label="Enable reader feature" />

        <p class="value-preview">
          State: {{ toggleValue ? 'Enabled' : 'Disabled' }}
        </p>
      </section>

      <section>
        <h2>Modal</h2>

        <Button @click="modalOpen = true">Open modal</Button>

        <Modal
          :open="modalOpen"
          title="Preview modal"
          @close="modalOpen = false"
        >
          <p>
            This modal exists to verify surfaces, borders, focus states,
            and theme contrast.
          </p>

          <div class="modal-actions">
            <Button variant="secondary" @click="modalOpen = false">
              Close
            </Button>
          </div>
        </Modal>
      </section>

      <section>
        <h2>Skeleton</h2>

        <Card>
          <div class="skeleton-content">
            <Skeleton width="40%" height="1.25rem" />
            <Skeleton width="100%" height="0.875rem" />
            <Skeleton width="85%" height="0.875rem" />
            <Skeleton width="65%" height="0.875rem" />
          </div>
        </Card>
      </section>

      <section>
        <h2>Spinner</h2>

        <div class="row">
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.preview {
  width: min(1100px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 3rem 0 5rem;
}

.preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 3rem;
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0.5rem;
  font-size: clamp(2rem, 5vw, 3rem);
}

h2 {
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

h3 {
  margin-bottom: 0.5rem;
}

.description,
.value-preview,
.card-content p {
  color: var(--text-muted);
}

.description {
  margin-bottom: 0;
}

.theme-switcher,
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.sections {
  display: grid;
  gap: 2.5rem;
}

.sections > section {
  display: grid;
  gap: 1rem;
}

.grid {
  display: grid;
  gap: 1rem;
}

.grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.card-content {
  padding: 1.25rem;
}

.value-preview {
  margin: 0;
  font-size: 0.875rem;
}

.skeleton-content {
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.25rem;
}

@media (max-width: 700px) {
  .preview-header {
    flex-direction: column;
  }

  .grid--two {
    grid-template-columns: 1fr;
  }
}
</style>
