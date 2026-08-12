export default {
  site: {
    title: 'Web Novel Reader',
    author: 'Author Name',
    description: 'A read-only web novel library.',
    // icon: exact loading convention decided in Stage 2; defaults to '/icon.svg'.
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

  // advertising: left unset — undefined by default, nothing reads it yet.

  // legal: defaults to generic placeholder copy for all three fields
  // if omitted. Override any of privacyPolicy / termsAndConditions /
  // codeOfConduct here once real policy text exists.
}
