import type {
  Chapter,
  Fiction,
  FictionSummary,
} from '../models/content'
import { PublishedDatabase } from '../db/published/PublishedDatabase'
import type { ContentRepositoryContract } from './contracts/ContentRepositoryContract'

interface FictionRow {
  id: string
  title: string
  author: string
  cover: string | null
  synopsis: string
  status: Fiction['status']
}

interface ChapterRow {
  id: string
  fiction_id: string
  number: number
  title: string
  content: string
}

interface FictionSummaryRow extends FictionRow {
  chapter_count: number
}

interface NameRow {
  name: string
}

export class ContentRepository implements ContentRepositoryContract {
  constructor(private readonly database: PublishedDatabase) {}

  async load(databaseUrl = '/content/library.sqlite'): Promise<void> {
    await this.database.load(databaseUrl)
  }

  getFictionById(id: string): Fiction | null {
    const row = this.database.get<FictionRow>(
      `
        SELECT
          id,
          title,
          author,
          cover,
          synopsis,
          status
        FROM fictions
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    )

    if (!row) {
      return null
    }

    return this.mapFiction(row)
  }

  listFictions(): FictionSummary[] {
    const rows = this.database.query<FictionSummaryRow>(
      `
        SELECT
          id,
          title,
          author,
          cover,
          synopsis,
          status,
          chapter_count
        FROM fiction_summary
        ORDER BY title COLLATE NOCASE ASC
      `,
    )

    return rows.map((row) => ({
      ...this.mapFiction(row),
      chapterCount: row.chapter_count,
    }))
  }

  getChapter(id: string): Chapter | null {
    const row = this.database.get<ChapterRow>(
      `
        SELECT
          id,
          fiction_id,
          number,
          title,
          content
        FROM chapters
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    )

    if (!row) {
      return null
    }

    return this.mapChapter(row)
  }

  listChaptersForFiction(fictionId: string): Chapter[] {
    const rows = this.database.query<ChapterRow>(
      `
        SELECT
          id,
          fiction_id,
          number,
          title,
          content
        FROM chapters
        WHERE fiction_id = ?
        ORDER BY number ASC
      `,
      [fictionId],
    )

    return rows.map((row) => this.mapChapter(row))
  }

  searchFTS(query: string): Array<{
    fictionId: string
    chapterId: string
    chapterNumber: number
    chapterTitle: string
    fictionTitle: string
    snippet: string
  }> {
    const normalizedQuery = query.trim()

    if (!normalizedQuery) {
      return []
    }

    const rows = this.database.query<{
      fiction_id: string
      chapter_id: string
      chapter_number: number
      chapter_title: string
      fiction_title: string
      snippet: string
    }>(
      `
        SELECT
          chapters.fiction_id AS fiction_id,
          chapters.id AS chapter_id,
          chapters.number AS chapter_number,
          chapters.title AS chapter_title,
          fictions.title AS fiction_title,
          substr(chapters.content, 1, 240) AS snippet
        FROM chapters
        INNER JOIN fictions
          ON fictions.id = chapters.fiction_id
        WHERE chapters.content LIKE ?
           OR chapters.title LIKE ?
           OR fictions.title LIKE ?
        ORDER BY
          fictions.title COLLATE NOCASE ASC,
          chapters.number ASC
        LIMIT 50
      `,
      [`%${normalizedQuery}%`, `%${normalizedQuery}%`, `%${normalizedQuery}%`],
    )

    return rows.map((row) => ({
      fictionId: row.fiction_id,
      chapterId: row.chapter_id,
      chapterNumber: row.chapter_number,
      chapterTitle: row.chapter_title,
      fictionTitle: row.fiction_title,
      snippet: row.snippet,
    }))
  }

  private mapFiction(row: FictionRow): Fiction {
    return {
      id: row.id,
      title: row.title,
      author: row.author,
      cover: row.cover,
      synopsis: row.synopsis,
      status: row.status,
      genres: this.getGenres(row.id),
      tags: this.getTags(row.id),
    }
  }

  private mapChapter(row: ChapterRow): Chapter {
    return {
      id: row.id,
      fictionId: row.fiction_id,
      number: row.number,
      title: row.title,
      content: row.content,
    }
  }

  private getGenres(fictionId: string): string[] {
    const rows = this.database.query<NameRow>(
      `
        SELECT genres.name
        FROM genres
        INNER JOIN fiction_genres
          ON fiction_genres.genre_id = genres.id
        WHERE fiction_genres.fiction_id = ?
        ORDER BY genres.name COLLATE NOCASE ASC
      `,
      [fictionId],
    )

    return rows.map((row) => row.name)
  }

  private getTags(fictionId: string): string[] {
    const rows = this.database.query<NameRow>(
      `
        SELECT tags.name
        FROM tags
        INNER JOIN fiction_tags
          ON fiction_tags.tag_id = tags.id
        WHERE fiction_tags.fiction_id = ?
        ORDER BY tags.name COLLATE NOCASE ASC
      `,
      [fictionId],
    )

    return rows.map((row) => row.name)
  }
}
