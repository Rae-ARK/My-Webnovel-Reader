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
  /**
   * Publish timestamp (ms epoch), shown as a relative "released X ago"
   * value in the fiction index table. Optional and `undefined` today —
   * `content_entries` has no such column yet, so `ContentRepository`
   * never populates it. Modeled here ahead of that migration so the
   * index UI has a real field to read instead of fabricating dates;
   * the table falls back to an em dash until a column exists.
   */
  releasedAt?: number | null
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
