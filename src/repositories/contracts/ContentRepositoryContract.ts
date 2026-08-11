import type {
  Chapter,
  Fiction,
  FictionSummary,
} from '../../models/content'

export interface ContentRepositoryContract {
  getFictionById(id: string): Fiction | null
  listFictions(): FictionSummary[]
  getChapter(id: string): Chapter | null
  listChaptersForFiction(fictionId: string): Chapter[]
  searchFTS(query: string): Array<{
    fictionId: string
    chapterId: string
    chapterNumber: number
    chapterTitle: string
    fictionTitle: string
    snippet: string
  }>
}
