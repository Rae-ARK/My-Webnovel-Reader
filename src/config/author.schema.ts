import { z } from 'zod'
import { socialLinkSchema } from './site.schema'

/**
 * Schema for `author.config.reader.json`.
 *
 * This is the single source of truth for the site owner's identity —
 * name, avatars, bio, and banner — used dynamically wherever the app
 * shows "who wrote this", instead of hardcoding an author's name or
 * image path into a component.
 *
 * A site's published `library.sqlite` can technically contain more
 * than one distinct `fictions.author` value (e.g. if content was
 * imported carelessly, or the site hosts more than one writer's
 * work). This file is what the app treats as *the site's* author for
 * display purposes (header, home, footer); it is not derived from the
 * database at runtime. `scripts/setup-author.py` is the supported way
 * to generate/update this file from the database — see that script's
 * `--help` for the interactive/CLI-flag flow it uses when the
 * database contains more than one distinct author.
 */

const DEFAULT_BIO =
  'This author has not written a bio yet. Set `bio` in author.config.reader.json to change this.'

export const authorConfigSchema = z.object({
  /** Display name, shown in the header/home eyebrow and footer byline. */
  name: z.string().min(1),

  /**
   * Square avatar, used everywhere the author's identity appears
   * (home hero, footer byline, and anywhere else a compact author
   * mark is needed). Default matches the convention documented in
   * `docs/web-novel-reader-architecture.md` "Author Images".
   */
  avatarSquare: z.string().min(1).default('/images/profile-square.png'),

  /**
   * Wide/full avatar. Not used yet — reserved for the future
   * Royal-Road-style "About Author" page described in
   * `docs/fiction-page-redesign-plan.md`. Kept here now so the app
   * never needs a second, later config migration for it.
   */
  avatarFull: z.string().min(1).default('/images/profile-full.png'),

  /**
   * Optional banner image for the future About Author page. Left
   * unset by default, in which case that page renders a generic
   * blurred-gradient banner (styled after Royal Road's default
   * profile banner) instead of an image. Set this to override it with
   * a real image once that page exists.
   */
  banner: z.string().min(1).optional(),

  /** Free text for the future About Author page. */
  bio: z.string().min(1).default(DEFAULT_BIO),

  /** ISO date string (e.g. "2025-04-24"), shown as "Joined" on the future About Author page. Optional. */
  joined: z.string().min(1).optional(),

  /** Reuses the same shape as `site.social` — platform + URL pairs. */
  social: z.array(socialLinkSchema).default([]),
})

export type AuthorConfig = z.infer<typeof authorConfigSchema>

export function parseAuthorConfig(raw: unknown): AuthorConfig {
  const result = authorConfigSchema.safeParse(raw)

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')

    throw new Error(
      `Invalid author.config.reader.json:\n${issues}\n\nFix the fields above, or regenerate this file with scripts/setup-author.py.`,
    )
  }

  return result.data
}
