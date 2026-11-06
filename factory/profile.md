---
default_branch: main
stack: TypeScript 5.9, React 19.3, Vite 8.3 (@vitejs/plugin-react 6.1), Vitest
  5.0, plain CSS with custom-property tokens, static PWA (service worker,
  localStorage), Vercel static hosting
check_cmd: npm ci && npm test && npm run build
start_cmd: npm ci && npm run dev -- --port {port} --strictPort
start_url: http://localhost:{port}/
sensitive_paths:
  - src/lib/store.ts
  - src/lib/types.ts
  - src/lib/doseMath.ts
  - src/data/options.ts
  - src/data/reference.ts
  - src/data/compounds/**
  - public/sw.js
  - index.html
  - vite.config.ts
  - vercel.json
  - tsconfig.json
  - .github/workflows/**
  - package.json
  - package-lock.json
---
## Conventions

- **Layout:** `src/views/*View.tsx` has one file per hash route. `src/sheets/` holds the modal forms (regimen, dose, check-in). `src/components/` holds shared UI. `src/lib/` holds pure logic. `src/data/` holds library content. Routing lives in `src/App.tsx` (`parseHash`, `ROUTES`, `ALIASES`). While a sheet is open, the page behind it is set `inert`.
- **Logic and tests:** keep logic in `src/lib/` and pass `now = new Date()` as a parameter so tests can fix the time. Tests live in `src/lib/__tests__/*.test.ts` and `src/data/__tests__/`. They import `describe/it/expect` from `vitest`, build fixtures with small inline helpers (`reg()`, `dose()`), and use fixed ISO dates. The test environment is `node` and there is no jsdom or testing-library, so components have no tests. Don't add a DOM test stack without asking.
- **Storage:** `LedgerStore` plus `useLedger` (`useSyncExternalStore`) store everything under the localStorage key `peptide-ledger:v1`. `normalize()` is the trust boundary for both storage and backup files. Dose and check-in `at` values are ISO UTC strings, kept newest first. Day grouping uses the local `dayKey`. If you change the `Ledger` shape, you need a migration.
- **Styling:** everything is in `src/styles.css`. Tokens (`--mint/--lilac/--peach/--sky/--lemon` plus `-ink`, `--ink-*`, `--r-*`, `--fs-*`) are redefined for dark mode under `prefers-color-scheme` and `[data-theme]`. Components use `tile` classes and inline styles that reference tokens. Use tokens, not hex. `DoseSheet.tsx` still has one hardcoded `#F9C9AE`.
- **TypeScript:** strict, with `noUnusedLocals` and `noUnusedParameters`, so an unused import fails the build. No linter or formatter is set up. House style is 2 spaces, single quotes, semicolons and trailing commas.
- **Content rules** (`src/data/compounds/AUTHORING.md`): never suggest a dose, write in plain language, no em-dashes, and cite sources. `npm test` runs data checks on field lengths, labels and links.
- **Privacy promise:** no network calls, no analytics, no CDNs. Fonts are bundled through `@fontsource`.
- **Service worker:** `public/sw.js` precaches by matching `src="./..."` and `href="./..."` in `index.html`. Keep asset paths relative (`base: './'`).
- **Node:** CI uses Node 22 (`.github/workflows/ci.yml`).
