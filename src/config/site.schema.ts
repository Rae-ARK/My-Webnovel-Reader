import { z } from 'zod'

/**
 * Schema for `site.config.reader.ts`.
 *
 * This is Stage 1 of the fiction-page redesign plan: it only adds
 * fields and validation. Nothing in the app reads the new fields yet
 * (`icon`, `about`, `contact`, `social`, `advertising`, `legal`) —
 * that wiring happens in later stages.
 *
 * Defaults are intentionally template-generic so an unconfigured
 * clone still validates and boots; an author is expected to override
 * them for their own site.
 */

const DEFAULT_ABOUT =
  'This is a personal reading space built on the Web Novel Reader template — a free, open-source, read-only reader for self-published web fiction.'

const DEFAULT_CONTACT_SUBJECT = 'Message from a reader'

const DEFAULT_PRIVACY_POLICY =
  'This site stores reading progress, bookmarks, favorites, and settings locally in your browser. No account is required to read, and no reading data is sent to the site owner unless you explicitly enable optional cloud sync. Replace this placeholder with your own privacy policy.'

const DEFAULT_TERMS_AND_CONDITIONS =
  'This site is provided as-is for personal reading. Content is the property of its author and may not be redistributed without permission. Replace this placeholder with your own terms and conditions.'

const DEFAULT_CODE_OF_CONDUCT =
  'Be respectful in any contact or discussion related to this site. Replace this placeholder with your own code of conduct.'

const TEMPLATE_REPO_URL = 'https://github.com/Rae-ARK/My-Webnovel-Reader'

export const socialLinkSchema = z.object({
  platform: z.string().min(1, 'social.platform must not be empty'),
  url: z.url('social.url must be a valid URL'),
})

export const siteConfigSchema = z.object({
  site: z.object({
    title: z.string().min(1),
    author: z.string().min(1),
    description: z.string().min(1),
    /** Path/convention for the site icon. Exact loading approach is decided in Stage 2. */
    icon: z.string().min(1).default('/icon.svg'),
    /** Free text shown in the footer's About column (Stage 3). */
    about: z.string().min(1).default(DEFAULT_ABOUT),
  }),

  content: z.object({
    source: z.enum(['deployment', 'external']),
    database: z.string().min(1),
    assets: z.string().min(1),
  }),

  reader: z.object({
    defaultTheme: z.enum(['light', 'dark', 'sepia']),
    defaultFontSize: z.number().positive(),
    defaultLineHeight: z.number().positive(),
    enableTTS: z.boolean(),
  }),

  features: z.object({
    search: z.boolean(),
    favorites: z.boolean(),
    bookmarks: z.boolean(),
    googleSync: z.boolean(),
    offlineMode: z.boolean(),
  }),

  /** Required — used to build the footer's `mailto:` link in Stage 3. */
  contact: z.object({
    email: z.email('contact.email must be a valid email address'),
    subjectTemplate: z.string().min(1).default(DEFAULT_CONTACT_SUBJECT),
  }),

  /** Rendered one link per entry in Stage 3's "Follow Us On" column. */
  social: z.array(socialLinkSchema).default([
    {
      platform: 'github',
      url: TEMPLATE_REPO_URL,
    },
  ]),

  /**
   * Undefined by default — nothing reads this yet. Shape (raw HTML
   * embed vs. provider slot ID) is finalized in Stage 3 when
   * something actually consumes it.
   */
  advertising: z.unknown().optional(),

  /** Placeholder copy for the legal routes added in Stage 4. */
  legal: z
    .object({
      privacyPolicy: z.string().min(1).default(DEFAULT_PRIVACY_POLICY),
      termsAndConditions: z.string().min(1).default(DEFAULT_TERMS_AND_CONDITIONS),
      codeOfConduct: z.string().min(1).default(DEFAULT_CODE_OF_CONDUCT),
    })
    .default({
      privacyPolicy: DEFAULT_PRIVACY_POLICY,
      termsAndConditions: DEFAULT_TERMS_AND_CONDITIONS,
      codeOfConduct: DEFAULT_CODE_OF_CONDUCT,
    }),
})

export type SiteConfig = z.infer<typeof siteConfigSchema>

/**
 * Parses and validates raw config, throwing a readable error at
 * startup if it's malformed rather than letting `undefined` reach a
 * component later.
 */
export function parseSiteConfig(raw: unknown): SiteConfig {
  const result = siteConfigSchema.safeParse(raw)

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')

    throw new Error(
      `Invalid site.config.reader.ts:\n${issues}\n\nFix the fields above before the app can start.`,
    )
  }

  return result.data
}
