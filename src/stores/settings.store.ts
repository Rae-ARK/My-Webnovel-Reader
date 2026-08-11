import { ref } from "vue";
import { defineStore } from "pinia";
import type { UserSettings } from "../models/user-state";
import { appContainer } from "../container";

export const useSettingsStore = defineStore("settings", () => {
  const container = appContainer;

  const settings = ref<UserSettings[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function load() {
    loading.value = true;
    error.value = null;

    try {
      settings.value = await container.userStateService.getSettings();
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : "Failed to load settings.";
    } finally {
      loading.value = false;
    }
  }

  async function get<T>(key: string): Promise<T | null> {
    return container.userStateService.getSetting<T>(key);
  }

  async function save<T>(key: string, value: T) {
    await container.userStateService.saveSetting(key, value);
    await load();
  }

  return {
    settings,
    loading,
    error,
    load,
    get,
    save,
  };
});
