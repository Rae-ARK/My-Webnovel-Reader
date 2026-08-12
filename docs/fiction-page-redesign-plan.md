# Fiction Page & Site Identity Redesign — Staged Plan

This is a planning document only. No implementation yet. Each stage is
small, independently shippable, and moves closer to the end goal
without requiring the stages after it to already exist. Stages should
land in order; later stages assume earlier ones are done.

## End goal (for reference)

- A site-wide identity (name + icon) that an author can change in one
  place and see reflected in the browser tab, the header, and the home
  page.
- A footer with About / Theme / Follow Us On / Contact / Need
  Help-or-equivalent / Advertising (hidden unless configured), all
  driven by author config with sensible template defaults.
- Privacy Policy, Terms & Conditions, and Code of Conduct reachable
  from the footer.
- A subtle, restrained frosted-glass touch on chrome surfaces (nav,
  sidebar, footer) — not on reading content.
- Device-agnostic layout using intrinsic CSS (clamp, auto-fit/minmax
  grids, container queries, capability queries) instead of fixed
  viewport breakpoints, wherever that's a genuine improvement.
- A `FictionView` layout that borrows Royal Road's information
  hierarchy (cover, meta, synopsis, table of contents, quick actions,
  author card) filtered through this project's actual scope — a
  single-reader, static, read-only app with no accounts, follows,
  reviews, or notifications.
- Header redesign is explicitly **not** part of this plan; it's called
  out as a separate follow-up once everything below has landed.

## Working principle

Every stage should leave the app in a working, buildable, type-checked
state. Nothing here should require a "big bang" cutover — each stage
is small enough to review and verify on its own before starting the
next.

---

## Stage 1 — Config foundation (no visible change)

**Goal:** extend `site.config.reader.ts` with the new fields the rest
of this plan depends on, and validate it with Zod, without touching
any component or visual output.

**What changes**
- `site.config.reader.ts` gains new fields under `site`:
  - `icon` — path/convention for the site icon (exact approach decided
    in Stage 2).
  - `about` — free text, defaults to generic template copy describing
    this as a personal reading space built on the Web Novel Reader
    template.
  - `contact.email` and `contact.subjectTemplate` (default subject,
    author-overridable).
  - `social` — a list of `{ platform, url }` entries. `github`
    defaults to the template's own repository URL; every other
    platform (e.g. Twitter/X, Discord, Bluesky, Instagram, Kofi,
    Patreon) is simply omitted by default and only ever rendered later
    if present.
  - `advertising` — optional, undefined by default. Holds whatever a
    later stage needs to render an author-supplied ad embed. Nothing
    reads this yet.
  - `legal` — placeholders for Privacy Policy / Terms & Conditions /
    Code of Conduct content, default boilerplate text, structure
    decided in Stage 4.
- A Zod schema is added for this config and the existing loader
  validates against it, so a misconfigured site fails fast with a
  clear error instead of a silent `undefined` reaching a component.
  (The README already lists Zod for configuration validation; this
  closes the gap where `site.config.reader.ts` currently has none.)

**What does NOT change yet**
- No component reads any of these new fields yet.
- No new UI, no footer changes, no favicon.

**Verification**
- `npm run type-check` and `npm run build` pass.
- A deliberately malformed config (e.g. missing `contact.email` after
  it's marked required, or a bad URL in `social`) fails validation
  with a readable error at startup.

**Open question carried forward:** exact shape of `social` (array vs.
keyed object) and whether `advertising` is a raw HTML string, a
provider-specific slot ID, or both — resolved in Stage 3 when
something actually consumes it.

---

## Stage 2 — Site identity wiring (icon + name, no redesign)

**Goal:** make the existing `site.site.title` and the new `icon`
field actually show up everywhere they should — browser tab, header
brand, home page — using only what Stage 1 added. Purely plumbing,
not a visual redesign.

**What changes**
- A default site icon asset is added to the repo (generic
  book/reader-style icon), at a fixed conventional path so an author
  can override it just by replacing the file — the same pattern
  already used for `public/content/covers/`.
- `index.html` gets a `<link rel="icon">` pointing at that path.
- Since `index.html`'s `<title>` is static HTML in a Vite SPA (it
  can't read `site.config.reader.ts` at build time without extra
  tooling), the browser tab title is set at runtime via
  `document.title` early in `main.ts`, sourced from
  `site.site.title`. This means the very first paint briefly shows the
  static fallback title before JS runs — acceptable for this project;
  noted here in case it's ever worth revisiting with a build-time
  injection step instead.
