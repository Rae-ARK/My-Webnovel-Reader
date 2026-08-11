# Implementation Plan

Companion to `web-novel-reader-architecture.md`. This breaks the build into
stages, each shippable and testable on its own, following a service-oriented,
separation-of-concerns structure:

```
routes/components  →  stores  →  services  →  repositories  →  db
   (UI, dumb)         (state)   (logic)      (data access)   (storage)
```

Rules that apply to every stage:

- **UI components never touch SQLite/IndexedDB directly.** They call stores;
  stores call services; services call repositories; repositories call the db
  layer. No layer reaches two levels down.
- **No boilerplate for its own sake.** One `Repository<T>`-style generic where
  it removes duplication; hand-written code where a generic would just
  obscure things.
- **Components are built bottom-up (atoms → molecules → layouts → pages)**
  so nothing above Stage 1 is styled ad hoc — everything consumes the same
  primitives and theme tokens.
- **Every stage ends with something runnable**, even if content is mocked.

---

## Stage 0 — Project Scaffolding

Goal: empty but correctly-shaped SvelteKit app.

- `npm create svelte@latest` → SvelteKit + TypeScript + Vite, adapter-static
  (Cloudflare Pages) from day one so deployment assumptions are correct early.
- Tailwind CSS (utility layer only — no component classes baked into markup
  beyond primitives, see Stage 1).
- ESLint + Prettier, strict `tsconfig`.
- Folder skeleton exactly matching §20 of the architecture doc:
  `routes/`, `lib/components/`, `lib/services/`, `lib/repositories/`,
  `lib/db/`, `lib/models/`, `lib/stores/`, `lib/utils/`, `config/`, `static/content/`.
- `site.config.reader` loader (§4) — typed, validated with a small `zod` (or
  hand-rolled) schema so a bad author config fails at build time, not runtime.

**Output:** app boots, shows a blank shell page reading `site.title` from config.

---

## Stage 1 — Design System & Theming

This comes _before_ features so nothing gets built twice.

- **Theme tokens as CSS custom properties**, three sets:
  - `light` — normal light mode
  - `cream` — off-white/sepia-leaning light mode (your third mode)
  - `dark`
- Tokens cover: background layers (`--bg`, `--bg-elevated`), text
  (`--text`, `--text-muted`), accent, border, focus ring — not just colors,
  so components never hardcode a hex value.
- Theme applied via a `data-theme` attribute on `<html>`, no Tailwind dark:
  variant hacks — keeps theme count at 3 without branching logic per component.
- `themeStore` (Svelte 5 runes) — persists choice via `UserStateService`
  (Stage 3) once that exists; hardcoded default until then.
- **Primitive component library** (`lib/components/ui/`): `Button`, `IconButton`,
  `Card`, `Input`, `Select`, `Slider` (for font size / line height), `Toggle`,
  `Modal`, `Skeleton`, `Spinner`. Each is theme-aware for free because it only
  ever reads CSS variables.
- A `/dev/theme-preview` route rendering every primitive in all 3 themes —
  throwaway but very useful for the rest of the build, delete before launch.

**Output:** a themeable component kit, provably correct in all 3 modes, with zero features yet.

---

## Stage 2 — Data Layer (db + repositories)

Two independent tracks, per architecture §9–10, §21:

**2a. Published content (read-only)**

- `lib/db/PublishedDatabase.ts` — thin wrapper around `sql.js` / SQLite WASM:
  load `library.sqlite` from `config.content.database`, expose `query()`/`get()`.
- `lib/repositories/ContentRepository.ts` — typed methods only
  (`getFictionById`, `listFictions`, `getChapter`, `listChaptersForFiction`,
  `searchFTS`) — no raw SQL leaks past this file.

**2b. Reader personal state**

- `lib/db/UserStateDatabase.ts` — wrapper around `idb` (small IndexedDB
  helper lib, avoids hand-rolled boilerplate) with stores for
  `progress`, `bookmarks`, `favorites`, `history`, `settings`.
- `lib/repositories/UserStateRepository.ts` — typed methods
  (`getProgress`, `saveProgress`, `toggleFavorite`, `addBookmark`, …).

Mock `library.sqlite` with 2–3 fictions and a handful of chapters for local dev.

**Output:** both repositories independently unit-testable, no UI yet.

---

## Stage 3 — Services Layer

Business logic, framework-agnostic (plain TS classes/functions — could
theoretically run outside Svelte):

- `LibraryService` — list/filter/sort fictions, combine with favorite status.
- `ReaderService` — fetch chapter, resolve next/prev by stable `chapterId`
  (§18, never by array index), save progress after a debounced interval.
- `SearchService` — wraps `ContentRepository.searchFTS`, adds ranking/highlighting.
- `UserStateService` — favorites, bookmarks, history, settings; sits in front
  of `UserStateRepository` so components never see IndexedDB shapes.
- `SyncService` — stubbed interface (`push()`, `pull()`, `resolveConflicts()`)
  with a no-op/local implementation until Stage 8 (Google Drive).

Each service takes its repository via constructor injection — makes testing
with fakes trivial and keeps the DI graph in one place (`lib/container.ts`,
~20 lines, not a full DI framework).

**Output:** full app logic exists and is testable without a single route built.

