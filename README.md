# Peptide Ledger

Learn what the evidence actually says about trending peptides, and keep a private log of what your clinician prescribed.

Peptide Ledger is a static web app (React + TypeScript + Vite). It has four parts:

- **My log**: track each peptide or medication you were prescribed, log doses and injection sites, do a quick daily check-in (sleep, energy, mood, appetite, weight, side effects), and see what's due. Emergency symptoms in a check-in trigger a "get care now" message.
- **Library**: 54 trending peptides and peptide-adjacent compounds, each with an evidence tier (1 Approved to 5 Unstudied), US legal status as of October 26, 2026, WADA status, what the claims are versus what studies show, side effects, red flags, who should avoid it, and linked sources.
- **Dose math**: reconstitution arithmetic for a dose a prescriber gave you (vial mg, water mL, U-100 syringe units), with a to-scale syringe and checks for common mistakes such as mcg/mg mix-ups and draws that don't fit the syringe.
- **Safety & law**: emergency signs and hotlines, vial and needle safety, contamination findings, a plain-language guide to how FDA sorts compounding ingredients, and a timeline of US peptide rules from 2023 to 2027.

## What this app will not do

- **It never suggests a dose** for anything. People enter the dose their prescriber gave them. Where a library entry mentions doses, they come from an approved label or a published trial and are labeled that way.
- **It is not medical advice.** Every screen says so, and the first regimen someone adds asks them to acknowledge it.
- **It does not sell or link to vendors.** Sources are FDA, Federal Register, court records, product labels, peer-reviewed papers and reputable news.

## Privacy

There is no server, account, analytics or tracking. The log is saved in the browser's `localStorage` on that device only (key `peptide-ledger:v1`). People can download a CSV for a spreadsheet or their clinician, save a JSON backup, restore a backup on another device, or erase everything. If the browser blocks storage (for example in some private windows), the app says that entries won't be kept.

Fonts are bundled with the app, so no request goes to a font CDN. The app works offline after the first visit and can be installed to a phone's home screen.

## Running it

Requires Node 22 or newer.

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (dose math, schedules, storage, CSV, library data checks)
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build locally
```

## Deploying

`npm run build` produces a fully static `dist/` folder with relative asset paths, so it can be served from any static host or sub-path.

**Vercel** (the main host): on vercel.com, choose Add New > Project, import this GitHub repo, and click Deploy. `vercel.json` already sets the framework (Vite), build command (`npm run build`) and output directory (`dist`), so there is nothing to fill in. After that, every push to `main` goes live and every pull request gets its own preview link. `vercel.json` also gives the hashed files in `assets/` a long cache lifetime and adds a few privacy and security headers.

Any other static host works too (Netlify, Cloudflare Pages, GitHub Pages): build command `npm run build`, output directory `dist`.

## Where the content comes from

The library and safety content were built from a research pass over the original "Trending Viral Peptides Overview" document, checking each claim against primary sources as of October 26, 2026. That pass found and corrected a number of errors in the overview (for example the February 2027 advisory committee slate, the CJC-1295 timeline, AOD-9604's status, and the glutathione Category 1 date). The full report with every correction is in [`docs/research-report.md`](docs/research-report.md).

| What | Where |
| --- | --- |
| Compound entries | `src/data/compounds/*.ts`, combined in `src/data/peptides.ts` |
| Rules for writing an entry | `src/data/compounds/AUTHORING.md` |
| Evidence tiers, legal labels, timeline, safety center | `src/data/reference.ts` |
| Emergency symptoms, routes, units, side-effect list | `src/data/options.ts` |

### Keeping it current

US peptide rules are moving quickly. As of October 26, 2026, an HHS "Interim Access Policy for Compounding Using Certain Peptides" is under White House review, and FDA's advisory committee is due to review LL-37, injectable GHK-Cu, dihexa, Melanotan II and PEG-MGF by the end of February 2027. When something changes:

1. Update the affected entries' `legal` and `status` fields and add the source.
2. Add an event to `TIMELINE` in `src/data/reference.ts`.
3. Update `AS_OF` in the same file.
4. Run `npm test`. The data checks catch missing fields, overlong text, bad links and invalid labels.

## Project layout

```
src/
  App.tsx              tabs, routing (#log, #library, #calculator, #safety, #<peptide-id>), sheets
  views/               the four pages and the peptide detail page
  sheets/              add/edit regimen, log a dose, daily check-in
  components/          chips, charts, syringe, body map, sheet, toast, theme toggle
  lib/                 types, storage, dose math, schedules, CSV, formatting
  data/                library, reference content, form options
public/                icons, web manifest, service worker
```

## Disclaimer

Peptide Ledger is for education and personal record-keeping. It is not medical advice, diagnosis or treatment, and it does not recommend any product or dose. Many compounds in the library are not approved for human use and are not legal to compound in the US. Talk to a licensed clinician before starting, changing or stopping anything. In an emergency call 911. Poison Control (US): 1-800-222-1222. Suicide & Crisis Lifeline: 988.
