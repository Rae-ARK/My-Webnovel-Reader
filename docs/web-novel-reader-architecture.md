# Web Novel Reader App Architecture

## 1. Project Goal

A reusable, read-only web novel reader template.

The repository is a generic Svelte application that can be cloned for an individual author's web novel site.

The author supplies the content and author-specific configuration.

The application itself does not require a backend.

### Core idea

```text
Author content
     ↓
Static deployment or author's storage
     ↓
Svelte Reader
     ↓
Reader's browser
     ├── IndexedDB: personal state
     └── optional Google Drive: synced personal state
```

The app is primarily a **reader**, not a writing/manuscript management system.

---

## 2. Product Model

The reader should provide:

- fiction/library browsing
- chapter navigation
- chapter reading
- search
- bookmarks
- favorites
- reading progress
- continue reading
- reading history
- font size controls
- line spacing controls
- light/dark/sepia themes
- optional text-to-speech
- responsive mobile/desktop UI
- offline-friendly local state
- optional Google account integration
- optional Google Drive synchronization

The reader does **not** need:

- author accounts
- a custom backend
- REST API
- server database
- publishing dashboard
- writing editor
- manuscript management
- server-side user sessions

---

## 3. Deployment Model

The application is a static Svelte application.

It can be deployed to:

- Cloudflare Pages
- GitHub Pages
- Netlify
- Vercel static hosting
- any static web server
- another CDN

Cloudflare Pages is the intended default.

```text
GitHub repository
       ↓
Static build
       ↓
Cloudflare Pages
       ↓
Public web novel reader
```

No server runtime is required for the basic application.

---

## 4. Author-Specific Configuration

The template should separate application code from author-specific information.

Example:

```text
src/
├── config/
│   └── site.config.reader
├── lib/
├── routes/
└── ...
```

The unusual extension is intentional. For example:

```text
site.config.reader
```

The build system can import it as a TypeScript/JavaScript module or transform it during the build.

Example conceptual configuration:

```ts
export default {
	site: {
		title: 'My Web Novel',
		author: 'Author Name',
		description: 'A collection of web novels.'
	},

	content: {
		source: 'deployment',
		database: '/content/library.sqlite',
		assets: '/content/assets/'
	},

	reader: {
		defaultTheme: 'dark',
		defaultFontSize: 18,
		defaultLineHeight: 1.7,
		enableTTS: true
	},

	sync: {
		enabled: true,
		provider: 'google-drive'
	}
};
```

---

## 5. Content Can Live in Different Places

The template should support configurable content sources.

### Option A: Content Directly in the Deployment

```text
Cloudflare Pages
├── index.html
├── assets/
├── content/
│   ├── library.sqlite
│   └── covers/
│       ├── novel-a.webp
│       └── novel-b.webp
└── ...
```

The reader downloads the SQLite database and required assets directly from the deployment.

This is the simplest deployment model.

### Option B: Content Hosted Separately

```text
Svelte reader
     │
     └── config
           │
           └── contentBaseUrl
                    ↓
              Public content
```

Content could be hosted on:

- Cloudflare R2
- another CDN
- another static site
- a public object store

### Option C: Author-Controlled Google Drive Content

An author could store publication data in their own Google Drive:

```text
Author's Google Drive
└── MyNovel/
    ├── library.sqlite
    └── covers/
        ├── cover.webp
        └── ...
```

However, browser access to private Google Drive content requires authentication and Drive API authorization.

Therefore this is different from public static deployment.

If author content is intended to be public and discoverable without login, static hosting or a public object/CDN source is simpler.

Google Drive is better suited to:

- private author storage
- controlled distribution
- author-managed content
- user backup/sync

rather than being the default public CDN.

---

## 6. Published SQLite Database

The main content database can be SQLite.

```text
content/
└── library.sqlite
```

The database is read-only from the reader's perspective.

It can contain:

```text
fictions
chapters
tags
metadata
```

