import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { Favorite } from "../models/user-state";
import { appContainer } from "../container";

export const useFavoritesStore = defineStore("favorites", () => {
  const container = appContainer;

  const favorites = ref<Favorite[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const favoriteIds = computed(
    () => new Set(favorites.value.map((favorite) => favorite.fictionId)),
  );

  function isFavorite(fictionId: string): boolean {
    return favoriteIds.value.has(fictionId);
  }

  async function load() {
    loading.value = true;
    error.value = null;

    try {
      favorites.value = await container.userStateService.getFavorites();
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : "Failed to load favorites.";
    } finally {
      loading.value = false;
    }
  }

  async function toggle(fictionId: string) {
    const isNowFavorite =
      await container.userStateService.toggleFavorite(fictionId);

    await load();

    return isNowFavorite;
  }

  return {
    favorites,
    favoriteIds,
    loading,
    error,
    isFavorite,
    load,
    toggle,
  };
});
