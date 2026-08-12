# Author images

This folder is not committed with real image content — it's the
conventional location `site.config.reader.ts` and
`author.config.reader.json` point at by default. Drop your own files
here using these exact names and both configs will pick them up
without any further code changes:

| File                  | Used for                                                          | Referenced by                                |
| ---------------------- | ------------------------------------------------------------------ | --------------------------------------------- |
| `logo.png`             | Site logo / favicon (header, home hero, browser tab)              | `site.config.reader.ts` → `site.icon`         |
| `profile-square.png`   | Author avatar, shown everywhere the author's identity appears today (home hero, footer byline) | `author.config.reader.json` → `avatarSquare`  |
| `profile-full.png`     | Wide author avatar, reserved for the future About Author page      | `author.config.reader.json` → `avatarFull`    |
| `banner.jpg` (optional) | Author banner, reserved for the future About Author page          | `author.config.reader.json` → `banner`        |

Any raster or vector format works for the logo — `main.ts` derives the
favicon's MIME type from the file extension at runtime, so `.png`,
`.svg`, `.webp`, `.jpg`/`.jpeg`, and `.ico` are all fine as long as the
filename and the config's path agree.

See `docs/web-novel-reader-architecture.md` ("Author Images") for the
full rationale, and `docs/fiction-page-redesign-plan.md` for how
`avatarFull`/`banner` will be used once the About Author page exists.
