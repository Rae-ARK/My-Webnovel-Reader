import { ref } from "vue";
import { defineStore } from "pinia";
import type { ReadingProgress } from "../models/user-state";
import type { ReaderChapter } from "../services/reader.service";
import { appContainer } from "../container";

export const useReaderStore = defineStore("reader", () => {
  const container = appContainer;

  const current = ref<ReaderChapter | null>(null);
  const progress = ref<ReadingProgress | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadChapter(fictionId: string, chapterId: string) {
    loading.value = true;
    error.value = null;

    try {
      const chapter = container.readerService.getChapter(fictionId, chapterId);

      if (!chapter) {
        current.value = null;
        error.value = "Chapter not found.";
        return null;
      }

      current.value = chapter;
      progress.value = await container.readerService.getProgress(fictionId);

      return chapter;
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : "Failed to load chapter.";

      return null;
    } finally {
      loading.value = false;
    }
  }

  async function loadProgress(fictionId: string) {
    progress.value = await container.readerService.getProgress(fictionId);

    return progress.value;
  }

  async function saveProgress(nextProgress: ReadingProgress) {
    progress.value = nextProgress;
    await container.readerService.saveProgress(nextProgress);
  }

  function saveProgressDebounced(nextProgress: ReadingProgress, delay = 500) {
    progress.value = nextProgress;

    container.readerService.saveProgressDebounced(nextProgress, delay);
  }

  async function recordHistory(fictionId: string, chapterId: string) {
    await container.readerService.recordHistory(fictionId, chapterId);
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
    loadChapter,
    loadProgress,
    saveProgress,
    saveProgressDebounced,
    recordHistory,
    clearError,
    dispose,
  };
});
