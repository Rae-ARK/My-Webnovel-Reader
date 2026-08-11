# Web Novel Reader — Implementation Plan

Companion to `web-novel-reader-architecture.md`.

This breaks the build into stages, each shippable and testable on its own, following a service-oriented separation-of-concerns structure:

```text
routes/components → stores → services → repositories → db
     (UI)            (state)   (logic)    (data)    (storage)
```

The project uses **Vue 3 + TypeScript + Vite**. The architecture is framework-aware only at the UI/state boundary. Services and repositories remain plain TypeScript wherever practical.

---

## Rules That Apply to Every Stage

### 1. Dependency direction

The normal dependency direction is:

```text
Vue components/routes
        ↓
     Pinia stores
        ↓
     services
        ↓
   repositories
        ↓
       db
```

This is a dependency direction, not a ceremonial requirement that every operation pass through every layer.

A small operation does not need unnecessary layers merely to satisfy a diagram.

### 2. UI does not access storage directly

Vue components must never access SQLite, IndexedDB, `localStorage`, or other persistence mechanisms directly.

Components call stores.

Stores call services.

Services call repositories.

Repositories call the database layer.

Exceptions are allowed only for genuinely UI-local concerns such as temporary component state.

### 3. Published content is immutable

The bundled/published SQLite database is **read-only by design**.

There must be no application API capable of modifying published novel content.

```text
                 PUBLISHED CONTENT
                       │
                       ▼
                  SQLite WASM
                       │
                    READ ONLY
                       │
                       ▼
                    Reader
                       │
                       ▼
                   USER DATA
                       │
                       ▼
                  IndexedDB
                    READ/WRITE
                       │
                       ▼
                 Optional Drive
```

This is an API-level boundary, not merely a convention.

### 4. No boilerplate for its own sake

Use a generic repository abstraction only where it removes real duplication.

Hand-written repositories and services are preferred when a generic abstraction would obscure the actual domain operations.

### 5. Components are built bottom-up

Build:

```text
atoms → molecules → layouts → pages
```

All components consume the same design tokens and primitives.

Do not style individual pages ad hoc and retrofit a design system later.

### 6. Browser-only APIs stay browser-only

SQLite WASM, IndexedDB, Google Identity Services, service workers, and similar browser-dependent APIs must not be evaluated during server-side build/prerender execution.

Keep browser-only initialization behind appropriate client-side boundaries or dynamic imports.

---

# Stage 0 — Project Scaffolding

## Goal

Create an empty but correctly structured **Vue 3 + TypeScript + Vite** application.

### Stack

* Vue 3
* TypeScript
* Vite
* Vue Router
* Pinia
* Tailwind CSS
* ESLint
* Prettier
* strict TypeScript configuration
* static deployment configuration

### Folder skeleton

Use the project's established structure, approximately:

```text
src/
├── components/
├── routes/
├── stores/
├── services/
├── repositories/
├── db/
├── models/
├── utils/
├── config/
└── ...
```

Content/configuration assets should live outside normal UI code where appropriate:

```text
static/
└── content/
```

### Site configuration

Provide a typed site configuration loader.

Example conceptual configuration:

```text
site.title
site.author
site.description
site.url
site.theme
site.content.database
site.sync.enabled
```

Validate configuration at build time using a small schema library such as Zod or a hand-written validator.

A malformed author/site configuration should fail the build rather than producing a broken reader.

### Output

The application boots and renders a minimal shell displaying:

```text
site.title
```

No features yet.

---

# Stage 1 — Design System & Theming

This comes before application features so every later screen consumes the same visual system.

## Three themes

The reader has exactly **three themes**:

### `light`

Conventional light UI with a neutral/light background.

### `cream`

Warm off-white / sepia-leaning reading environment intended for long-form reading.

### `dark`

Dark reading environment with appropriate contrast and reduced visual glare.

Theme selection is represented by:

```html
<html data-theme="light">
<html data-theme="cream">
<html data-theme="dark">
```

Do not implement themes using Tailwind's dark-mode branching.

## Theme tokens

Use CSS custom properties for semantic design tokens.

At minimum:

```text
--bg
--bg-elevated
--bg-surface
--text
--text-muted
--text-subtle
--accent
--accent-hover
--border
--focus-ring
--text-on-accent
```

Add spacing, typography, radius, and similar tokens where useful.

