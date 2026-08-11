import { PublishedDatabase } from "./db/published/PublishedDatabase";
import { ContentRepository } from "./repositories/ContentRepository";
import { UserStateRepository } from "./repositories/UserStateRepository";
import { LibraryService } from "./services/library.service";
import { ReaderService } from "./services/reader.service";
import { SearchService } from "./services/search.service";
import { UserStateService } from "./services/user-state.service";
import { LocalSyncService, type SyncService } from "./services/sync.service";

export interface AppContainer {
  initialize(): Promise<void>;
  contentRepository: ContentRepository;
  userStateRepository: UserStateRepository;
  libraryService: LibraryService;
  readerService: ReaderService;
  searchService: SearchService;
  userStateService: UserStateService;
  syncService: SyncService;
}

export function createContainer(): AppContainer {
  const publishedDatabase = new PublishedDatabase();
  const contentRepository = new ContentRepository(publishedDatabase);
  const userStateRepository = new UserStateRepository();

  return {
    async initialize() {
      await contentRepository.load();
    },
    contentRepository,
    userStateRepository,
    libraryService: new LibraryService(contentRepository, userStateRepository),
    readerService: new ReaderService(contentRepository, userStateRepository),
    searchService: new SearchService(contentRepository),
    userStateService: new UserStateService(userStateRepository),
    syncService: new LocalSyncService(),
  };
}

export const appContainer = createContainer();
