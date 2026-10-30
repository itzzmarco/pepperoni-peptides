# Peptide Ledger

Learn what the evidence actually says about trending peptides, and keep a private log of what your clinician prescribed.

Peptide Ledger is a static web app (React + TypeScript + Vite), laid out like a phone health app: a floating tab bar with **Today**, **Trends**, a center **Log** button, **Learn** and **Peptides**.

- **Today**: what's due next with a timeline of today's doses, adherence over the last 4 weeks, weight, recent side effects, where to inject next, and a daily check-in. Emergency symptoms in a check-in trigger a "get care now" message.
- **Log** (center button): log a dose of whatever is due first, with the draw in syringe units when vial details are saved, and the injection site on a body map or a **belly clock** (12 spots around the navel; move one hour clockwise each dose).
- **Trends**: a calendar of logged doses, weight and how-you-felt charts, side effects by day, a 4-week grid of doses against side-effect days, site rotation, CSV export and backups, and the full history.
- **Peptides**: each peptide or medication you were prescribed, with its due status, a 4-week strip, and pause/edit. Tracking two different GLP-1 medicines at once shows a warning.
- **Accounts** (optional): sign in with Google, or an email and password, to keep your log in sync on your phone, tablet and computer. Everyone in a household gets their own account, and each person sees only their own log. Without signing in, the app works exactly as before and keeps everything on the device.
- **Learn**: 54 trending peptides and peptide-adjacent compounds, each with an evidence tier (1 Approved to 5 Unstudied), US legal status as of October 26, 2026, WADA status, what the claims are versus what studies show, side effects, red flags, who should avoid it, and linked sources. Two guides sit on top:
  - **Dose math**: reconstitution arithmetic for a dose a prescriber gave you (vial mg, water mL, U-100 syringe units), with a to-scale syringe and checks for common mistakes such as mcg/mg mix-ups and draws that don't fit the syringe.
  - **Safety & law**: emergency signs and hotlines, vial and needle safety, contamination findings, a plain-language guide to how FDA sorts compounding ingredients, and a timeline of US peptide rules from 2023 to 2027.

The visual style ("Soft Bento") uses tinted tiles with one job per color: mint for adherence and evidence, lilac for weight and dose math, peach for side effects and warnings, sky for sites and schedule, lemon for learning. Light and dark themes follow the device or the toggle.

## What this app will not do

- **It never suggests a dose** for anything. People enter the dose their prescriber gave them. Where a library entry mentions doses, they come from an approved label or a published trial and are labeled that way.
- **It is not medical advice.** Every screen says so, and the first regimen someone adds asks them to acknowledge it.
- **It does not sell or link to vendors.** Sources are FDA, Federal Register, court records, product labels, peer-reviewed papers and reputable news.

## Privacy

There is no analytics or tracking. Signed out, the log is saved in the browser's `localStorage` on that device only (key `peptide-ledger:v1`) and nothing is sent anywhere. People can download a CSV for a spreadsheet or their clinician, save a JSON backup, restore a backup on another device, or erase everything. If the browser blocks storage (for example in some private windows), the app says that entries won't be kept.

Signed in, each regimen, dose and check-in is also saved to the account's private table in Supabase (Postgres), and a copy stays on the device so the app works offline. Row-level security on the table means a signed-in person can read and write only their own rows, and signed-out visitors can read nothing. On the device, each account's copy is kept under its own key (`peptide-ledger:v1:<user id>`), and signing out removes it. Entries made before signing in stay on the device until the person chooses to move them into their account. "Erase my log" while signed in erases the log from the account on every device.

Fonts are bundled with the app, so no request goes to a font CDN. The app works offline after the first visit and can be installed to a phone's home screen.

## Running it