- The header brand (`App.vue`) and the home page heading
  (`HomeView.vue`) — both already render `site.site.title` — gain the
  icon alongside the text.

**What does NOT change yet**
- No footer work.
- No layout/visual redesign beyond adding the icon next to existing
  text.

**Verification**
- Changing `site.site.title` and swapping the icon file changes the
  tab title, header brand, and home page heading/icon consistently in
  one place, with no leftover hardcoded "Web Novel Reader" string
  anywhere in the app.

**Open question:** should the home page heading show the icon at a
larger "hero" size, or stay text-only with the icon reserved for the
compact header/tab? Left open until Stage 2 is actually being built.

---

## Stage 3 — Footer skeleton (structure + config wiring, minimal styling)

**Goal:** rebuild the footer's structure and content, wired to Stage
1's config, before any glass/intrinsic-CSS polish is applied. Get the
information architecture right first.

**What changes**
- Footer columns: **About**, **Theme**, **Follow Us On**, **Contact**,
  a column for the "Need Help?" equivalent, and **Advertising**.
- **About** renders `site.site.about` (falls back to the generic
  template copy from Stage 1 if unset).
- **Theme** stays functionally what it already is (theme selection),
  just repositioned into this column.
- **Follow Us On** renders one icon/link per entry in `site.social`;
  GitHub shows by default (linking at the template repo unless
  overridden), every other platform is simply absent from the DOM
  when not configured — not shown-and-disabled, just not rendered.
- **Contact** renders a `mailto:` link built from
  `site.contact.email` and `site.contact.subjectTemplate`.
- **Need Help? column — decision to make in this stage, not deferred
  further:** rather than duplicating Contact, repurpose this column as
  "Report an Issue," linking to the template repo's GitHub Issues by
  default (overridable via config to any URL). This gives it a
  distinct purpose from Contact (bug/problem reports vs. personal
  correspondence) instead of being a near-duplicate. Recorded here as
  the working decision; flagged for a quick author sanity-check before
  building it.
- **Advertising** column is simply not rendered at all unless
  `site.advertising` is set — this is the first thing that actually
  reads that field, which finalizes its shape (likely: a raw
  author-authored HTML/script embed, since this is a self-hosted,
  single-author site and the content is trusted, not user-generated).

**What does NOT change yet**
- No frosted glass.
- No intrinsic-CSS conversion — this stage can ship with the footer's
  existing/plain layout approach; visual polish is Stage 5+.
- Legal links (Privacy/Terms/Code of Conduct) are not wired yet —
  that's Stage 4, since it needs actual pages to link to.

**Verification**
- Footer renders correctly for three scenarios: (a) fully unconfigured
  (only defaults — About boilerplate, GitHub link, no other socials,
  no advertising column at all), (b) fully configured (every field
  populated), (c) partially configured (e.g. two socials set, no
  advertising) — confirming nothing renders as an empty/broken card.

---

## Stage 4 — Legal pages (Privacy Policy, Terms & Conditions, Code of Conduct)

**Goal:** give the footer's remaining bottom-bar links (seen in the
Royal Road reference as a small text row: "Terms of Service | Privacy
Policy | ...") somewhere real to go.

