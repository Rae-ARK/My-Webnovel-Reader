import type {
  Bookmark,
  Favorite,
  HistoryEntry,
  ReadingProgress,
  UserSettings,
} from '../models/user-state'
import { getUserStateDatabase } from '../db/user/UserStateDatabase'
import type { UserStateRepositoryContract } from './contracts/UserStateRepositoryContract'

export class UserStateRepository implements UserStateRepositoryContract {
  async getProgress(fictionId: string): Promise<ReadingProgress | null> {
    const database = await getUserStateDatabase()
    return (await database.get('progress', fictionId)) ?? null
  }

  async saveProgress(progress: ReadingProgress): Promise<void> {
    const database = await getUserStateDatabase()
    await database.put('progress', progress)
  }

  async getAllProgress(): Promise<ReadingProgress[]> {
    const database = await getUserStateDatabase()

    return database.getAllFromIndex(
      'progress',
      'updatedAt',
    )
  }

  async toggleFavorite(fictionId: string): Promise<boolean> {
    const database = await getUserStateDatabase()
    const existing = await database.get('favorites', fictionId)

    if (existing) {
      await database.delete('favorites', fictionId)
      return false
    }

    const favorite: Favorite = {
      fictionId,
      createdAt: Date.now(),
    }

    await database.put('favorites', favorite)
    return true
  }

  async isFavorite(fictionId: string): Promise<boolean> {
    const database = await getUserStateDatabase()
    return (await database.get('favorites', fictionId)) !== undefined
  }

  async getFavorites(): Promise<Favorite[]> {
    const database = await getUserStateDatabase()

    return database.getAllFromIndex(
      'favorites',
      'createdAt',
    )
  }

  async addBookmark(bookmark: Bookmark): Promise<void> {
    const database = await getUserStateDatabase()
    await database.put('bookmarks', bookmark)
  }

  async removeBookmark(bookmarkId: string): Promise<void> {
    const database = await getUserStateDatabase()
    await database.delete('bookmarks', bookmarkId)
  }

  async listBookmarks(): Promise<Bookmark[]> {
    const database = await getUserStateDatabase()

    return database.getAllFromIndex(
      'bookmarks',
      'createdAt',
    )
  }

  async listBookmarksForFiction(
    fictionId: string,
  ): Promise<Bookmark[]> {
    const database = await getUserStateDatabase()

    return database.getAllFromIndex(
      'bookmarks',
      'fictionId',
      fictionId,
    )
  }

  async addHistoryEntry(entry: HistoryEntry): Promise<void> {
    const database = await getUserStateDatabase()
    await database.put('history', entry)
  }

  async getHistory(): Promise<HistoryEntry[]> {
    const database = await getUserStateDatabase()

    const entries = await database.getAllFromIndex(
      'history',
      'visitedAt',
    )

    return entries.reverse()
  }

  async getHistoryForFiction(
    fictionId: string,
  ): Promise<HistoryEntry[]> {
    const database = await getUserStateDatabase()

    const entries = await database.getAllFromIndex(
      'history',
      'fictionId',
      fictionId,
    )

    return entries.sort((a, b) => b.visitedAt - a.visitedAt)
  }

  async getSettings(): Promise<UserSettings[]> {
    const database = await getUserStateDatabase()
    return database.getAll('settings')
  }

  async getSetting<T>(key: string): Promise<T | null> {
    const database = await getUserStateDatabase()
    const setting = await database.get('settings', key)

    return setting ? (setting.value as T) : null
  }

  async saveSetting<T>(
    key: string,
    value: T,
  ): Promise<void> {
    const database = await getUserStateDatabase()

    await database.put('settings', {
      key,
      value,
    })
  }
}
