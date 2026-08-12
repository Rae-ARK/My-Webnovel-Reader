import { PublishedDatabase } from "./db/published/PublishedDatabase";
import { ContentRepository } from "./repositories/ContentRepository";
import { UserStateRepository } from "./repositories/UserStateRepository";
import { AuthorNotesRepository } from "./repositories/AuthorNotesRepository";
import { LibraryService } from "./services/library.service";
import { ReaderService } from "./services/reader.service";
import { SearchService } from "./services/search.service";
import { UserStateService } from "./services/user-state.service";
import { LocalSyncService, type SyncService } from "./services/sync.service";

export interface AppContainer {
  initialize(): Promise<void>;
  contentRepository: ContentRepository;
  userStateRepository: UserStateRepository;
  authorNotesRepository: AuthorNotesRepository;
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
  const authorNotesRepository = new AuthorNotesRepository();

  return {
    async initialize() {
      await contentRepository.load();
    },
    contentRepository,
    userStateRepository,
    authorNotesRepository,
    libraryService: new LibraryService(contentRepository, userStateRepository),
    readerService: new ReaderService(
      contentRepository,
      userStateRepository,
      authorNotesRepository,
    ),
    searchService: new SearchService(contentRepository),
    userStateService: new UserStateService(userStateRepository),
    syncService: new LocalSyncService(),
  };
}

export const appContainer = createContainer();
