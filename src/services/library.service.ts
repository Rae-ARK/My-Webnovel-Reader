import type {
  Fiction,
  FictionSummary,
} from '../models/content'
import type { ContentRepositoryContract } from '../repositories/contracts/ContentRepositoryContract'
import type { UserStateRepositoryContract } from '../repositories/contracts/UserStateRepositoryContract'

export interface LibraryFilters {
  genre?: string
  tag?: string
  status?: Fiction['status']
}

export interface LibraryItem extends FictionSummary {
  isFavorite: boolean
}

export class LibraryService {
  constructor(
    private readonly contentRepository: ContentRepositoryContract,
    private readonly userStateRepository: UserStateRepositoryContract,
  ) {}

  listFictions(filters: LibraryFilters = {}): Promise<LibraryItem[]> {
    const fictions = this.contentRepository.listFictions()

    return this.withFavoriteState(
      this.filterFictions(fictions, filters),
    )
  }

  async getFictionById(
    fictionId: string,
  ): Promise<LibraryItem | null> {
    const fiction = this.contentRepository.getFictionById(fictionId)

    if (!fiction) {
      return null
    }

    return {
      ...fiction,
      chapterCount: this.getChapterCount(fictionId),
      isFavorite:
        await this.userStateRepository.isFavorite(fictionId),
    }
  }

  async getContinueReading(): Promise<
    Array<{
      fiction: FictionSummary
      chapterId: string
      position: number
      updatedAt: number
    }>
  > {
    const progress = await this.userStateRepository.getAllProgress()

    const items = progress
      .map((entry) => {
        const fiction = this.contentRepository.getFictionById(
          entry.fictionId,
        )

        if (!fiction) {
          return null
        }

        return {
          fiction: {
            ...fiction,
            chapterCount: this.getChapterCount(fiction.id),
          },
          chapterId: entry.chapterId,
          position: entry.position,
          updatedAt: entry.updatedAt,
        }
      })
      .filter(
        (
          item,
        ): item is {
          fiction: FictionSummary
          chapterId: string
          position: number
          updatedAt: number
        } => item !== null,
      )

    return items.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  private filterFictions(
    fictions: FictionSummary[],
    filters: LibraryFilters,
  ): FictionSummary[] {
    return fictions.filter((fiction) => {
      if (
        filters.genre &&
        !fiction.genres.includes(filters.genre)
      ) {
        return false
      }

      if (
        filters.tag &&
        !fiction.tags.includes(filters.tag)
      ) {
        return false
      }

      if (
        filters.status &&
        fiction.status !== filters.status
      ) {
        return false
      }

      return true
    })
  }

  private async withFavoriteState(
    fictions: FictionSummary[],
  ): Promise<LibraryItem[]> {
    const favorites = await this.userStateRepository.getFavorites()
    const favoriteIds = new Set(
      favorites.map((favorite) => favorite.fictionId),
    )

    return fictions.map((fiction) => ({
      ...fiction,
      isFavorite: favoriteIds.has(fiction.id),
    }))
  }

  private getChapterCount(fictionId: string): number {
    return this.contentRepository.listChaptersForFiction(
      fictionId,
    ).length
  }
}
