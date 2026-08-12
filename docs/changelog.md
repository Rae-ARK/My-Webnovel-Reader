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

### Patch 6 — `logo-and-title-fix.patch`

**Files:** `src/components/layout/SiteHeader.vue`, `src/views/HomeView.vue`

Two visual bugs reported against a real `logo.png`:

- **Logo distortion.** Both places rendering `site.site.icon`
  (header brand mark, home hero) had matching `width` and `height`
  HTML attributes, forcing a square box regardless of the source
  image's actual proportions — a non-square logo got stretched to
  fit. Dropped `width`, kept `height` as the sizing anchor, and added
  `width: auto; object-fit: contain;` in CSS so the logo scales
  proportionally instead.
- **Home hero title wrapping.** "Horizon ARK Studio" wrapped onto two
  lines on narrow viewports. `.hero h1` had no `white-space` or
  `flex-wrap` control, and its font-size `clamp()` floor (`2.5rem`)
  was too large to fit on mobile widths. Added
  `flex-wrap: nowrap; white-space: nowrap;` and lowered the clamp
  floor to `1.5rem` so the title shrinks enough to stay on one line.

**Verification:**
- `npm run type-check` — 0 errors
- `npm run test` — 28/28 passing
- `npm run lint` — 10 pre-existing warnings, 0 errors, nothing new
- `npm run build` — succeeded

### Patch 7 — `stage6-frosted-glass-tokens.patch` (Fiction Page & Site Identity Redesign, Stage 6)

**Files:** `src/styles.css`, `src/components/layout/SiteHeader.vue`,
`src/components/layout/SiteFooter.vue`, `src/views/dev/ThemePreviewView.vue`

Implements Stage 6 of `docs/fiction-page-redesign-plan.md` — the
frosted-glass design tokens. See `docs/web-novel-reader-architecture.md`
§23c for the token reference and the usage convention.

- New tokens per theme (light/cream/dark) in `src/styles.css`:
  `--glass-bg`, `--glass-border` (~72%/~60% opacity respectively), and
  a shared `--glass-blur: 8px`.
- New `.glass-surface` utility class: opaque `var(--bg-elevated)` by
  default; enhanced to translucent + blurred only inside
  `@supports (backdrop-filter: blur(1px))`; a
  `prefers-reduced-transparency: reduce` block always wins regardless
  of support, forcing the opaque fallback back on.
- Applied to `SiteHeader.vue` and `SiteFooter.vue` only — the sidebar
  quick-actions card doesn't exist yet (Stage 7). Both components had
  their border shorthand (`border-bottom`/`border-top: 1px solid
  var(--border)`) split into `border-*-width` / `border-*-style`
  only, since the shorthand form implicitly resets `border-color` and
  would have fought the utility class's color.
- Added a "Surfaces" section to the dev `ThemePreviewView.vue`: a
  glass swatch against a striped backdrop (so the blur/translucency
  is actually visible against something) next to a plain-surface
  swatch for comparison, plus a note to simulate
  `prefers-reduced-transparency` in DevTools.

