# Horizon ARK Studio

A novel deserves a home that gets out of its way.

Web Novel Reader is a template, not a platform. Clone it, add your
own novel and configuration, and you have a fast, static reading site
— no backend to run, no database to maintain, nothing standing
between a reader and the next chapter.

## What it does

- Ships your fiction as a read-only SQLite database, queried entirely
  in the reader's browser — no server round-trip per page.
- Keeps every reader's progress, bookmarks, and favorites on their
  own device. Their reading history is theirs; it never touches your
  infrastructure.
- Search, light/dark/sepia themes, and continue-reading all run
  locally, offline-friendly by default.
- Deploys anywhere that serves static files. Cloudflare Pages is the
  default target; any static host works.

## Stack

Vue 3 · TypeScript · Vite · Vue Router · Tailwind CSS · Zod · SQLite
via sql.js (WASM) · IndexedDB

## How it's built

```text
components/routes → stores → services → repositories → db
```

Two data domains, kept deliberately separate. Published content — the
novel itself — is a static, read-only SQLite database the author
generates and ships with the app. Reader state — progress, bookmarks,
favorites — lives in the reader's own IndexedDB, with optional Google
Drive sync for anyone who wants their spot to follow them across
devices.

The full architecture, including the published database schema and
the author workflow for turning a manuscript into a deployable site,
is in [`docs/web-novel-reader-architecture.md`](docs/web-novel-reader-architecture.md).

## Get it running

```bash
npm install
npm run dev
```

## Ship it

```bash
npm run type-check
npm run build
```
