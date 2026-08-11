export interface ReadingProgress {
  fictionId: string
  chapterId: string
  position: number
  updatedAt: number
}

export interface Bookmark {
  id: string
  fictionId: string
  chapterId: string
  position: number
  createdAt: number
  label: string | null
}

export interface Favorite {
  fictionId: string
  createdAt: number
}

export interface HistoryEntry {
  id: string
  fictionId: string
  chapterId: string
  visitedAt: number
}

export interface UserSettings {
  key: string
  value: unknown
}
