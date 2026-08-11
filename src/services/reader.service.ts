import type { ContentEntry } from '../models/content'
import type { ContentRepositoryContract } from '../repositories/contracts/ContentRepositoryContract'
import type { UserStateRepositoryContract } from '../repositories/contracts/UserStateRepositoryContract'
import type { ReadingProgress } from '../models/user-state'

export interface EntryNavigation {
  previous: ContentEntry | null
  next: ContentEntry | null
}

export interface ReaderEntry {
  entry: ContentEntry
  previous: ContentEntry | null
  next: ContentEntry | null
}

export class ReaderService {
  private progressTimers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(
    private readonly contentRepository: ContentRepositoryContract,
    private readonly userStateRepository: UserStateRepositoryContract,
  ) {}

  getEntry(
    fictionId: string,
    entryId: string,
  ): ReaderEntry | null {
    const entry = this.contentRepository.getEntry(entryId)

    if (!entry || entry.fictionId !== fictionId) {
      return null
    }

    // Navigation runs over the fiction's actual readable-entry sequence
    // (chapters, interludes, extras, afterwords, ...), not a numbered
    // chapter list, so any entry type can be reached from any other.
    const entries =
      this.contentRepository.listEntriesForFiction(fictionId)

    const entryIndex = entries.findIndex(
      (item) => item.id === entry.id,
    )

    if (entryIndex === -1) {
      return null
    }

    return {
      entry,
      previous: entries[entryIndex - 1] ?? null,
      next: entries[entryIndex + 1] ?? null,
    }
  }

  getEntryTitle(entryId: string): string | null {
    return this.contentRepository.getEntry(entryId)?.title ?? null
  }

  getNavigation(
    fictionId: string,
    entryId: string,
  ): EntryNavigation | null {
    const result = this.getEntry(fictionId, entryId)

    if (!result) {
      return null
    }

    return {
      previous: result.previous,
      next: result.next,
    }
  }

  async getProgress(
    fictionId: string,
  ): Promise<ReadingProgress | null> {
    return this.userStateRepository.getProgress(fictionId)
  }

  async saveProgress(
    progress: ReadingProgress,
  ): Promise<void> {
    await this.userStateRepository.saveProgress({
      ...progress,
      updatedAt: Date.now(),
    })
  }

  saveProgressDebounced(
    progress: ReadingProgress,
    delay = 500,
  ): void {
    const existingTimer = this.progressTimers.get(
      progress.fictionId,
    )

    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const timer = setTimeout(() => {
      this.progressTimers.delete(progress.fictionId)

      void this.saveProgress(progress)
    }, delay)

    this.progressTimers.set(progress.fictionId, timer)
  }

  async recordHistory(
    fictionId: string,
    entryId: string,
  ): Promise<void> {
    await this.userStateRepository.addHistoryEntry({
      id: crypto.randomUUID(),
      fictionId,
      chapterId: entryId,
      visitedAt: Date.now(),
    })
  }

  dispose(): void {
    for (const timer of this.progressTimers.values()) {
      clearTimeout(timer)
    }

    this.progressTimers.clear()
  }
}
