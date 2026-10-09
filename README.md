# Yeshua Throne — release site

The direct-to-fan home for Yeshua Throne. Every record premieres here before it
reaches streaming: playable releases, a drop-alert list, the story, and the
archive. **CHAMPION** (album, in the studio) is the home-page flagship.

Stack: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 4 · Supabase
(Postgres + Storage) · Vercel.

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
```

| Script              | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Next dev server                                           |
| `npm run build`     | Production build (must pass with no env vars set)         |
| `npm run start`     | Serve the production build                                |
| `npm run lint`      | ESLint 9 (flat config, `next/core-web-vitals`)            |
| `npm run typecheck` | `tsc --noEmit`                                            |
| `npm test`          | Vitest + Testing Library (jsdom) — `src/**/*.test.{ts,tsx}` |
| `npm run test:integration` | Vitest against a local Supabase (skips without `SUPABASE_TEST_URL`) |
| `npm run test:e2e`  | Playwright (chromium) — builds and serves on port 3000    |
| `npm run db:start` / `db:stop` / `db:reset` | Local Supabase via the CLI (needs Docker) |

First Playwright run: `npx playwright install --with-deps chromium`.

## Environment

Copy `.env.example` to `.env.local`. All five are optional; with none set the
site builds and renders the no-releases state.

| Variable                        | Scope   | Purpose                                                   |
| ------------------------------- | ------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | public  | Supabase project URL                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public  | Anon key; RLS restricts it to published releases/tracks   |
| `SUPABASE_SERVICE_ROLE_KEY`     | server  | Drop-alert inserts and preview reads. Never in the browser |
| `PREVIEW_SECRET`                | server  | `/music/<slug>?preview=…` shows unpublished releases       |
| `REVALIDATE_SECRET`             | server  | `x-revalidate-secret` header on `POST /api/revalidate`     |

Never commit `.env.local` or any key. `.gitignore` excludes `.env*` except
`.env.example`.

## Database

Supabase Postgres + Storage. Schema lives in `supabase/migrations/`, launch
data in `supabase/seed.sql` (CHAMPION as the featured upcoming album, plus an
unpublished `draft-fixture` row the RLS tests assert is invisible).

| Table         | Anon (fan) access                      | Writes                           |
| ------------- | -------------------------------------- | -------------------------------- |
| `releases`    | select where `published = true`        | Supabase Studio / service role   |
| `tracks`      | select when the parent is published    | Supabase Studio / service role   |
| `drop_alerts` | none                                   | server action with service role  |

Buckets `artwork` and `audio` are public. `release_date` is nullable: a
release with no date (or a future one) is `upcoming`; today or earlier is
`released`. The query layer (`src/lib/db/queries.ts`) derives `status` from
that and never throws to a fan — a database error reads as "no releases".

Local database and the RLS integration suite (Docker required):

```bash
npm run db:start                     # applies migrations + seed
npx supabase status -o env           # copy API_URL, ANON_KEY, SERVICE_ROLE_KEY
SUPABASE_TEST_URL=http://127.0.0.1:54321 \
SUPABASE_TEST_ANON_KEY=<ANON_KEY> \
SUPABASE_TEST_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY> \
npm run test:integration
npm run db:stop
```

CI runs the same suite in the `Supabase RLS integration` job.

## Layout

```
src/app/            routes, root layout, globals.css (@theme tokens)
src/components/     presentational, prop-driven components
src/content/        static site content (identity, nav, socials)
src/lib/db/         server-only Supabase clients, typed queries, row mappers
supabase/           CLI config, migrations, seed
e2e/                Playwright specs
```

Design tokens live in `src/app/globals.css`: onyx (background), ink (surfaces),
electric (interactive), gold (release / drop moments and the Covnant badge
only), Geist Sans + Mono. Dark only.

## Deploy

Vercel, auto-deploy from `main`; every PR gets a preview deployment. Set the
server-side env vars in the Vercel project, not in the repo. CI
(`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, build,
Playwright, and the Supabase RLS integration suite on every PR and on push to
`main`, with no env vars.
