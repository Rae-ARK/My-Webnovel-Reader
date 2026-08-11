import { describe, expect, it } from 'vitest'

import type {
  Chapter,
  Fiction,
  FictionSummary,
} from '../../models/content'
import type {
  Bookmark,
  Favorite,
  HistoryEntry,
  ReadingProgress,
  UserSettings,
} from '../../models/user-state'

import { LibraryService } from '../library.service'
import { ReaderService } from '../reader.service'
import { SearchService } from '../search.service'
import { UserStateService } from '../user-state.service'
import {
  LocalSyncService,
  type SyncService,
} from '../sync.service'

import type { ContentRepositoryContract } from '../../repositories/contracts/ContentRepositoryContract'
import type { UserStateRepositoryContract } from '../../repositories/contracts/UserStateRepositoryContract'

const fiction: Fiction = {
  id: 'fiction-1',
  title: 'The Moonlit Archive',
  author: 'Test Author',
  cover: null,
  synopsis: 'A test fiction.',
  status: 'ongoing',
  genres: ['Fantasy'],
  tags: ['Magic'],
}

const chapters: Chapter[] = [
  {
    id: 'chapter-1',
    fictionId: 'fiction-1',
    number: 1,
    title: 'A Beginning',
    content: 'Chapter one content.',
  },
  {
    id: 'chapter-2',
    fictionId: 'fiction-1',
    number: 2,
    title: 'A Door',
    content: 'Chapter two content.',
  },
  {
    id: 'chapter-3',
    fictionId: 'fiction-1',
    number: 3,
    title: 'Tomorrow',
    content: 'Chapter three content.',
  },
]

const fictionSummary: FictionSummary = {
  ...fiction,
  chapterCount: chapters.length,
}

class FakeContentRepository implements ContentRepositoryContract {
  getFictionById(id: string): Fiction | null {
    return id === fiction.id ? fiction : null
  }

  listFictions(): FictionSummary[] {
    return [fictionSummary]
  }

  getChapter(id: string): Chapter | null {
    return chapters.find((chapter) => chapter.id === id) ?? null
  }

  listChaptersForFiction(fictionId: string): Chapter[] {
    return chapters.filter(
      (chapter) => chapter.fictionId === fictionId,
    )
  }

  searchFTS(query: string) {
    if (query.toLowerCase().includes('tomorrow')) {
      return [
        {
          fictionId: 'fiction-1',
          chapterId: 'chapter-3',
          chapterNumber: 3,
          chapterTitle: 'Tomorrow',
          fictionTitle: 'The Moonlit Archive',
          snippet: '  A book with tomorrow\'s date.  ',
        },
      ]
    }

    return []
  }
}

class FakeUserStateRepository implements UserStateRepositoryContract {
  private progress = new Map<string, ReadingProgress>()
  private favorites = new Map<string, Favorite>()
  private bookmarks = new Map<string, Bookmark>()
  private history: HistoryEntry[] = []
  private settings = new Map<string, UserSettings>()

  async getProgress(
    fictionId: string,
  ): Promise<ReadingProgress | null> {
    return this.progress.get(fictionId) ?? null
  }

  async saveProgress(progress: ReadingProgress): Promise<void> {
    this.progress.set(progress.fictionId, progress)
  }

  async getAllProgress(): Promise<ReadingProgress[]> {
    return [...this.progress.values()]
  }

  async toggleFavorite(fictionId: string): Promise<boolean> {
    if (this.favorites.has(fictionId)) {
      this.favorites.delete(fictionId)
      return false
    }

    this.favorites.set(fictionId, {
      fictionId,
      createdAt: Date.now(),
    })

    return true
  }

  async isFavorite(fictionId: string): Promise<boolean> {
    return this.favorites.has(fictionId)
  }

  async getFavorites(): Promise<Favorite[]> {
    return [...this.favorites.values()]
  }

  async addBookmark(bookmark: Bookmark): Promise<void> {
    this.bookmarks.set(bookmark.id, bookmark)
  }

  async removeBookmark(bookmarkId: string): Promise<void> {
    this.bookmarks.delete(bookmarkId)
  }

  async listBookmarks(): Promise<Bookmark[]> {
    return [...this.bookmarks.values()]
  }

  async listBookmarksForFiction(
    fictionId: string,
  ): Promise<Bookmark[]> {
    return [...this.bookmarks.values()].filter(
      (bookmark) => bookmark.fictionId === fictionId,
    )
  }

  async addHistoryEntry(entry: HistoryEntry): Promise<void> {
    this.history.push(entry)
  }

  async getHistory(): Promise<HistoryEntry[]> {
    return [...this.history].sort(
      (a, b) => b.visitedAt - a.visitedAt,
    )
  }

  async getHistoryForFiction(
    fictionId: string,
  ): Promise<HistoryEntry[]> {
    return [...this.history]
      .filter((entry) => entry.fictionId === fictionId)
      .sort((a, b) => b.visitedAt - a.visitedAt)
  }

  async getSettings(): Promise<UserSettings[]> {
    return [...this.settings.values()]
  }