Components should consume semantic variables rather than hardcoded theme-specific values.

For example:

```css
background: var(--bg-elevated);
color: var(--text);
border-color: var(--border);
```

not:

```css
background: #ffffff;
```

## Theme state

Implement a small Pinia-based theme store.

During Stage 1, persistence may use browser `localStorage` as a temporary implementation.

When Stage 3's `UserStateService` exists, persistence should move behind that service without changing the UI-facing theme API.

Do not make Stage 1 depend on a future Stage 3 implementation.

## Primitive component library

Create theme-aware primitives under the project's UI component directory.

At minimum:

```text
Button
IconButton
Card
Input
Select
Slider
Toggle
Modal
Skeleton
Spinner
```

Additional primitives may be added when a real requirement appears.

Each primitive should:

* consume theme tokens
* expose typed props/events
* handle keyboard/focus states appropriately
* avoid feature-specific business logic
* avoid direct storage access

## Theme preview

Create:

```text
/dev/theme-preview
```

The page renders every primitive under all three themes.

This is a development-only route and should be removed or disabled before production.

## Output

A complete themeable UI kit with:

* light
* cream
* dark

and no application-specific reader features yet.

---

# Stage 2 — Data Layer

Two independent storage tracks exist.

---

## Stage 2a — Published Content

### `PublishedDatabase`

Implement a thin browser-side wrapper around SQLite WASM/sql.js.

Responsibilities:

* load the bundled `library.sqlite`
* expose read operations such as `query()` and `get()`
* provide no write API

The application must not be able to mutate the published database through the repository/database interfaces.

### `ContentRepository`

Expose typed domain methods only:

```text
getFictionById()
listFictions()
getChapter()
listChaptersForFiction()
searchFTS()
```

Raw SQL must not leak into components or services.

### Mock content

Create a development database containing:

* 2–3 fictional works
* metadata
* several chapters per work
* genres/tags
* chapter ordering
* stable IDs

---

## Stage 2b — Reader Personal State

Use IndexedDB through a small helper library where practical.

Stores should cover:

```text
progress
bookmarks
favorites
history
settings
```

### `UserStateRepository`

Typed methods should include operations such as:

```text
getProgress()
saveProgress()
toggleFavorite()
getFavorites()
addBookmark()
removeBookmark()
listBookmarks()
addHistoryEntry()
getHistory()
getSettings()
saveSettings()
```

The exact API should follow actual domain needs rather than being artificially symmetrical.

## Output

Both repositories are independently testable.

There is still no requirement for a full UI.

---

# Stage 3 — Services Layer

Services contain business logic and remain framework-agnostic plain TypeScript wherever possible.

---

## `LibraryService`

Responsible for:

* listing fiction
* filtering
* sorting
* combining published metadata with favorite state
* preparing library/continue-reading data

---

## `ReaderService`

Responsible for:

* fetching chapters
* resolving previous/next chapters
* using stable `chapterId` values
* saving reading progress
* debouncing progress writes
* determining chapter navigation

Never determine chapter navigation from array position alone.

Stable identifiers are authoritative.

---

## `SearchService`

Responsible for:

* querying `ContentRepository.searchFTS()`
* ranking results
* preparing highlighted snippets
* normalizing search input

---

## `UserStateService`

Responsible for:

* favorites
* bookmarks
* history
* reading progress
* settings

Components and stores should not know the underlying IndexedDB schema.

---

## `SyncService`

Define a framework-independent interface:

```text
push()
pull()
resolveConflicts()
```

Provide a local/no-op implementation initially.

Google Drive is not part of the core architecture.

---

## Dependency injection

Keep the dependency graph in one small container:

```text
src/container.ts
```

Use constructor injection so services can be tested with fake repositories.

Do not introduce a full dependency-injection framework.

## Output

The application's core business logic is testable without Vue routes or components.

---

# Stage 4 — Pinia Stores

Create thin domain stores.

Examples:

```text
library.store.ts
reader.store.ts
favorites.store.ts
settings.store.ts
theme.store.ts
```

The exact naming convention should follow the project's established Vue conventions.

Each store should:

* call services
* hold reactive state
* expose actions
* expose derived state/getters where useful

Stores must not contain business logic that belongs in services.

If a store starts doing substantial calculations or domain decisions, move that work into a service.

## Output

The reactive state layer is ready for application pages.

---

# Stage 5 — Core Routes

