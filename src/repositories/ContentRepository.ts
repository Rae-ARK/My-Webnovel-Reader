import type {
  ContentEntry,
  Fiction,
  FictionIndex,
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

interface ContentEntryRow {
  id: string
  fiction_id: string
  type: ContentEntry['type']
  number: number | null
  title: string
  content: string
}

interface FictionSummaryRow extends FictionRow {
  entry_count: number
}

interface IndexRow {
  id: string
  fiction_id: string
  title: string
  position: number
}

interface IndexEntryRow {
  index_id: string
  entry_id: string
  position: number
  label: string | null
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

    return row ? this.mapFiction(row) : null
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
          entry_count
        FROM fiction_summary
        ORDER BY title COLLATE NOCASE ASC
      `,
    )

    return rows.map((row) => ({
      ...this.mapFiction(row),
      entryCount: row.entry_count,
    }))
  }

  getEntry(id: string): ContentEntry | null {
    const row = this.database.get<ContentEntryRow>(
      `
        SELECT
          id,
          fiction_id,
          type,
          number,
          title,
          content
        FROM content_entries
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    )

    return row ? this.mapEntry(row) : null
  }

  listEntriesForFiction(fictionId: string): ContentEntry[] {
    const rows = this.database.query<ContentEntryRow>(
      `
        SELECT
          id,
          fiction_id,
          type,
          number,
          title,
          content
        FROM content_entries
        WHERE fiction_id = ?
        ORDER BY
          CASE WHEN number IS NULL THEN 1 ELSE 0 END,
          number ASC,
          rowid ASC
      `,
      [fictionId],
    )

    return rows.map((row) => this.mapEntry(row))
  }

  getIndex(indexId: string): FictionIndex | null {
    const index = this.database.get<IndexRow>(
      `
        SELECT
          id,
          fiction_id,
          title,
          position
        FROM indexes
        WHERE id = ?
        LIMIT 1
      `,
      [indexId],
    )

    if (!index) {
      return null
    }

    return this.mapIndex(index)
  }

  listIndexesForFiction(fictionId: string): FictionIndex[] {
    const indexes = this.database.query<IndexRow>(
      `
        SELECT
          id,
          fiction_id,
          title,
          position
        FROM indexes
        WHERE fiction_id = ?
        ORDER BY position ASC
      `,
      [fictionId],
    )

    return indexes.map((index) => this.mapIndex(index))
  }

  searchFTS(query: string): Array<{
    fictionId: string
    entryId: string
    entryNumber: number | null
    entryType: ContentEntry['type']
    entryTitle: string
    fictionTitle: string
    snippet: string
  }> {
    const normalizedQuery = query.trim()

    if (!normalizedQuery) {
      return []
    }

    const rows = this.database.query<{
      fiction_id: string
      entry_id: string
      entry_number: number | null
      entry_type: ContentEntry['type']
      entry_title: string
      fiction_title: string
      snippet: string
    }>(
      `
        SELECT
          content_entries.fiction_id AS fiction_id,
          content_entries.id AS entry_id,
          content_entries.number AS entry_number,
          content_entries.type AS entry_type,
          content_entries.title AS entry_title,
          fictions.title AS fiction_title,
          substr(content_entries.content, 1, 240) AS snippet
        FROM content_entries
        INNER JOIN fictions
          ON fictions.id = content_entries.fiction_id
        WHERE content_entries.content LIKE ?
           OR content_entries.title LIKE ?
           OR fictions.title LIKE ?
        ORDER BY
          fictions.title COLLATE NOCASE ASC,
          content_entries.rowid ASC
        LIMIT 50
      `,
      [
        `%${normalizedQuery}%`,
        `%${normalizedQuery}%`,
        `%${normalizedQuery}%`,
      ],
    )

    return rows.map((row) => ({
      fictionId: row.fiction_id,
      entryId: row.entry_id,
      entryNumber: row.entry_number,
      entryType: row.entry_type,
      entryTitle: row.entry_title,
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

  private mapEntry(row: ContentEntryRow): ContentEntry {
    return {
      id: row.id,
      fictionId: row.fiction_id,
      type: row.type,
      number: row.number,
      title: row.title,
      content: row.content,
    }
  }

  private mapIndex(index: IndexRow): FictionIndex {
    const rows = this.database.query<IndexEntryRow>(
      `
        SELECT
          index_entries.index_id,
          index_entries.entry_id,
          index_entries.position,
          index_entries.label
        FROM index_entries
        WHERE index_entries.index_id = ?
        ORDER BY index_entries.position ASC
      `,
      [index.id],
    )

    return {
      id: index.id,
      fictionId: index.fiction_id,
      title: index.title,
      position: index.position,
      entries: rows
        .map((row) => {
          const entry = this.getEntry(row.entry_id)

          if (!entry) {
            return null
          }

          return {
            entry,
            position: row.position,
            label: row.label,
          }
        })
        .filter(
          (
            item,
          ): item is {
            entry: ContentEntry
            position: number
            label: string | null
          } => item !== null,
        ),
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
