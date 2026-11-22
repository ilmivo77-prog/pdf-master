# PDF Master

Browser-first PDF utility platform built with React, TypeScript, Tailwind CSS, Vite, and client-side Web Workers (`pdf-lib` and `jszip`).

## Development & Build

```bash
npm install
npm run lint
npm run build
npx tsx src/tests/runChecks.tsx
```

### Environment Variables

See `.env.example`:
- `VITE_SITE_URL` — Site origin used for canonical links, `og:url`, `hreflang`, and JSON-LD URLs (trailing slashes are normalized automatically). Configure the real value in your hosting provider's environment variables and never commit real domains (`.env.example` uses `VITE_SITE_URL=https://YOUR-PROJECT.vercel.app` strictly as a placeholder). When unset, the app falls back to `window.location.origin` in the browser.

### Lockfile & Platform Dependencies Note

On Linux and macOS, `npm ci` performs a clean install from `package-lock.json`.
On Windows, use `npm install` instead if `npm ci` reports missing optional platform packages for native/rollup dependencies. Do not use `--legacy-peer-deps`.
