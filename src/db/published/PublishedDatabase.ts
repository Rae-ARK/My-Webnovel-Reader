import initSqlJs, {
  type BindParams,
  type Database,
  type SqlJsStatic,
} from 'sql.js'

export class PublishedDatabase {
  private sql: SqlJsStatic | null = null
  private database: Database | null = null

  async load(databaseUrl: string): Promise<void> {
    if (this.database) {
      return
    }

    const wasmResponse = await fetch('/sql-wasm/sql-wasm.wasm')

    if (!wasmResponse.ok) {
      throw new Error(
        `Failed to load SQLite WASM: ${wasmResponse.status} ${wasmResponse.statusText}`,
      )
    }

    const wasmBinary = await wasmResponse.arrayBuffer()

    this.sql = await initSqlJs({
      locateFile: (file: string) => `/sql-wasm/${file}`,
      wasmBinary,
    })

    const response = await fetch(databaseUrl)

    if (!response.ok) {
      throw new Error(
        `Failed to load published database: ${response.status} ${response.statusText}`,
      )
    }

    const buffer = await response.arrayBuffer()
    this.database = new this.sql.Database(new Uint8Array(buffer))
  }

  query<T extends object>(
    sql: string,
    params: BindParams = [],
  ): T[] {
    const database = this.getDatabase()
    const statement = database.prepare(sql)

    try {
      statement.bind(params)

      const rows: T[] = []

      while (statement.step()) {
        rows.push(statement.getAsObject() as T)
      }

      return rows
    } finally {
      statement.free()
    }
  }

  get<T extends object>(
    sql: string,
    params: BindParams = [],
  ): T | null {
    const rows = this.query<T>(sql, params)
    return rows[0] ?? null
  }

  private getDatabase(): Database {
    if (!this.database) {
      throw new Error(
        'PublishedDatabase has not been loaded. Call load() first.',
      )
    }

    return this.database
  }
}
