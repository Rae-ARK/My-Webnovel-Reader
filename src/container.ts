import { PublishedDatabase } from './db/published/PublishedDatabase'
import { ContentRepository } from './repositories/ContentRepository'
import { UserStateRepository } from './repositories/UserStateRepository'
import { LibraryService } from './services/library.service'
import { ReaderService } from './services/reader.service'
import { SearchService } from './services/search.service'
import { UserStateService } from './services/user-state.service'
import {
  LocalSyncService,
  type SyncService,
} from './services/sync.service'

export interface AppContainer {
  contentRepository: ContentRepository
  userStateRepository: UserStateRepository
  libraryService: LibraryService
  readerService: ReaderService
  searchService: SearchService
  userStateService: UserStateService
  syncService: SyncService
}

export function createContainer(): AppContainer {
  const publishedDatabase = new PublishedDatabase()
  const contentRepository = new ContentRepository(
    publishedDatabase,
  )
  const userStateRepository = new UserStateRepository()

  const libraryService = new LibraryService(
    contentRepository,
    userStateRepository,
  )

  const readerService = new ReaderService(
    contentRepository,
    userStateRepository,
  )

  const searchService = new SearchService(
    contentRepository,
  )

  const userStateService = new UserStateService(
    userStateRepository,
  )

  const syncService = new LocalSyncService()

  return {
    contentRepository,
    userStateRepository,
    libraryService,
    readerService,
    searchService,
    userStateService,
    syncService,
  }
}
