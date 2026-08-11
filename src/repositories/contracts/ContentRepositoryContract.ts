import type {
  ContentEntry,
  Fiction,
  FictionIndex,
  FictionSummary,
} from '../../models/content'

export interface ContentRepositoryContract {
  getFictionById(id: string): Fiction | null
  listFictions(): FictionSummary[]

  getEntry(id: string): ContentEntry | null
  listEntriesForFiction(fictionId: string): ContentEntry[]

  getIndex(indexId: string): FictionIndex | null
  listIndexesForFiction(fictionId: string): FictionIndex[]

  searchFTS(query: string): Array<{
    fictionId: string
    entryId: string
    entryNumber: number | null
    entryType: ContentEntry['type']
    entryTitle: string
    fictionTitle: string
    snippet: string
  }>
}