The reader loads it through SQLite WASM:

```text
Cloudflare
    │
    │ library.sqlite
    ▼
Browser
    │
    ▼
SQLite WASM
    │
    ▼
Read-only queries
```

The reader never modifies the author's published database.

---

## 7. Published Database Schema

A minimal schema could be:

```sql
CREATE TABLE fiction (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    author TEXT,
    genre TEXT,
    status TEXT,
    synopsis TEXT,
    coverPath TEXT,
    createdAt INTEGER,
    updatedAt INTEGER
);

CREATE TABLE chapter (
    id TEXT PRIMARY KEY,
    fictionId TEXT NOT NULL,
    chapterNumber INTEGER NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    wordCount INTEGER,
    createdAt INTEGER,
    updatedAt INTEGER
);

CREATE TABLE tag (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE fictionTag (
    fictionId TEXT NOT NULL,
    tagId TEXT NOT NULL,
    PRIMARY KEY (fictionId, tagId)
);
```

Draft management is unnecessary for the read-only application unless the author wants multiple published versions.

---

## 8. Content Assets

Images should remain outside SQLite.

```text
content/
├── library.sqlite
└── covers/
    ├── ash-crown.webp
    ├── neon-pilgrim.webp
    └── moonfall.webp
```

SQLite stores:

```text
coverPath
    ↓
covers/ash-crown.webp
```

The reader fetches the asset separately.

This keeps the content database focused on structured publication data.

---

## 9. Reader Personal Data

The reader's personal data is completely separate from the published content.

Use IndexedDB for this.

```text
IndexedDB
├── readingProgress
├── bookmarks
├── favorites
├── history
└── settings
```

Example reading state:

```ts
{
    fictionId: "novel-001",
    chapterId: "chapter-042",
    position: 18342,
    updatedAt: 1760000000000
}
```

This data belongs to the reader.

The author's published SQLite database does not contain it.

---

## 10. Why IndexedDB Is Appropriate for Reader State

Reader state is small and browser-specific.

There is no strong need to use SQLite for:

- font size
- theme
- favorites
- last chapter
- reading position
- bookmarks
- history

IndexedDB is a natural browser-native storage system for this data.

The architecture deliberately uses two storage systems for two different jobs:

```text
Published content
    → SQLite

Reader state
    → IndexedDB
```

---

## 11. Optional Google Drive Sync

Google Drive can optionally store a copy of the reader's personal state.

```text
Browser
  │
  ├── IndexedDB
  │      ↓
  │   working state
  │
  └── Google Drive
         ↓
     backup/sync
```

The user can sign in with Google.

The Google account is used to identify the user's own cloud storage.

The application does not need its own account database.

---

## 12. User Authentication

Authentication is optional.

Anonymous mode:

```text
Visit site
    ↓
Read
    ↓
IndexedDB stores progress
```

Google mode:

```text
Continue with Google
    ↓
Google authentication
    ↓
Google Drive authorization
    ↓
Sync personal reader state
```

Authentication should not be required merely to read public novels unless the author deliberately chooses restricted access.

---

## 13. User State in Google Drive

A simple format could be:

```text
StoryReader/
└── state.json
```

or:

```text
StoryReader/
├── reader-state.json
└── settings.json
```

Example:

```json
{
	"version": 1,
	"favorites": ["novel-001"],
	"progress": {
		"novel-001": {
			"chapterId": "chapter-042",
			"position": 18342
		}
	},
	"settings": {
		"theme": "dark",
		"fontSize": 18,
		"lineHeight": 1.7
	}
}
```

The browser remains the primary working copy.

Google Drive is the optional cloud copy.

---

## 14. No Application Backend

The complete application can operate without:

- custom backend server
- REST API
- server database
- user database
- password storage
- session database
- application server

```text
                    Cloudflare

                 Static Svelte app
                        │
                        ▼
                    Browser
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
   SQLite WASM      IndexedDB       Google APIs
   published        user state      optional sync
   content
```