Build the actual reader using only:

```text
Stage 1 primitives
+
Stage 4 stores
```

---

## `/`

Landing/library home.

Include:

* library grid
* continue-reading rail when data exists
* featured/recent content where applicable

Create a reusable:

```text
FictionCard
```

molecule.

The same component should be reusable in:

* home library
* search results
* other fiction lists

Do not create visually similar duplicate card components for each page.

---

## `/library`

Full fiction browser.

Support:

* genre filters
* tag filters
* status filters
* sorting
* pagination/load-more if eventually needed

---

## `/fiction/:id`

Fiction detail page.

Include:

* title
* author
* cover
* synopsis
* genres
* tags
* status
* chapter count
* chapter list
* favorite control

### Crawler/indexable content

The important metadata must exist in meaningful HTML, not only inside client-generated UI state.

The page should provide:

* semantic heading structure
* novel title
* author
* synopsis
* genres/tags
* status
* chapter information
* canonical URL
* appropriate document metadata

---

## `/read/:fictionId/:chapterId`

Reader page.

Include:

* novel title
* chapter title
* chapter number
* chapter content
* reader controls
* font size
* line height
* theme
* previous chapter
* next chapter
* bookmark controls where implemented

Navigation must resolve through stable `chapterId` values.

---

# Crawler / SEO Architecture

Crawler-facing content is a **first-class requirement**, not a final-stage trick.

The application should make meaningful textual information available to crawlers and search engines while keeping the reader UI clean.

## Principle

Do not create deceptive hidden SEO text using:

```css
display: none;
visibility: hidden;
font-size: 0;
opacity: 0;
```

or equivalent techniques intended to provide materially different content to crawlers than users.

Instead, make useful information part of the semantic document.

Examples:

* proper headings
* synopsis text
* author information
* genre/tag information
* chapter titles
* chapter text
* semantic navigation
* accessible labels
* metadata
* canonical URLs

## Chapter pages

A chapter page should expose the actual chapter text in the generated/prerendered HTML wherever the deployment architecture permits.

Do not make the crawler depend on JavaScript executing before the novel content exists.

The reader controls can enhance the page, but the core textual content should remain real document content.

## Metadata

Where supported by the static rendering architecture, generate:

```text
<title>
<meta name="description">
<link rel="canonical">
Open Graph metadata
Twitter/social metadata where useful
structured data where appropriate
```

Novel metadata should be generated from published content rather than duplicated manually across routes.

## Crawler-specific supporting text

Where additional explanatory text is useful, it may be included as genuine semantic/accessibility content.

Examples include:

```text
"Chapter 12 of Novel Title by Author Name."
"Read Chapter 12 online."
"Novel Title is a fantasy web novel..."
```

The goal is to make the page understandable when extracted as plain text.

The system should not attempt to present one fictional document to crawlers and a materially different document to readers.

---

# Stage 6 — Reader Personal Features

Implement:

## Bookmarks

* add bookmark
* remove bookmark
* list bookmarks
* jump to bookmark
* persist location where useful

## Reading history

Display recently read fiction/chapters using stored timestamps.

## Continue Reading

Home page displays the most recently updated reading positions.

Sort by:

```text
updatedAt
```

rather than insertion order.

## Progress

Automatically save reading progress:

* while scrolling
* after a debounce interval
* on reader navigation
* on component/page unmount where reliable

Progress should be resilient to rapid navigation and repeated writes.

## Output

A complete anonymous single-reader experience.

Everything works without an account or backend.

---

# Stage 7 — Search

Enable FTS5 in the author/content build pipeline.

The application itself consumes the resulting SQLite search index.

## Search UI

Provide:

* search input
* debounce
* result ranking
* highlighted snippets
* fiction/chapter context
* navigation to matching content

Search results should reuse existing content components rather than creating a second visual system.

## Output

Full-text search across published content.

---

# Stage 8 — Optional Google Sign-In + Drive Sync

Google functionality is optional and must not become a dependency of the core reader.

## Authentication

Use Google Identity Services for optional user identification.

## Drive authorization

Authentication and Drive authorization are separate concerns.

Signing in does not automatically imply broad Drive access.

Request only the minimum Drive scope necessary for reader-state synchronization.

## Sync

Implement the real `SyncService` using a state file such as:

```text
StoryReader/state.json
```

The exact format should be versioned.

