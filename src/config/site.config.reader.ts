export default {
  site: {
    title: 'Horizon ARK Studio',
    description: 'A read-only web novel library.',
    // Site logo/favicon. Drop the real file at public/images/logo.png
    // (see docs/web-novel-reader-architecture.md "Author Images") —
    // it can be any aspect ratio; main.ts letterboxes it into a
    // square before using it as the browser tab favicon, so a wide
    // wordmark-style logo won't render stretched/cropped in the tab.
    icon: '/images/logo.png',
    // about: defaults to generic template copy if omitted.
  },
  content: {
    source: 'deployment',
    database: '/content/library.sqlite',
    assets: '/content/',
  },
  reader: {
    defaultTheme: 'dark',
    defaultFontSize: 18,
    defaultLineHeight: 1.7,
    enableTTS: true,
  },
  features: {
    search: true,
    favorites: true,
    bookmarks: true,
    googleSync: false,
    offlineMode: false,
  },
  contact: {
    // Required — replace with the site's real contact address.
    email: 'contact@example.com',
    // subjectTemplate: defaults to 'Message from a reader' if omitted.
  },
  // social: defaults to a single GitHub entry pointing at the template
  // repo if omitted. Add entries here, e.g.:
  // social: [
  //   { platform: 'github', url: 'https://github.com/your-name/your-repo' },
  //   { platform: 'twitter', url: 'https://x.com/your-handle' },
  // ],

  // advertising: left unset by default, so the footer's Advertising
  // column doesn't render at all. Set a raw HTML/script embed to show
  // it, e.g.:
  // advertising: { html: '<div class="ad-slot">...</div>' },

  // support: defaults to the template repo's GitHub Issues if
  // omitted. Point this at your own repo/issue tracker, e.g.:
  // support: { issuesUrl: 'https://github.com/your-name/your-repo/issues' },

  // legal: defaults to generic placeholder copy for all three fields
  // if omitted. Override any of privacyPolicy / termsAndConditions /
  // codeOfConduct here once real policy text exists.
}
