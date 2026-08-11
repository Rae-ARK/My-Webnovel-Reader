import { ref } from "vue";
import { defineStore } from "pinia";
import type {
  Bookmark,
  ReadingProgress,
} from "../models/user-state";
import type { ReaderEntry } from "../services/reader.service";
import { appContainer } from "../container";

export const useReaderStore = defineStore("reader", () => {
  const container = appContainer;

  const current = ref<ReaderEntry | null>(null);
  const progress = ref<ReadingProgress | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadEntry(fictionId: string, entryId: string) {
    loading.value = true;
    error.value = null;

    try {
      const entry = container.readerService.getEntry(
        fictionId,
        entryId,
      );

      if (!entry) {
        current.value = null;
        error.value = "Entry not found.";
        return null;
      }

      current.value = entry;
      progress.value =
        await container.readerService.getProgress(fictionId);

      return entry;
    } catch (cause) {
      error.value =
        cause instanceof Error
          ? cause.message
          : "Failed to load entry.";

      return null;
    } finally {
      loading.value = false;
    }
  }

  function getEntryTitle(entryId: string): string | null {
    return container.readerService.getEntryTitle(entryId);
  }

  async function loadProgress(fictionId: string) {
    progress.value =
      await container.readerService.getProgress(fictionId);

    return progress.value;
  }

  async function saveProgress(nextProgress: ReadingProgress) {
    progress.value = nextProgress;
    await container.readerService.saveProgress(nextProgress);
  }

  function saveProgressDebounced(
    nextProgress: ReadingProgress,
    delay = 500,
  ) {
    progress.value = nextProgress;

    container.readerService.saveProgressDebounced(
      nextProgress,
      delay,
    );
  }

  async function recordHistory(
    fictionId: string,
    chapterId: string,
  ) {
    await container.readerService.recordHistory(
      fictionId,
      chapterId,
    );
  }

  async function addBookmark(input: {
    fictionId: string;
    chapterId: string;
    position: number;
    label?: string | null;
  }) {
    await container.userStateService.addBookmark(input);
  }

  async function removeBookmark(bookmarkId: string) {
    await container.userStateService.removeBookmark(bookmarkId);
  }

  async function listBookmarksForFiction(
    fictionId: string,
  ): Promise<Bookmark[]> {
    return container.userStateService.listBookmarksForFiction(
      fictionId,
    );
  }

  function clearError() {
    error.value = null;
  }

  function dispose() {
    container.readerService.dispose();
  }

  return {
    current,
    progress,
    loading,
    error,
    loadEntry,
    getEntryTitle,
    loadProgress,
    saveProgress,
    saveProgressDebounced,
    recordHistory,
    addBookmark,
    removeBookmark,
    listBookmarksForFiction,
    clearError,
    dispose,
  };
});
