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
| 7 | Migrate the local working database | **Not started** — requires the author's real `scripts/novel.config.json` and source document, which are gitignored and only exist on the author's machine; cannot be done from this repo alone |
| 8 | Verify the fiction and reading entries | **Not started** — depends on step 7 |
| 9 | Implement the FictionView index UI | Done this session |
| 10 | Test touch/desktop index navigation and reader navigation | **Not started** — needs a real migrated database (step 7) to test against |

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

### Patch 3 — `fiction-index-ui.patch`

**Files:** `src/services/library.service.ts`, `src/stores/library.store.ts`,
`src/views/FictionView.vue`, `eslint.config.ts`

- `library.service.ts`: added `getIndexesForFiction()` (thin pass-through
  to `ContentRepositoryContract.listIndexesForFiction`) and
  `getFirstEntryId()`, which resolves a fiction's first readable entry
  from its actual entry sequence (`listEntriesForFiction()[0]`) instead
  of assuming an entry ID of `1`.
- `library.store.ts`: exposed both as store methods.
- `FictionView.vue`:
  - fixed the "Start reading" link, which previously pointed at the
    hardcoded, non-existent route `/read/:fictionId/1`. It now links to
    the resolved first entry ID and is hidden if no readable entry
    exists.
  - added an Index section rendering one card group per `FictionIndex`
    (title + its ordered entries), fully driven by `listIndexesForFiction`
    data — no ARC-specific or fiction-specific logic. A fiction with no
    explicit index sections still gets a UI because the importer/schema
    guarantees a default `Index` group.
  - entry labels prefer the `index_entries.label` override and fall back
    to `"{Type} {number}"` (matching `ReaderView`'s `entryEyebrow` logic)
    or the entry's own title when it has no number (interludes, extras,
    afterwords).
  - each index group scrolls horizontally with CSS scroll-snap, which is
    natively swipeable on touch; desktop gets explicit ‹ › buttons
    (`scrollIndex()`) that page the track, hidden under 700px since touch
    scrolling covers that case.
- `eslint.config.ts`: added `HTMLElement` to the existing browser-global
  allowlist (alongside `window`/`document`/`KeyboardEvent`), needed for
  the template `:ref` callback's type annotation.

**Verification:**
- `npm run type-check` — 0 errors
- `npm run test` — 18/18 passing
- `npm run lint` — 10 pre-existing warnings, 0 errors, nothing new
- `npm run build` — succeeded

**Deliberately not touched, and why:**
- Steps 7, 8, and 10 remain not started. They all require a database
  migrated from a real `novel.config.json` + source document, which are
  gitignored and exist only on the author's local machine — this session
  had no access to them and stayed within the blank/template constraint.

### Patch 4 — `index-assignment-fix.patch`

**Files:** `scripts/import-novel.py`

**Bug found while running step 7 locally:** the real source document
declares all of its index headings ("Index of ARC 1/2/3") consecutively
up front, each followed by a table-of-contents-style manifest of that
arc's chapters, with the actual readable chapter sections only
beginning after all three manifests. The importer's assignment logic
("every entry belongs to whichever index heading was most recently
seen in document order") assumed indexes and their entries were
interleaved. Against the TOC-block layout this put every real entry
under the last-declared index (`Index of ARC 3: 30 entries`, the other
two empty).

- `import-novel.py`: each index's own manifest lines are now scanned
  for chapter numbers (via the existing `CHAPTER_PATTERN`), giving that
  index a numeric range derived purely from what the author wrote in
  its own listing (e.g. a manifest mentioning chapters 6-13 owns that
  range) — nothing hardcoded to ARC, chapter counts, or this fiction.
  Real entries are bucketed by matching their own chapter number
  against these ranges; non-numbered entries (interludes, extras,
  afterwords) join whichever index most recently claimed a numbered
  chapter, so they land next to the chapter they follow in reading
  order.
  - Title text is intentionally *not* used for matching — the
    manifest's chapter-1 line and the real chapter-1 heading turned out
    to use different wording in the actual document, so number-based
    matching was necessary anyway.
  - If an index's manifest has no discoverable numbers at all (or a
    document has no manifests, i.e. the original interleaved layout),
    that index gets no numeric range and entry assignment falls back
    to the original declaration-order grouping, so both document
    layouts are handled by one generic pass.
- Verified against two synthetic documents built for this fix (not
  committed, sandbox-only): one matching the real TOC-block layout,
  one matching the old interleaved layout. Both produced correct
  index groupings, including correct placement of non-numbered entries
  adjacent to their preceding numbered chapter.
- Not yet verified against the real document/database — that's step 7,
  to be re-run locally.

### Patch 5 — `importer-config-and-safety-fixes.patch`

**Files:** `scripts/import-novel.py`, `scripts/novel.config.example.json`

Three fixes bundled together, found while preparing to re-run step 7:

1. **Regression: hardcoded local path ignored `config_path`.** A prior
   local edit replaced `config = load_config(config_path)` with a
   literal absolute path
   (`/media/raj-kumar/fast partition/my-svelte-project/scripts/novel.config.json`)
   and got committed. This silently discarded the `config_path`
   variable (and therefore any CLI-arg override) and hardcoded a
   machine-specific path into the tracked template. Reverted to
   `load_config(config_path)`.
2. **Bug: `synopsis` was never read from config.** The `fictions`
   INSERT used `TITLE` for both the `title` and `synopsis` columns, so
   every imported fiction's synopsis was just its own title repeated.
   Added `"synopsis"` to `REQUIRED_CONFIG_KEYS` (fails fast with a
   clear error if a config omits it), added
   `SYNOPSIS = config["synopsis"]`, and fixed the INSERT to use
   `SYNOPSIS`. `novel.config.example.json` gained a matching `synopsis`
   placeholder field with a note that `\n\n` produces paragraph breaks
   in the stored value. Real synopsis text stays in the gitignored
   `scripts/novel.config.json`, same as every other fiction-specific
   field.
3. **Safety net: no backup before overwrite.** Every run drops and
   recreates the content tables unconditionally. If `library.sqlite`
   already exists when the script runs, it's now copied to
   `library.sqlite.bak` (overwriting any previous backup) before the
   schema drop/rewrite touches it, so a bad run or bad source document
   never silently destroys the last known-good database.

**Verification:**
- `python3 -m py_compile scripts/import-novel.py` — no syntax errors
- Not yet run against the real document/database — folded into the
  step 7 re-run.