  async getSetting<T>(key: string): Promise<T | null> {
    return (
      (this.settings.get(key)?.value as T | undefined) ?? null
    )
  }

  async saveSetting<T>(key: string, value: T): Promise<void> {
    this.settings.set(key, {
      key,
      value,
    })
  }
}

describe('LibraryService', () => {
  it('lists and filters fiction through a repository contract', async () => {
    const content = new FakeContentRepository()
    const userState = new FakeUserStateRepository()
    const service = new LibraryService(content, userState)

    expect(await service.listFictions()).toEqual([
      {
        ...fictionSummary,
        isFavorite: false,
      },
    ])

    expect(
      await service.listFictions({
        genre: 'Fantasy',
        tag: 'Magic',
        status: 'ongoing',
      }),
    ).toHaveLength(1)

    expect(
      await service.listFictions({
        genre: 'Romance',
      }),
    ).toEqual([])
  })

  it('includes favorite state', async () => {
    const content = new FakeContentRepository()
    const userState = new FakeUserStateRepository()
    const service = new LibraryService(content, userState)

    await userState.toggleFavorite('fiction-1')

    const result = await service.getFictionById('fiction-1')

    expect(result?.isFavorite).toBe(true)
    expect(result?.chapterCount).toBe(3)
  })
})

describe('ReaderService', () => {
  it('uses stable chapter IDs for previous and next navigation', () => {
    const content = new FakeContentRepository()
    const userState = new FakeUserStateRepository()
    const service = new ReaderService(content, userState)

    const result = service.getChapter(
      'fiction-1',
      'chapter-2',
    )

    expect(result?.chapter.id).toBe('chapter-2')
    expect(result?.previous?.id).toBe('chapter-1')
    expect(result?.next?.id).toBe('chapter-3')
  })

  it('rejects a chapter belonging to another fiction', () => {
    const content = new FakeContentRepository()
    const userState = new FakeUserStateRepository()
    const service = new ReaderService(content, userState)

    expect(
      service.getChapter('another-fiction', 'chapter-2'),
    ).toBeNull()
  })

  it('saves reading progress through the repository', async () => {
    const content = new FakeContentRepository()
    const userState = new FakeUserStateRepository()
    const service = new ReaderService(content, userState)

    await service.saveProgress({
      fictionId: 'fiction-1',
      chapterId: 'chapter-2',
      position: 420,
      updatedAt: 0,
    })

    const progress = await service.getProgress('fiction-1')

    expect(progress?.chapterId).toBe('chapter-2')
    expect(progress?.position).toBe(420)
    expect(progress?.updatedAt).toBeGreaterThan(0)
  })
})

describe('SearchService', () => {
  it('normalizes the query and search snippets', () => {
    const content = new FakeContentRepository()
    const service = new SearchService(content)

    const results = service.search('  tomorrow  ')

    expect(results).toHaveLength(1)
    expect(results[0].chapterId).toBe('chapter-3')
    expect(results[0].snippet).toBe(
      "A book with tomorrow's date.",
    )
  })

  it('returns no results for an empty query', () => {
    const content = new FakeContentRepository()
    const service = new SearchService(content)

    expect(service.search('   ')).toEqual([])
  })
})

describe('UserStateService', () => {
  it('handles favorites', async () => {
    const repository = new FakeUserStateRepository()
    const service = new UserStateService(repository)

    expect(await service.toggleFavorite('fiction-1')).toBe(true)
    expect(await service.isFavorite('fiction-1')).toBe(true)

    expect(await service.toggleFavorite('fiction-1')).toBe(false)
    expect(await service.isFavorite('fiction-1')).toBe(false)
  })

  it('handles bookmarks', async () => {
    const repository = new FakeUserStateRepository()
    const service = new UserStateService(repository)

    await service.addBookmark({
      fictionId: 'fiction-1',
      chapterId: 'chapter-2',
      position: 100,
      label: 'Important',
    })

    const bookmarks =
      await service.listBookmarksForFiction('fiction-1')

    expect(bookmarks).toHaveLength(1)
    expect(bookmarks[0].chapterId).toBe('chapter-2')

    await service.removeBookmark(bookmarks[0].id)

    expect(await service.listBookmarks()).toEqual([])
  })

  it('handles history and settings', async () => {
    const repository = new FakeUserStateRepository()
    const service = new UserStateService(repository)

    await service.addHistoryEntry({
      fictionId: 'fiction-1',
      chapterId: 'chapter-1',
    })

    expect(await service.getHistory()).toHaveLength(1)

    await service.saveSetting('fontSize', 18)

    expect(await service.getSetting<number>('fontSize')).toBe(18)
  })
})

describe('LocalSyncService', () => {
  it('implements the sync contract as a local no-op', async () => {
    const service: SyncService = new LocalSyncService()

    await expect(service.push()).resolves.toBeUndefined()
    await expect(service.pull()).resolves.toBeUndefined()
    await expect(
      service.resolveConflicts(),
    ).resolves.toBeUndefined()
  })
})