Possible conflict strategy:

* version counter
* timestamps
* last-write-wins for simple settings
* deterministic merging for collections such as bookmarks/favorites where practical

## Anonymous mode

Must remain fully functional when:

```text
sync.enabled = false
```

or when the user declines Google authorization.

No feature from Stages 0–7 should require Google.

---

# Stage 9 — Offline / PWA Enhancement

This stage is optional because the core application already stores personal state locally.

Add:

* service worker
* application-shell caching
* bundled SQLite caching
* cover/image caching
* offline availability indicator

Later enhancement:

```text
download this novel
```

for selective per-novel offline access.

The offline layer must not alter the published-content immutability boundary.

---

# Stage 10 — Polish, SEO Audit & Deployment

## Content versioning

Compare installed content version against the published content version.

If a newer content database is available, prompt the user to refresh/update.

---

## Accessibility

Audit:

* keyboard navigation
* focus visibility
* semantic headings
* labels
* screen-reader behavior
* contrast in all three themes
* reader controls
* dialogs/modals
* touch targets
* reduced-motion behavior where appropriate

The three themes must all meet the intended contrast requirements.

---

## SEO / crawler audit

Verify:

* meaningful page titles
* descriptions
* canonical URLs
* semantic headings
* crawlable fiction metadata
* crawlable chapter metadata
* crawlable chapter text
* internal chapter navigation
* clean URLs
* appropriate structured metadata
* no accidental JS-only content dependency
* no deceptive hidden text

Test the generated static HTML itself rather than assuming the Vue application will eventually produce the right result after hydration.

---

## Production cleanup

Remove:

```text
/dev/theme-preview
```

or protect it from production exposure.

Remove mock content.

Validate the production SQLite database.

Check asset paths and static deployment behavior.

---

## Deployment

Deploy to the selected static hosting platform.

The deployment must support:

* static assets
* generated HTML
* SQLite WASM asset loading
* novel/cover content
* client-side routing fallback where necessary

---

# Suggested Build Order

```text
Stage 0   Foundation
    ↓
Stage 1   Visual system + UI primitives + 3 themes
    ↓
Stage 2   SQLite + IndexedDB
    ↓
Stage 3   Business logic
    ↓
Stage 4   Pinia reactive state
    ↓
Stage 5   Core library + fiction + reader
    ↓
Stage 6   Personal reader features
    ↓
Stage 7   Full-text search
    ↓
Stage 8   Optional Google + Drive
    ↓
Stage 9   Optional PWA/offline enhancement
    ↓
Stage 10  SEO + accessibility + versioning + deployment
```

---

# Definition of a V1

Stages **0–7** constitute a complete deployable single-reader application:

* Vue 3
* TypeScript
* static deployment
* three themes
* fiction library
* fiction detail pages
* chapter reader
* immutable bundled published content
* IndexedDB personal state
* favorites
* bookmarks
* history
* reading progress
* continue reading
* full-text search
* semantic/indexable fiction pages
* crawlable chapter content
* no account required
* no backend required

Stages 8 and 9 remain optional enhancements.

---

# Architectural Boundaries

The final architecture should preserve these boundaries:

```text
                    PUBLISHED CONTENT

                     library.sqlite
                           │
                           ▼
                    PublishedDatabase
                           │
                       READ ONLY
                           │
                           ▼
                   ContentRepository
                           │
                           ▼
                    Domain Services
                           │
                           ▼
                       Pinia
                           │
                           ▼
                    Vue Application
                           │
                           │
                           ▼
                    Rendered HTML
                     /           \
                    /             \
               Readers          Crawlers
```

Personal state follows a separate path:

```text
                     Vue Application
                           │
                        Pinia
                           │
                        Services
                           │
                  UserStateRepository
                           │
                           ▼
                      IndexedDB
                           │
                           ▼
                   Optional SyncService
                           │
                           ▼
                      Google Drive
```

The published database and user database must never be conflated.

The reader can consume published content without being granted any capability to modify it.

---

# Final Architectural Principle

The application is fundamentally a **static, client-side web-novel reader with immutable published content and locally owned reader state**.

Cloud synchronization is optional.

Authentication is optional.

PWA functionality is optional.

The reader itself is not optional.

The architecture should therefore remain fully useful with:

```text
Browser
+
Static files
+
SQLite WASM
+
IndexedDB
```

and nothing else.