**What changes**
- Three minimal routes/pages, each rendering default boilerplate
  copy appropriate for a static, read-only, no-accounts reading app
  (what data is and isn't collected — effectively "none, beyond local
  device storage," since there's no backend), fully author-editable
  via `site.legal` from Stage 1.
- A small text row added to the very bottom of the footer linking to
  all three, matching the unobtrusive style of the reference screenshot
  rather than being treated as a fourth full column.

**What does NOT change yet**
- No styling polish beyond making the pages legible and consistent
  with the rest of the app's existing (pre-redesign) look.

**Verification**
- All three routes render, are reachable from the footer, and reflect
  config overrides when set.

---

## Stage 5 — Intrinsic CSS conversion pass

**Goal:** before doing the bigger `FictionView` layout work in Stage
7, convert the app's existing hard-breakpoint responsive CSS to
intrinsic techniques, so Stage 7 is built on the new approach from the
start instead of being retrofitted later.

**What changes**
- Card/grid layouts (the existing Index UI's horizontal groups, the
  footer's column layout) move to `grid-template-columns:
  repeat(auto-fit, minmax(...))` or flexbox `flex-wrap` instead of
  being reshaped at fixed viewport widths.
- Typographic and spacing scales move to `clamp()` where they
  currently step at breakpoints.
- The one existing hard breakpoint in `FictionView.vue`
  (`@media (max-width: 700px)`, which hides the desktop ‹ › index-nav
  buttons) is reconsidered: what actually matters there is
  touch-vs-mouse precision, not viewport width, so it's a candidate
  for a capability query (`@media (hover: hover) and (pointer:
  fine)`) instead — this correctly handles cases like a touch laptop
  with a large screen, which a width-based rule gets wrong.
- Where a component's layout should genuinely respond to its own
  container's width rather than the viewport (e.g. the sidebar card
  vs. the main content column), container queries (`@container`) are
  introduced instead of another viewport media query.
- `@media` itself isn't banned — it stays for the things CSS can't
  express intrinsically: `prefers-color-scheme`,
  `prefers-reduced-motion`, `prefers-reduced-transparency` (needed
  ahead of Stage 6's glass effect), and the hover/pointer capability
  query above.

**What does NOT change yet**
- No new visual design — this stage should look the same as before,
  just implemented differently. Any visual drift here is a bug, not a
  feature.

**Verification**
- Resize testing across a continuous range of widths (not just the
  old breakpoint's before/after) shows no layout breakage, with
  particular attention to the previously breakpoint-gated elements.

---

## Stage 6 — Frosted glass design tokens

**Goal:** introduce the restrained frosted-glass treatment as a small,
isolated set of design tokens, applied only to chrome surfaces.

**What changes**
- New CSS custom properties (e.g. `--glass-bg`, `--glass-blur`,
  `--glass-border`), themed for both light and dark mode, tuned
  restrained (roughly 6–10px blur, a translucent-but-still-legible
  background) — explicitly not the heavier "liquid glass" look.
- Applied only to: the header/nav bar, the sidebar quick-actions card,
  and the footer's top edge. Deliberately **not** applied to the
  synopsis, the reading surface, or any large body-text area, since
  blur-over-text hurts legibility and costs more on lower-end
  devices/browsers.
- A `prefers-reduced-transparency` media query (added as part of Stage
  5's `@media` allowlist) falls back to a solid, fully opaque surface
  color for anyone who's asked their OS for that.
- A `@supports (backdrop-filter: blur(1px))` fallback (or the `-webkit-`
  prefixed check) ensures browsers without `backdrop-filter` support
  get the solid fallback color rather than a broken/unstyled surface.

**What does NOT change yet**
- No layout changes — this stage is purely a surface/material
  treatment on top of Stage 5's structure.

**Verification**
- Visual check in both themes, with `prefers-reduced-transparency`
  simulated, and in a browser/engine without `backdrop-filter`
  support, confirming graceful degradation each time.

---

## Stage 7 — FictionView layout rebuild (Royal Road-inspired)

**Goal:** the actual page redesign, now that config (Stage 1–4),
layout technique (Stage 5), and surface treatment (Stage 6) are all in
place.

**Borrowed from the Royal Road reference, adapted to this app's scope:**
- Cover image + title/author/status/tag-chip cluster, with a
  prominent "Start Reading" action — this app already has this in
  rough form; refine spacing/hierarchy to match the reference's
  clarity.
- Compact chip row for `genres`/`tags`/status (fields already exist on
  the `Fiction` model — no schema change needed here).
- Synopsis with a "Show more" collapse for long text.
- The table-of-contents/index preview strip — already built in an
  earlier session — gets a visual refresh to sit closer to the
  reference's thumbnail-strip look (index cover art if/when that
  becomes a real field, otherwise a generated label card), still using
  Stage 5's intrinsic scroll/grid approach and Stage 6's glass tokens
  where appropriate.
- A sidebar quick-actions card, glass-treated per Stage 6, keeping the
  parts of the reference that map to real features this app has
  (Favorites, a reading-progress/"continue" affordance) and dropping
  the parts that don't (Follow, Not Interested, Report — all
  multi-user platform features with no equivalent here).
- An author card: name, a short blurb (from `site.site.about` or a
  future per-fiction author blurb field), and the `site.social` links
  from Stage 3 instead of a "Follow Author" button, since there's no
  account system to follow anything with.

**Explicitly dropped from the reference** (out of scope for a
single-reader, static, read-only app): reviews/ratings, "Others also
liked" carousel, achievements/trophies, notification bell, login.

**What does NOT change yet**
- Header — not touched here; see Stage 8.

**Verification**
- Full manual pass against the current single local fiction
  (*Summoned by Mistake...*) once its database is actually migrated
  (still blocked on the earlier, separate step-7-of-the-content-model
  work), confirming the new layout handles a real 33-entry, 3-index
  fiction correctly, plus a synthetic zero-index and single-index
  fiction to check the empty/minimal cases don't look broken.

---

## Stage 8 — Header (deferred, separate follow-up)

**Not part of this plan's scope.** Recorded here only so it isn't
forgotten. Candidate directions to evaluate once Stages 1–7 are
settled:

- **Option A:** keep the current minimal top bar (brand icon + name
  from Stage 2, theme toggle, search), lightly glass-treated per Stage
  6. Lowest risk, smallest change.
- **Option B:** a Royal-Road-style two-row header (utility bar +
  logo/nav bar). Likely more chrome than a single-fiction reader
  needs.
- **Option C:** a fuller header only on the home page, collapsing to a
  slim sticky bar inside `FictionView`/`ReaderView` where screen space
  for content matters more.

This gets its own planning pass once there's a working, redesigned
footer and fiction page to design the header around — deciding the
header first, before the page it sits above, would be building it
backwards.

---

## Open questions log (carried across stages, for author sign-off)

1. **Need Help? vs. Contact** — Stage 3 proposes "Report an Issue"
   linking to GitHub Issues as the resolution. Confirm before Stage 3
   is built.
2. **Icon override mechanism** — Stage 2 proposes a fixed conventional
   file path (swap the file to change it), no config field. Confirm
   this is flexible enough, versus a configurable path added to
   `site.site.icon`.
3. **Legal pages** — Stage 4 assumes three separate routed pages with
   plain default boilerplate. Confirm that's preferable to, say,
   footer-expandable inline text instead of full pages.
4. **Advertising embed shape** — Stage 3 assumes a raw,
   author-authored HTML/script string (trusted, since it's the site
   owner's own config, not user input). Confirm this is acceptable
   before it's built, since it is intentionally not sanitized/limited
   the way user-generated content would need to be.
5. **Home page icon treatment** — Stage 2 raises whether the home page
   heading should show a larger "hero" icon or stay text-only, while
   the header brand always stays compact. No default assumed yet.
