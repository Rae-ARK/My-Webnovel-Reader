import type {
  Bookmark,
  Favorite,
  HistoryEntry,
  ReadingProgress,
  UserSettings,
} from '../models/user-state'
import type { UserStateRepositoryContract } from '../repositories/contracts/UserStateRepositoryContract'

export class UserStateService {
  constructor(
    private readonly userStateRepository: UserStateRepositoryContract,
  ) {}

  getProgress(
    fictionId: string,
  ): Promise<ReadingProgress | null> {
    return this.userStateRepository.getProgress(fictionId)
  }

  saveProgress(
    progress: Omit<ReadingProgress, 'updatedAt'> &
      Partial<Pick<ReadingProgress, 'updatedAt'>>,
  ): Promise<void> {
    return this.userStateRepository.saveProgress({
      ...progress,
      updatedAt: progress.updatedAt ?? Date.now(),
    })
  }

  getAllProgress(): Promise<ReadingProgress[]> {
    return this.userStateRepository.getAllProgress()
  }

  toggleFavorite(fictionId: string): Promise<boolean> {
    return this.userStateRepository.toggleFavorite(fictionId)
  }

  isFavorite(fictionId: string): Promise<boolean> {
    return this.userStateRepository.isFavorite(fictionId)
  }

  getFavorites(): Promise<Favorite[]> {
    return this.userStateRepository.getFavorites()
  }

  addBookmark(input: {
    fictionId: string
    chapterId: string
    position: number
    label?: string | null
  }): Promise<void> {
    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      fictionId: input.fictionId,
      chapterId: input.chapterId,
      position: input.position,
      createdAt: Date.now(),
      label: input.label ?? null,
    }

    return this.userStateRepository.addBookmark(bookmark)
  }

  removeBookmark(bookmarkId: string): Promise<void> {
    return this.userStateRepository.removeBookmark(bookmarkId)
  }

  listBookmarks(): Promise<Bookmark[]> {
    return this.userStateRepository.listBookmarks()
  }

  listBookmarksForFiction(
    fictionId: string,
  ): Promise<Bookmark[]> {
    return this.userStateRepository.listBookmarksForFiction(
      fictionId,
    )
  }

  addHistoryEntry(input: {
    fictionId: string
    chapterId: string
  }): Promise<void> {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      fictionId: input.fictionId,
      chapterId: input.chapterId,
      visitedAt: Date.now(),
    }

    return this.userStateRepository.addHistoryEntry(entry)
  }

  getHistory(): Promise<HistoryEntry[]> {
    return this.userStateRepository.getHistory()
  }

  getHistoryForFiction(
    fictionId: string,
  ): Promise<HistoryEntry[]> {
    return this.userStateRepository.getHistoryForFiction(
      fictionId,
    )
  }

  getSettings(): Promise<UserSettings[]> {
    return this.userStateRepository.getSettings()
  }

  getSetting<T>(key: string): Promise<T | null> {
    return this.userStateRepository.getSetting<T>(key)
  }

  saveSetting<T>(key: string, value: T): Promise<void> {
    return this.userStateRepository.saveSetting(key, value)
  }
}
