import type { Chapter } from '../models/content'
import type { ContentRepositoryContract } from '../repositories/contracts/ContentRepositoryContract'
import type { UserStateRepositoryContract } from '../repositories/contracts/UserStateRepositoryContract'
import type { ReadingProgress } from '../models/user-state'

export interface ChapterNavigation {
  previous: Chapter | null
  next: Chapter | null
}

export interface ReaderChapter {
  chapter: Chapter
  previous: Chapter | null
  next: Chapter | null
}

export class ReaderService {
  private progressTimers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(
    private readonly contentRepository: ContentRepositoryContract,
    private readonly userStateRepository: UserStateRepositoryContract,
  ) {}

  getChapter(
    fictionId: string,
    chapterId: string,
  ): ReaderChapter | null {
    const chapter = this.contentRepository.getChapter(chapterId)

    if (!chapter || chapter.fictionId !== fictionId) {
      return null
    }

    const chapters =
      this.contentRepository.listChaptersForFiction(fictionId)

    const chapterIndex = chapters.findIndex(
      (item) => item.id === chapter.id,
    )

    if (chapterIndex === -1) {
      return null
    }

    return {
      chapter,
      previous: chapters[chapterIndex - 1] ?? null,
      next: chapters[chapterIndex + 1] ?? null,
    }
  }

  getNavigation(
    fictionId: string,
    chapterId: string,
  ): ChapterNavigation | null {
    const result = this.getChapter(fictionId, chapterId)

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
    chapterId: string,
  ): Promise<void> {
    await this.userStateRepository.addHistoryEntry({
      id: crypto.randomUUID(),
      fictionId,
      chapterId,
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
