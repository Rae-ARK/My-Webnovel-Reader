export default {
  site: {
    title: 'Web Novel Reader',
    author: 'Author Name',
    description: 'A read-only web novel library.',
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
}
