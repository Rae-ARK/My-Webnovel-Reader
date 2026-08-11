import type { ContentEntry } from '../models/content'
import type { ContentRepositoryContract } from '../repositories/contracts/ContentRepositoryContract'

export interface SearchResult {
  fictionId: string
  entryId: string
  entryNumber: number | null
  entryType: ContentEntry['type']
  entryTitle: string
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
          a.entryTitle.toLocaleLowerCase() === queryLower

        const bTitleMatch =
          b.fictionTitle.toLocaleLowerCase() === queryLower ||
          b.entryTitle.toLocaleLowerCase() === queryLower

        if (aTitleMatch !== bTitleMatch) {
          return aTitleMatch ? -1 : 1
        }

        return (
          a.fictionTitle.localeCompare(
            b.fictionTitle,
            undefined,
            { sensitivity: 'base' },
          ) ||
          // Not every entry is a numbered chapter (interludes, extras,
          // and afterwords may have no number), so entries without one
          // sort after numbered ones within the same fiction.
          (a.entryNumber ?? Number.MAX_SAFE_INTEGER) -
            (b.entryNumber ?? Number.MAX_SAFE_INTEGER)
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
