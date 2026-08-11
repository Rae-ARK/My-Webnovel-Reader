import { computed, ref } from "vue";
import { defineStore } from "pinia";
import {
  type LibraryFilters,
  type LibraryItem,
} from "../services/library.service";
import { appContainer } from "../container";

export const useLibraryStore = defineStore("library", () => {
  const container = appContainer;

  const items = ref<LibraryItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref<LibraryFilters>({});

  const hasItems = computed(() => items.value.length > 0);

  async function load(nextFilters: LibraryFilters = filters.value) {
    loading.value = true;
    error.value = null;
    filters.value = nextFilters;

    try {
      items.value = await container.libraryService.listFictions(nextFilters);
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : "Failed to load library.";
    } finally {
      loading.value = false;
    }
  }

  async function getFictionById(fictionId: string) {
    return container.libraryService.getFictionById(fictionId);
  }

  function getIndexesForFiction(fictionId: string) {
    return container.libraryService.getIndexesForFiction(fictionId);
  }

  function getFirstEntryId(fictionId: string) {
    return container.libraryService.getFirstEntryId(fictionId);
  }

  async function loadContinueReading() {
    return container.libraryService.getContinueReading();
  }

  function setFilters(nextFilters: LibraryFilters) {
    filters.value = nextFilters;
  }

  function clearError() {
    error.value = null;
  }

  return {
    items,
    loading,
    error,
    filters,
    hasItems,
    load,
    getFictionById,
    getIndexesForFiction,
    getFirstEntryId,
    loadContinueReading,
    setFilters,
    clearError,
  };
});
