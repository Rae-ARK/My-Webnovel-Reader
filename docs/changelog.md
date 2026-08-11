# Web Novel Reader — Changelog & Progress Log

Session scope: migrate the content model from a hardcoded "chapter" concept
to a generic `ContentEntry` + `Index` model, per the appendix handoff.

---

## Progress against the handoff plan

| # | Step | Status |
|---|------|--------|
| 1 | Inspect `scripts/import-novel.py` | Done |
| 2 | Inspect all chapter/content usages | Done |
| 3 | Design new database/content model | Done (already present in repo at session start) |
| 4 | Update TypeScript models/contracts | Done (already present in repo at session start) |
| 5 | Update repository/services | Done this session |
| 6 | Update the importer/database generation | Done this session |
| 7 | Migrate the local working database | **Not started** — needs to be run locally with the new importer + a real `scripts/novel.config.json` |
| 8 | Verify the fiction and reading entries | **Not started** — depends on step 7 |
| 9 | Implement the FictionView index UI | Not started |
| 10 | Test touch/desktop index navigation and reader navigation | Not started |

Known open issue carried forward: `FictionView.vue`'s "Start reading" link
still points at a hardcoded `/read/:fictionId/1`, which does not correspond
to a real entry ID under the new schema. Left as-is because fixing it
properly means resolving the fiction's first readable entry, which is part
of step 9 (index UI), not this migration.

---

## Changelog

### Patch 1 — `config-driven-importer.patch`

**Files:** `.gitignore`, `scripts/import-novel.py`, `scripts/novel.config.example.json` (new)

- Removed all fiction-specific hardcoding from the importer:
  - the three literal `"Index of ARC 1/2/3"` titles
  - the `chapter_number <= 5 / <= 13 / else` arc-boundary logic
  - the hardcoded title-to-arc special cases
  - the `expected_counts = [7, 9, 14]` assertion
- Indexes are now derived purely from the source document's own structure:
  any heading matching `INDEX_PATTERN` starts a new index using that
  heading's own text as the title; entries are assigned to whichever index
  precedes them in document order.
- Added a default index (titled exactly `Index`) that lazily catches any
  entries appearing before the document declares its first explicit index
  heading, or all entries if the document declares none.
- Author-specific fields (`fiction_id`, `title`, `author`, `status`,
  `cover`, `docx` source path) now come from a config file
  (`scripts/novel.config.json`) instead of being hardcoded constants.
  `scripts/novel.config.example.json` was added as a committed template;
  the real config is gitignored.
- `.gitignore` updated to exclude `scripts/novel.config.json`.

### Patch 2 — `entry-api-migration.patch`

**Files:** `src/services/library.service.ts`, `src/services/reader.service.ts`,
`src/services/search.service.ts`, `src/stores/reader.store.ts`,
`src/views/ReaderView.vue`, `src/views/SearchView.vue`,
`src/views/FictionView.vue`, `src/components/molecules/FictionCard.vue`,
`src/services/__tests__/services.test.ts`,
`src/views/__tests__/SearchView.test.ts`

- `reader.service.ts`: replaced the removed `Chapter`/`ReaderChapter`/
  `ChapterNavigation`/`getChapter` API with `ContentEntry`/`ReaderEntry`/
  `EntryNavigation`/`getEntry`. Previous/next navigation now walks the
  fiction's actual entry sequence, not an assumed numbered-chapter list.
  Added `getEntryTitle()`.
- `reader.store.ts`: `loadChapter` renamed to `loadEntry`; exposes
  `getEntryTitle`.
- `search.service.ts`: `SearchResult` now carries `entryId`,
  `entryNumber` (nullable), `entryType`, `entryTitle`; sort comparator
  made null-safe for entries without a chapter number (interludes,
  extras, afterwords).
- `library.service.ts`: `chapterCount` renamed to `entryCount`.
- `ReaderView.vue`:
  - reads `reader.current.entry` instead of the removed `.chapter`
  - added `entryEyebrow`, a generic label ("Chapter 5" / "Interlude" /
    "Afterword", etc.) replacing the hardcoded "Chapter {number}" text
  - fixed a pre-existing bug where bookmarks on entries other than the
    current one displayed a raw ID string instead of a title —
    `bookmarkLabel()` now resolves the real title through the store
  - generalized "Loading chapter…" / "Chapter unavailable" copy
- `SearchView.vue`: results rendered via `entryId`/`entryLabel()` instead
  of a hardcoded "Chapter N: title" format.
- `FictionView.vue`, `FictionCard.vue`: `fiction.chapterCount` renamed to
  `fiction.entryCount`.
- `services.test.ts`: `FakeContentRepository` rewritten against the
  current contract (`getEntry`, `listEntriesForFiction`, `getIndex`,
  `listIndexesForFiction`); all fixtures and assertions renamed from
  `chapter-*` to `entry-*`.
- `SearchView.test.ts`: mocks and assertions updated to the entry-based
  result shape.

**Verification (before packaging the patch):**
- `npm run type-check` — 0 errors
- `npm run test` — 18/18 passing
- `npm run build` — succeeded
- `npm run lint` — 10 pre-existing warnings, 0 errors, nothing new introduced

**Deliberately not touched, and why:**
- `ContinueReadingCard.vue`, `HomeView.vue`, `user-state.service.ts`, and
  the `chapterId` fields in `models/user-state.ts` — these belong to the
  IndexedDB reader-state schema (progress/bookmarks/history), a separate
  concern from the content-side Chapter API. Renaming those fields would
  be a storage-schema migration, not a Chapter-API cleanup, and wasn't
  broken by this change.
