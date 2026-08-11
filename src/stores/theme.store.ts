import { defineStore } from "pinia";
import { computed, ref } from "vue";

export type Theme = "light" | "cream" | "dark";

const themes: Theme[] = ["light", "cream", "dark"];
const STORAGE_KEY = "reader-theme";

function isTheme(value: string | null): value is Theme {
  return value !== null && themes.includes(value as Theme);
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  return isTheme(stored) ? stored : "light";
}

export const useThemeStore = defineStore("theme", () => {
  const theme = ref<Theme>(getInitialTheme());

  const availableThemes = computed(() => themes);

  function applyTheme(value: Theme) {
    theme.value = value;

    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = value;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  }

  function initialize() {
    applyTheme(theme.value);
  }

  function setTheme(value: Theme) {
    applyTheme(value);
  }

  return {
    theme,
    availableThemes,
    initialize,
    setTheme,
  };
});
