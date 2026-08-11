import type { ContentRepositoryContract } from '../repositories/contracts/ContentRepositoryContract'

export interface SearchResult {
  fictionId: string
  chapterId: string
  chapterNumber: number
  chapterTitle: string
  fictionTitle: string
  snippet: string
}

export class SearchService {
  constructor(
    private readonly contentRepository: ContentRepositoryContract,
  ) {}

  search(query: string): SearchResult[] {
    const normalizedQuery = this.normalizeQuery(query)

    if (!normalizedQuery) {
      return []
    }

    const results =
      this.contentRepository.searchFTS(normalizedQuery)

    return results
      .map((result) => ({
        ...result,
        snippet: this.normalizeSnippet(result.snippet),
      }))
      .sort((a, b) => {
        const queryLower = normalizedQuery.toLocaleLowerCase()

        const aTitleMatch =
          a.fictionTitle.toLocaleLowerCase() === queryLower ||
          a.chapterTitle.toLocaleLowerCase() === queryLower

        const bTitleMatch =
          b.fictionTitle.toLocaleLowerCase() === queryLower ||
          b.chapterTitle.toLocaleLowerCase() === queryLower

        if (aTitleMatch !== bTitleMatch) {
          return aTitleMatch ? -1 : 1
        }

        return (
          a.fictionTitle.localeCompare(
            b.fictionTitle,
            undefined,
            { sensitivity: 'base' },
          ) ||
          a.chapterNumber - b.chapterNumber
        )
      })
  }

  private normalizeQuery(query: string): string {
    return query.trim().replace(/\s+/g, ' ')
  }

  private normalizeSnippet(snippet: string): string {
    return snippet.trim().replace(/\s+/g, ' ')
  }
}
