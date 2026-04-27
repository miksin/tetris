# Tetris

A classic Tetris game built with SvelteKit + TypeScript, deployed as a static site on Cloudflare Pages.

## Tech Stack

- **Framework:** SvelteKit 2 + Svelte 5
- **Language:** TypeScript
- **Build tool:** Vite 6
- **Testing:** Vitest
- **Deployment:** Cloudflare Pages (adapter-static)

## Local Development

### Prerequisites

- Node.js >= 18
- npm

### Setup

```bash
npm install
```

### Run dev server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

### Type check

```bash
npm run check
```

### Run tests

```bash
npm test
```

## Build

```bash
npm run build
```

Output is written to the `build/` directory.

Preview the production build locally:

```bash
npm run preview
```

## Deployment (Cloudflare Pages)

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output directory | `build` |
| Node.js version | 18 |

The project uses `@sveltejs/adapter-static` with a `404.html` fallback, which is compatible with Cloudflare Pages' SPA routing.