---

## Stage 4 — Stores (reactive glue)

- Thin Svelte 5 rune-based stores per domain: `library.svelte.ts`,
  `reader.svelte.ts`, `favorites.svelte.ts`, `settings.svelte.ts`, `theme.svelte.ts`.
- Each store's only job: call a service, hold the reactive result, expose
  actions. No business logic here — if a store starts doing math, that logic
  belongs in a service instead.

**Output:** reactive state layer ready to bind to pages.

---

## Stage 5 — Core Routes

Now components assemble from Stage 1 primitives + Stage 4 stores:

- `/` — landing / library grid (`FictionCard` molecule, reused in search
  results and "continue reading" rail — one component, three contexts).
- `/library` — full browsable list, filters by tag/genre/status.
- `/fiction/[id]` — synopsis, chapter list, cover, favorite toggle.
- `/read/[fictionId]/[chapterId]` — chapter text, font/theme/line-height
  controls (bind straight to `settingsStore`), prev/next by `chapterId`.

**Output:** a fully click-through-able reader on mock content, 3 themes, no persistence gaps.

---

## Stage 6 — Reader Personal Features

- Bookmarks UI (add/remove/jump-to, from `UserStateService`).
- Reading history view.
- "Continue Reading" rail on the home page (last N by `updatedAt`).
- Auto-save progress on scroll/unmount, debounced.

**Output:** feature-complete for a single anonymous reader, fully offline-capable already (IndexedDB needs no network).

---

## Stage 7 — Search

- Enable FTS5 on the SQLite build side (author tooling, not app code).
- `SearchService` → search bar component with debounce + highlighted results.

---

## Stage 8 — Optional Google Sign-In + Drive Sync

- Google Identity Services for auth (optional, gated by `config.sync.enabled`).
- Real `SyncService` implementation: read/write `StoryReader/state.json` (§13),
  last-write-wins or simple version-counter merge.
- Sync remains additive — anonymous mode (Stage 6) keeps working untouched if
  the author disables sync or the user declines.

---

## Stage 9 — Offline / PWA (optional enhancement, §15–16)

- Service worker caching app shell + `library.sqlite` + covers.
- "Available offline" indicator; optional per-novel download later.

---

## Stage 10 — Polish & Deploy

- Content versioning check (§17) — compare installed vs. published version, prompt refresh.
- Accessibility pass (focus states, contrast in all 3 themes, keyboard nav for reader controls).
- Delete `/dev/theme-preview`.
- Cloudflare Pages deploy config, README rewrite with the actual author workflow (§22).

---

## Suggested build order recap

```
0 Scaffolding → 1 Theming/UI kit → 2 Data layer → 3 Services →
4 Stores → 5 Core routes → 6 Personal features → 7 Search →
8 Google sync (optional) → 9 Offline/PWA (optional) → 10 Polish/deploy
```

Stages 0–6 alone produce a complete, deployable, offline-capable single-reader
app with no optional features — a sensible place to pause and ship a v1.

---

## Amendments (pre-implementation review)

A review of this plan before build start surfaced a few corrections, folded
in here as the canonical guidance for the stages above.

**Browser-only initialization.** SvelteKit + `adapter-static` + `sql.js`
needs careful browser-only initialization. SQLite WASM, IndexedDB, Google
Identity Services, and service workers all depend on browser APIs. Keep
those imports behind client-side boundaries (`browser` checks / dynamic
`import()` in `onMount`, never top-level in a module SvelteKit could
evaluate during SSR or prerendering) rather than letting the build touch
them at all.

**Google Sign-In and Drive authorization are separate concerns.** They can
appear in one user-facing flow at Stage 8, but they are not the same thing.
Sign-In identifies the user; Drive authorization is a separate, narrower
grant. Request the minimum Drive scope necessary — not broader Drive access
than the sync feature actually needs.

**Layers are a dependency direction, not a mandate.** The
`routes → stores → services → repositories → db` chain describes which way
dependencies point, not a ceremonial requirement that every read pass
through all five. This plan's own "no boilerplate for its own sake" rule
already covers it: a tiny settings getter doesn't need a procession through
every layer to return a number.

**`PublishedDatabase` is immutable by design (Stage 2a).** The reader must
have no code path capable of writing to the author's SQLite database — not
as a convention, but as an API-level guarantee. This is arguably the most
important boundary in the whole architecture:

```text
                  PUBLISHED DATA
                       │
                       ▼
                 SQLite WASM
                       │
                    READ ONLY
                       │
                       ▼
                    Reader
                  USER DATA
                       │
                       ▼
                   IndexedDB
                       │
                 READ + WRITE
                       │
                       ▼
                optional Drive
```

Stage ordering is otherwise unchanged and confirmed sound — notably, keeping
Google Drive out of the core architecture means Stages 0–7 remain fully
independent of Google, so the "no backend" promise never quietly becomes
"no backend except the one we backed into."

```text
Stage 0   foundation
Stage 1   visual system
Stage 2   storage
Stage 3   business logic
Stage 4   reactive state
Stage 5   actual reader
Stage 6   reader personalization
Stage 7   search
Stage 8   optional cloud
Stage 9   optional offline enhancement
Stage 10  production
```
