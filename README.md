# Web Novel Reader

A reusable, read-only Vue 3 web novel reader template.

## Stack

- Vue 3
- TypeScript
- Vite
- Vue Router
- Tailwind CSS
- Zod (configuration validation)
- Static deployment

## Architecture

```text
components/routes → stores → services → repositories → db
```

The reader is designed to ship published content as a read-only SQLite database while keeping reader state in IndexedDB. Google Drive sync and PWA support are optional later stages.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run type-check
npm run build
```
