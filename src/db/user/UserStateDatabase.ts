import { openDB, type IDBPDatabase } from 'idb'
import type {
  Bookmark,
  Favorite,
  HistoryEntry,
  ReadingProgress,
  UserSettings,
} from '../../models/user-state'

const DATABASE_NAME = 'web-novel-reader'
const DATABASE_VERSION = 1

interface UserStateSchema {
  progress: ReadingProgress
  bookmarks: Bookmark
  favorites: Favorite
  history: HistoryEntry
  settings: UserSettings
}

export type UserStateDatabase = IDBPDatabase<UserStateSchema>

let databasePromise: Promise<UserStateDatabase> | null = null

export function getUserStateDatabase(): Promise<UserStateDatabase> {
  if (!databasePromise) {
    databasePromise = openDB<UserStateSchema>(
      DATABASE_NAME,
      DATABASE_VERSION,
      {
        upgrade(database) {
          const progress = database.createObjectStore('progress', {
            keyPath: 'fictionId',
          })

          progress.createIndex('updatedAt', 'updatedAt')

          const bookmarks = database.createObjectStore('bookmarks', {
            keyPath: 'id',
          })

          bookmarks.createIndex('fictionId', 'fictionId')
          bookmarks.createIndex('chapterId', 'chapterId')
          bookmarks.createIndex('createdAt', 'createdAt')

          const favorites = database.createObjectStore('favorites', {
            keyPath: 'fictionId',
          })

          favorites.createIndex('createdAt', 'createdAt')

          const history = database.createObjectStore('history', {
            keyPath: 'id',
          })

          history.createIndex('fictionId', 'fictionId')
          history.createIndex('visitedAt', 'visitedAt')

          database.createObjectStore('settings', {
            keyPath: 'key',
          })
        },
      },
    )
  }

  return databasePromise
}