Cloudflare only needs to distribute the application and public content.

---

## 15. PWA Is Optional

The application does not fundamentally require PWA installation.

A normal website can use:

```text
Svelte
+
SQLite WASM
+
IndexedDB
```

and persist reader state.

PWA functionality can be added later for:

- installability
- offline application shell
- better launch experience
- cached static assets

Therefore:

> **PWA is an enhancement, not the foundation of the architecture.**

---

## 16. Offline Behavior

There are two different kinds of offline behavior.

### Personal state

IndexedDB is persistent regardless of whether the PWA is installed.

```text
reading progress
favorites
settings
bookmarks
```

can remain available between visits.

### Published content

The browser must have the novel data and required application assets locally if the reader is expected to read while completely offline.

Possible strategies:

**Basic website:** browser cache determines what remains available.

**PWA:** service worker explicitly caches the application shell, SQLite database, covers, and required static assets.

**Future advanced caching:** offer "Download for offline reading" for selected novels/chapters.

---

## 17. Content Versioning

Because the published SQLite database is static, it should have a version.

For example:

```text
contentVersion = 17
```

The application can compare:

```text
installed content version
        vs
current published version
```

A future update can refresh the local content cache.

Reader state should be keyed by stable IDs, not chapter array positions.

---

## 18. Stable IDs

Do not use chapter number as the sole identity.

Use stable IDs:

```text
fictionId
chapterId
```

For example:

```text
chapterId: "ch_01HF7..."
chapterNumber: 42
```

Reader state stores:

```text
chapterId
```

rather than relying only on chapter number.

---

## 19. Search

Search can be performed locally.

Because the published SQLite database is available to the reader, search can run inside the browser.

Potential implementation:

```text
SQLite
    ↓
FTS5
    ↓
Local full-text search
```

This avoids sending chapter text to a server.

Search can cover:

- fiction titles
- descriptions
- chapter titles
- chapter content
- tags

---

## 20. Reader Architecture

Recommended structure:

```text
src/
├── routes/
│   ├── +page.svelte
│   ├── library/
│   ├── fiction/
│   └── read/
│
├── lib/
│   ├── components/
│   ├── services/
│   │   ├── LibraryService.ts
│   │   ├── ReaderService.ts
│   │   ├── SearchService.ts
│   │   ├── UserStateService.ts
│   │   └── SyncService.ts
│   │
│   ├── repositories/
│   │   ├── ContentRepository.ts
│   │   └── UserStateRepository.ts
│   │
│   ├── db/
│   │   ├── PublishedDatabase.ts
│   │   └── UserStateDatabase.ts
│   │
│   ├── models/
│   ├── stores/
│   └── utils/
│
├── config/
│   └── site.config.reader
│
└── static/
    └── content/
```

The UI should not directly execute SQL or manipulate IndexedDB.

---

## 21. Repository Separation

There are two repositories because there are two data domains.

```text
ContentRepository
    ↓
Published SQLite

UserStateRepository
    ↓
IndexedDB
```

Services coordinate them:

```text
ReaderService
    ↓
ContentRepository
    ↓
UserStateRepository
```

Example:

```text
Open chapter
    ↓
ContentRepository.getChapter()
    ↓
Render chapter
    ↓
UserStateRepository.saveProgress()
```

---

## 22. Author Workflow

The template repository should be reusable.

```text
git clone reader-template
        ↓
edit site.config.reader
        ↓
add content
        ↓
generate library.sqlite
        ↓
add covers
        ↓
build
        ↓
deploy
```

The author does not need to modify application logic for normal content changes.

---

## 23. Author Content Layout

Possible repository layout:

```text
content/
├── library.sqlite
├── covers/
│   ├── novel-001.webp
│   └── novel-002.webp
└── assets/
```

Author configuration:

```text
src/config/site.config.reader
```

Application source:

```text
src/
```