Requires Node 22 or newer.

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (dose math, schedules, adherence and patterns, storage, sync, CSV, library data checks)
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build locally
```

## Deploying

`npm run build` produces a fully static `dist/` folder with relative asset paths, so it can be served from any static host or sub-path.

**Vercel** (the main host): on vercel.com, choose Add New > Project, import this GitHub repo, and click Deploy. `vercel.json` already sets the framework (Vite), build command (`npm run build`) and output directory (`dist`), so there is nothing to fill in. After that, every push to `main` goes live and every pull request gets its own preview link. `vercel.json` also gives the hashed files in `assets/` a long cache lifetime and adds a few privacy and security headers.

Any other static host works too (Netlify, Cloudflare Pages, GitHub Pages): build command `npm run build`, output directory `dist`.

## Accounts and sync

Accounts use [Supabase](https://supabase.com) for sign-in and storage. The site only needs two public values, set as environment variables at build time:

| Variable | Where to find it |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project > Project Settings > API: Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same page: the publishable key (`sb_publishable_...`), or the legacy anon key |

Both are meant to be public: they ship inside the app, and the database's row-level security is what keeps each log private. Never put the secret or `service_role` key in the app. If the variables are missing, the account button doesn't appear and the app stays device-only.

To set it up from scratch:

1. Create a Supabase project.
2. In the SQL editor, run [`supabase/migrations/20261030000000_ledger_items.sql`](supabase/migrations/20261030000000_ledger_items.sql). It creates the `ledger_items` table and its row-level security policies.
3. In Authentication > URL Configuration, set **Site URL** to the app's address (for example `https://pepperoni-peptides.vercel.app`). To try sign-in on Vercel preview links too, add `https://pepperoni-peptides-*-itzzmarcos-projects.vercel.app/**` under **Redirect URLs**.
4. **Google sign-in** (recommended; no passwords or emails to manage). The "Continue with Google" button appears once this is on:
   1. In [Google Cloud Console](https://console.cloud.google.com/), create a project, open **Google Auth Platform**, and click **Get started**: app name "Peptide Ledger", your email, audience **External**.
   2. Under **Audience**, add each person's Gmail address as a test user (or click **Publish app**; the app only asks for name and email, so Google doesn't need to review it).
   3. Under **Clients**, create a **Web application** client. Authorized JavaScript origins: the app's address. Authorized redirect URIs: `https://<project-ref>.supabase.co/auth/v1/callback`. Copy the client ID and client secret.
   4. In Supabase, Authentication > Sign In / Providers > **Google**: turn it on, paste the client ID and secret, and save.
5. **Email and password** also works. Supabase's built-in email only delivers to members of your Supabase team, so for anyone else either turn off **Confirm email** (Authentication > Sign In / Providers > Email) or set up custom SMTP (for example Resend), which also makes password-reset emails reach everyone.
6. Put the two values in `.env.production` (this repo's copy points at the live project), or set them as Vercel environment variables, which take precedence. `npm run dev` doesn't read `.env.production`, so local development stays device-only unless you copy `.env.example` to `.env.local` and fill it in.
7. Each person opens the app, taps **Sign in** at the top, and continues with Google (or creates an email account).
8. Once everyone has an account, turn off **Allow new users to sign up** in Authentication > Sign In / Providers, so strangers can't create accounts on your project.

How sync works: every change is saved on the device first and queued. The queue is sent to the server a moment later, then anything newer from the person's other devices is pulled in (on open, when the app comes back to the foreground, every 90 seconds while it's open, and when the connection returns). If two devices change the same entry, the change the server saw last wins. Deleted entries are kept on the server as empty markers so other devices remove them too. The code is in `src/lib/sync.ts` (engine, unit-tested with a fake server) and `src/lib/account.ts` (Supabase client, sign-in and the sync triggers).

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
  App.tsx              tab bar, routing (#today, #trends, #learn, #peptides, #calculator, #safety, #<peptide-id>), sheets
  views/               Today, Trends, Peptides, Learn (library), dose math, safety, and the peptide detail page
  sheets/              add/edit regimen, log a dose, daily check-in, account
  components/          tab bar, chips, charts, syringe, body map, belly clock, sheet, toast, theme toggle
  lib/                 types, storage, accounts and sync, dose math, schedules, insights (adherence, side-effect pattern), CSV, formatting
  data/                library, reference content, form options
public/                icons, web manifest, service worker
supabase/migrations/   the accounts table and its row-level security
```

## Disclaimer

Peptide Ledger is for education and personal record-keeping. It is not medical advice, diagnosis or treatment, and it does not recommend any product or dose. Many compounds in the library are not approved for human use and are not legal to compound in the US. Talk to a licensed clinician before starting, changing or stopping anything. In an emergency call 911. Poison Control (US): 1-800-222-1222. Suicide & Crisis Lifeline: 988.
