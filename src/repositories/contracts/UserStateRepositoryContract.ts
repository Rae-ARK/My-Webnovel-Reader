import type {
  Bookmark,
  Favorite,
  HistoryEntry,
  ReadingProgress,
  UserSettings,
} from '../../models/user-state'

export interface UserStateRepositoryContract {
  getProgress(
    fictionId: string,
  ): Promise<ReadingProgress | null>

  saveProgress(progress: ReadingProgress): Promise<void>

  getAllProgress(): Promise<ReadingProgress[]>

  toggleFavorite(fictionId: string): Promise<boolean>

  isFavorite(fictionId: string): Promise<boolean>

  getFavorites(): Promise<Favorite[]>

  addBookmark(bookmark: Bookmark): Promise<void>

  removeBookmark(bookmarkId: string): Promise<void>

  listBookmarks(): Promise<Bookmark[]>

  listBookmarksForFiction(
    fictionId: string,
  ): Promise<Bookmark[]>

  addHistoryEntry(entry: HistoryEntry): Promise<void>

  getHistory(): Promise<HistoryEntry[]>

  getHistoryForFiction(
    fictionId: string,
  ): Promise<HistoryEntry[]>

  getSettings(): Promise<UserSettings[]>

  getSetting<T>(key: string): Promise<T | null>

  saveSetting<T>(key: string, value: T): Promise<void>
}