**What did NOT change:** no layout changes anywhere, and the
synopsis/reading surface/other body-text areas were left untouched,
per the plan's explicit scope for this stage. An initial `position:
sticky` added to the header was caught and reverted during review as
out of scope for a tokens-only stage.

**Verification:**
- `npm run type-check` — 0 errors
- `npm run test` — 28/28 passing
- `npm run lint` — 10 pre-existing warnings, 0 errors, nothing new
- `npm run build` — succeeded
- Regenerated as a true incremental diff on top of Patch 6 (both
  patches were originally `git diff`'d independently against the same
  clean clone, which meant Patch 7's `SiteHeader.vue` hunk still
  expected the pre-Patch-6 file and failed to apply after it).
  Verified on a fresh clone: `git apply logo-and-title-fix.patch &&
  git apply stage6-frosted-glass-tokens.patch` applies cleanly, then
  type-check and build both pass.

**Deliberately not touched, and why:**
- Sidebar quick-actions card — doesn't exist until Stage 7.
- `FictionView.vue` layout — Stage 7's job, not Stage 6's.
- Header structural redesign — explicitly deferred to Stage 8.

### Patch 8 — `stage7-fictionview-rebuild.patch` (Fiction Page & Site Identity Redesign, Stage 7)

**Files:** `src/views/FictionView.vue`, `src/config/author.schema.ts`,
`eslint.config.ts`, `docs/fiction-page-redesign-plan.md`,
`docs/web-novel-reader-architecture.md`

- Rebuilt `FictionView.vue`'s layout per Stage 7: a hero
  cover/title/author block with a compact status + genre + tag chip
  row, a line-clamped synopsis with a "Show more"/"Show less" toggle
  once it passes a length threshold, and a single primary action that
  now reads saved reading progress ("Continue Reading" to the last
  chapter vs. "Start Reading" to the first entry).
- Split the old combined actions row into: the hero's single primary
  CTA, and a new sidebar quick-actions card (favorite toggle + a
  compact continue-reading readout with a relative "Saved ⟨date⟩"
  line) — the quick-actions card is glass-treated per Stage 6's
  chrome scope, structure-only (`border-width`/`border-style`),
  letting `.glass-surface` own the color, same convention as the
  footer.
- Added a plain (non-glass, per Stage 6 scope) author card: avatar,
  name, bio, and social links from `author.ts` — no link out yet,
  since there's nowhere to link to until Stage 9's About Author page
  exists.
- Refreshed the index preview strip from plain text pills to small
  label cards (glyph + label), still using the existing intrinsic
  scroll/track approach from the earlier index-UI session.
- Added `author.backgroundImage` (optional, unset by default) to
  `author.schema.ts` for a decorative background on illustrated
  reading pages. `FictionView` probes the configured path with a
  plain image load before applying it as a CSS custom property, so an
  unset field or an unresolvable path falls back to the page's
  existing flat theme background — never a broken image. Added
  `Image` to `eslint.config.ts`'s allowed globals for the probe.
- Left `HomeView.vue` untouched; a new deferred Stage 10 was appended
  to the end of `docs/fiction-page-redesign-plan.md` to pick this
  option up there later, once Stage 8 (header) has landed.

**What did NOT change:** the header (Stage 8, separate follow-up), the
home page (deferred Stage 10, appended to the end of the plan doc),
and the About Author page (Stage 9, still not built — the author card
here has no outbound link because of that).

**Verification:**
- `npm run type-check` — 0 errors
- `npm run test` — 28/28 passing
- `npm run lint` — 0 errors (after adding `Image` to the allowed
  globals list)
- Manual review against the current single local fiction's full
  33-entry, 3-index shape is still blocked on the same not-yet-
  migrated local database noted under step 7/8 at the top of this
  log; the zero-index and single-index empty/minimal cases were
  reasoned through in the markup (`v-if="indexes.length"`, `v-if=
  "index.entries.length > 1"`) but not manually clicked through
  against real data.

### Patch 9 — `stage8-header-theme-toggle.patch` (Fiction Page & Site Identity Redesign, Stage 8)

**Files:** `src/components/layout/SiteHeader.vue`,
`src/components/layout/__tests__/SiteHeader.test.ts`,
`docs/fiction-page-redesign-plan.md`

Implements Stage 8 of `docs/fiction-page-redesign-plan.md`, choosing
**Option A** (keep the current minimal top bar, add a theme toggle,
lowest risk/smallest change) over Options B/C's structural header
redesigns.

- Added a theme-toggle `IconButton` to `SiteHeader.vue`, wrapped
  together with the existing `Library`/`Search` nav in a new
  `.header-actions` flex container so the brand block stays pinned
  left and both right-side actions share a `gap`.
- The toggle calls the existing `theme.store.ts`'s `setTheme`,
  cycling `light → cream → dark → light` via
  `themeStore.availableThemes` and a wrap-around index — no new
  store/state.
- Glyph shows the *current* theme (`☀`/`◐`/`☾`); `aria-label` names
  the theme a click switches *to* (e.g. `Switch to cream theme`),
  following the existing plain-Unicode-glyph IconButton convention
  used elsewhere (`Aa`, `×`, `←`, `→`, `⚙`) instead of adding an icon
  library for one control.
- `SiteHeader.test.ts` gained a `beforeEach` Pinia setup (needed once
  the component reads from a store) and two new cases: the default
  glyph/label, and the full three-click cycle back to light.
- Marked Stage 8 "Done" in `docs/fiction-page-redesign-plan.md`, with
  the Option A/B/C record kept for context and a short note on what
  changed and why the footer's separate three-button theme picker was
  left alone.

**What did NOT change:** the footer's existing theme picker, the
brand block and nav links (already matched Option A's description
before this patch), and no structural/layout header redesign — that
would have been Option B or C, not what this stage called for.

**Verification:**
- `npm run type-check` — 0 errors
- `npm run test` — 30/30 passing (28 prior + 2 new `SiteHeader` cases)
- `npm run lint` — 10 pre-existing warnings, 0 errors, nothing new
- `npm run build` — succeeded
- Manual check: default (light) shows `☀`/"Switch to cream theme";
  clicking cycles through all three themes and wraps back to light;
  toggle stays legible against the glass surface in all three themes.