This makes the repository easy to clone and customize.

---

## 23a. Author Identity vs. Site Configuration

Author identity (name, avatars, bio, banner, social links) is kept in
its own config module, separate from `site.config.reader.ts`:

```text
src/config/
├── site.config.reader.ts    (site-wide: title, description, icon, ...)
└── author.config.reader.json (author identity: name, avatars, bio, ...)
```

This exists because a published `library.sqlite` stores an `author`
string per fiction (`fictions.author`), not a single site-wide author.
Most single-author sites will only ever see one distinct value there,
but the schema does not guarantee it — a database can technically
contain more than one distinct author (careless imports, or a site
hosting more than one writer's work). `author.config.reader.json` is
what the application treats as *the site's* displayed author; it does
not read `fictions.author` at runtime.

`scripts/setup-author.py` is the supported way to generate or update
this file. It reads the distinct `author` values out of the published
database and:

- auto-fills the config when there is exactly one distinct author
- prompts interactively when there is more than one (or accepts
  `--author "Name"`/`--non-interactive` for scripted/CI use)

No component should hardcode an author's name or image path — they
should import `src/config/author.ts` instead.

## 23b. Author Images

Three image conventions exist under `public/images/` (see that
folder's `README.md`):

- `logo.png` — the site logo/favicon, referenced by
  `site.config.reader.ts`'s `site.icon`.
- `profile-square.png` — the author's compact avatar, used everywhere
  the author's identity currently appears (home hero, footer byline).
- `profile-full.png` / `banner.jpg` — reserved for the future About
  Author page (see `docs/fiction-page-redesign-plan.md`); not rendered
  anywhere yet.

Until the About Author page exists, an unset `author.banner` has no
visible effect. Once that page is built, the plan is for it to render
a generic blurred-gradient banner (in the spirit of Royal Road's
default profile banner) when `banner` is unset, and the real image
when it is.

## 23c. Frosted Glass Chrome Tokens

Introduced in Stage 6 of `docs/fiction-page-redesign-plan.md`. Three
custom properties, themed per `data-theme` in `src/styles.css`:

```text
--glass-bg      translucent surface color (~72% opacity)
--glass-border  translucent border color (~60% opacity)
--glass-blur    backdrop blur radius (8px, shared across themes)
```

They're consumed through one utility class, `.glass-surface`, also in
`src/styles.css` — not applied ad hoc per component:

```text
.glass-surface
    ↓
default: opaque var(--bg-elevated), no blur
    ↓
@supports (backdrop-filter) → translucent + blurred
    ↓
@media (prefers-reduced-transparency: reduce) → back to opaque, always wins
```

The opaque state is the default, not a fallback bolted on afterward —
a component wearing only `.glass-surface` renders correctly with zero
other code, before the `@supports` condition is even evaluated.

**Scope:** chrome only — header/nav (`SiteHeader.vue`), the sidebar
quick-actions card (once Stage 7 builds it), and the footer's top
edge (`SiteFooter.vue`). Never the synopsis, the reading surface, or
any other large body-text area, where blur under text hurts legibility
and costs more on lower-end devices.

**Convention for components using it:** don't declare your own
`background` or a `border` shorthand alongside `.glass-surface`. A
scoped Vue style block always out-specifies a global utility class
(the injected `data-v-*` attribute selector adds weight the utility
doesn't have), so a component's own `background: var(--bg-elevated)`
or `border-bottom: 1px solid var(--border)` silently wins and defeats
the fallback logic — the border shorthand is a common trap here, since
it implicitly resets `border-color` to `currentColor` even when you
only meant to set the width. Declare structure only —
`border-bottom-width` / `border-bottom-style` — and let
`.glass-surface` own the color.

---

## 24. Configuration Should Not Contain Secrets

The configuration file can contain:

- author name
- site title
- site description
- theme defaults
- content location
- feature flags
- public Google configuration identifiers where applicable

It must never contain:

- passwords
- private API keys
- OAuth client secrets
- private Drive credentials
- service-account credentials

Anything shipped to the browser should be assumed public.

A strange file extension does not make configuration secret.

---

## 25. Possible Configuration

```ts
export default {
	site: {
		title: "Author's Web Novels",
		author: 'Author Name',
		description: 'Original web novels.'
	},

	content: {
		source: 'deployment',
		database: '/content/library.sqlite',
		assets: '/content/'
	},

	reader: {
		defaultTheme: 'dark',
		defaultFontSize: 18,
		defaultLineHeight: 1.7,
		enableTTS: true
	},

	features: {
		search: true,
		favorites: true,
		bookmarks: true,
		googleSync: true,
		offlineMode: true
	}
};
```

The `content.source` value could support:

```text
deployment
external
```

Google Drive content should be treated as a separate authenticated/private mode if needed.

---

## 26. Public Content vs Author Storage

There are two distinct concepts.

### Author source of truth

The author can keep the master content anywhere:

```text
local computer
GitHub
private Google Drive
private storage
```

### Public distribution

The reader needs a public, browser-accessible copy:

```text
Cloudflare Pages
R2
CDN
public static storage
```

An author's private Google Drive does not automatically function as a public CDN.

Therefore, if novels are meant to be publicly readable, publishing the generated SQLite/assets to the deployment or a public object store is the simplest model.

---

## 27. Recommended Distribution Strategy

Default:

```text
GitHub
   ↓
Build
   ↓
Cloudflare Pages
   ├── Svelte app
   ├── library.sqlite
   └── covers/assets
```

For larger content:

```text
Cloudflare Pages
    └── Svelte app

Cloudflare R2
    ├── library.sqlite
    └── covers/assets
```

The config determines the content URL.

This lets the reader template remain independent of where the author hosts publication data.

---

## 28. Final Architecture

```text
                         AUTHOR

                 content + configuration
                          │
                          ▼
                     GitHub repo
                          │
                         build
                          │
                          ▼
                 Cloudflare Pages
                          │
             ┌────────────┴────────────┐
             │                         │
       Svelte Reader              Public Content
                                      │
                                library.sqlite
                                      │
                                   covers
                                      │
                                      ▼
                                  READER
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                         ▼                         ▼
                    SQLite WASM               IndexedDB
                    read-only                 personal state
                         │                         │
                         │                    optional sync
                         │                         │
                         │                         ▼
                         │                    Google Drive
                         │
                         ▼
                    Web Novel
                     Reader
```

---

## 29. Core Design Principle

The system has three clearly separated ownership domains:

```text
AUTHOR
    owns publication content

CLOUDFLARE
    distributes publication content

READER
    owns personal reading state
```

Google Drive is an optional storage layer for the reader's own state.

This eliminates the need for a central user database.

---

## 30. Final Stack

```text
Frontend:
    Svelte 5
    TypeScript

Deployment:
    Cloudflare Pages

Published content:
    SQLite
    SQLite WASM
    optional FTS5

Published assets:
    static files
    or Cloudflare R2

Reader state:
    IndexedDB

Optional cloud state:
    Google Drive

Authentication:
    Google Identity

Offline:
    browser persistence
    optional PWA/service worker

Backend:
    None
```

---

## 31. Bottom Line

The reusable template is:

> **A static Svelte web novel reader that ships a read-only SQLite content database and assets, stores reader-specific state in IndexedDB, and optionally synchronizes that state to the reader's Google Drive.**

For the simplest deployment:

```text
Cloudflare Pages
├── app
├── library.sqlite
└── covers
```

For larger content:

```text
Cloudflare Pages
└── app

Cloudflare R2
├── library.sqlite
└── covers
```

The reader does not need a custom backend.

The author does not need a custom backend.

The reader's personal data does not need to live on the author's servers.

The same template can be reused for multiple authors/sites by changing the author-specific configuration and content.
