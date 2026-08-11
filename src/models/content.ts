export type ContentEntryType =
  | 'chapter'
  | 'interlude'
  | 'extra'
  | 'afterword'

export interface Fiction {
  id: string
  title: string
  author: string
  cover: string | null
  synopsis: string
  status: 'ongoing' | 'completed' | 'hiatus'
  genres: string[]
  tags: string[]
}

export interface ContentEntry {
  id: string
  fictionId: string
  type: ContentEntryType
  number: number | null
  title: string
  content: string
}

export interface Index {
  id: string
  fictionId: string
  title: string
  position: number
}

export interface IndexEntry {
  indexId: string
  entryId: string
  position: number
  label: string | null
}

export interface FictionIndex extends Index {
  entries: Array<{
    entry: ContentEntry
    position: number
    label: string | null
  }>
}

export interface FictionSummary extends Fiction {
  entryCount: number
}
