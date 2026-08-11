# My Web Novel Reader

Your story. Your site. Your rules.

---

## What it is

A reader, built for reading.

Clone it. Add your novels. Ship it. That's the whole workflow.

No server to babysit. No database to patch at 2 a.m. No monthly bill for the privilege of hosting your own words. Just a fast, beautiful Svelte app that turns your chapters into a real website — one that looks and feels like it was built by a team, not thrown together in a weekend.

Under the hood, it's refreshingly simple: your published chapters live in a single SQLite file. Your readers' progress, bookmarks, and preferences live in their own browser. Two jobs, two systems, zero confusion.

## Who it's for

**Independent authors** who want a home for their web novel that isn't a subdomain of someone else's platform — no algorithm deciding who sees your work, no ads next to your prose, no terms of service that can change overnight.

**Writers who outgrew the forum post.** You've got chapters. You've got readers. You deserve a reader experience that matches the effort you put into the writing.

**Anyone who wants to own their words.** Your content, your design, your domain. If you ever want to leave, you take everything with you — because it was always yours.

## Built for readers, too

Reading a novel online should feel as good as reading a book.

- **Three ways to read.** Light, dark, and a warm cream mode for late nights that doesn't feel like staring at a flashlight.
- **Make it yours.** Font size, line height, all adjustable, all remembered.
- **Pick up exactly where you left off.** Every chapter, every scroll position, saved automatically.
- **Find anything, instantly.** Full-text search across every word you've published — searched locally, in the browser, in milliseconds.
- **Bookmark. Favorite. Revisit.** A reading history that's actually useful.
- **Works without a connection.** Once it's loaded, it keeps working.
- **Optional. Not required.** Sign in with Google if a reader wants their progress synced across devices. Skip it entirely if they don't. Either way, it just works.

## How it works

Your novels live in one file: `library.sqlite`. Generate it, drop it in, done.

The app loads it entirely in the browser using SQLite WASM — no server required to serve a single query. Readers get a real database's worth of speed and search, delivered as a static site.

Their personal data — progress, bookmarks, settings — never touches your database. It lives in their browser, in IndexedDB, exactly where it belongs. You publish content. They own their reading.

```text
You write.
The app reads.
Readers remember.
```

## Deploy anywhere

Built static, from the ground up. Push to Cloudflare Pages, GitHub Pages, Netlify, Vercel — or any web server that can serve files. That's it. That's the infrastructure.

## No backend. No lock-in. No excuses.

This isn't a platform you rent. It's a template you own.

Fork it once. Make it yours forever.

---

*See [`docs/web-novel-reader-architecture.md`](docs/web-novel-reader-architecture.md) for how it's built, and [`docs/implementation-plan.md`](docs/implementation-plan.md) for how to build it.*
