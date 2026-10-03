# Project Context

**cv** is Martin Svensson's resume/portfolio site: a public bilingual (en/sv) CV page, a
downloadable PDF, and a GitHub-OAuth-protected admin for editing the content, which lives in
Postgres. It is a full-stack SvelteKit app (SSR, form actions, `+server.ts` endpoints) running on
`adapter-node`.

It replaces the Next.js app in `../resume` and is being ported phase by phase. **`MIGRATION.md` is
the source of truth for what is done and what is next.** Read it before starting work. The Next
app stays runnable for side-by-side comparison until cutover. Both apps share the same database
and schema.

# Commands

- Gate (run before committing): `pnpm check` (svelte-check + prettier + eslint + tests + build)
- Dev server: `pnpm dev`, **port 3004** (the same port as the Next app, so the nginx upstream is
  unchanged)
- Production: `pnpm build` then `pnpm start` (`node build`; reads `.env` if present)
- Test: `pnpm test` (Vitest, `TZ=Europe/Stockholm`) · watch: `pnpm test:watch`
- Format: `pnpm format`
- DB: `pnpm db:migrate` (idempotent) · `pnpm db:generate` (after schema changes) ·
  `pnpm db:studio`
- `pnpm db:seed` **wipes and reseeds all content.** Never run it against a database holding real
  edits (dev and the old app share one DB) unless asked.

# Conventions

- **Svelte 5 runes only.** Runes mode is forced in `vite.config.ts`.
- **SSR is on.** Data is loaded in `+page.server.ts` / `+layout.server.ts`. Mutations are form
  actions progressively enhanced with `use:enhance`. Loads re-run after an enhanced submit, so no
  manual cache invalidation is needed. Don't use remote functions (still experimental).
- **Server-only code lives in `$lib/server/`** (db client, schema, services, pdf, auth). SvelteKit
  refuses to bundle it into the client.
- **Env vars** are declared, with a zod schema, in `src/env.ts` (SvelteKit's explicit environment
  variables) and imported from `$app/env/private`. They are validated at build and at boot, and
  their types don't depend on the local `.env`. `$env/*` is disabled. `scripts/` run under tsx and
  use `dotenv` + `process.env`.
- **DB**: Drizzle + postgres.js. `drizzle/migrations/` was copied byte-for-byte from `../resume`,
  so applied-migration hashes match. Never edit an existing migration; generate a new one.
- **Auth**: Better Auth, GitHub sign-in for one admin (`ADMIN_GITHUB_ID`). Rules live in
  `$lib/server/auth/admin.ts`; `adminGuard` protects `/admin/**`, and **every admin action calls
  `requireAdmin(event)` first**, because actions are POST endpoints and must not rely on the page
  guard.
- **Language** is the `lang` cookie (`en`|`sv`), resolved server-side, so SSR renders the right
  language. All UI strings go through `$lib/translations.ts`. Bilingual _content_ is DB columns
  (`titleEn`/`titleSv`, …), picked by language.
- **Styling**: Tailwind v4 via `@tailwindcss/vite`, stylesheet at `src/routes/layout.css`.
  Class-based dark mode (`@custom-variant dark (&:where(.dark, .dark *))`). Use no dynamic class
  strings; use explicit class maps instead. Icons come from `svelte-hero-icons`.
- **Tests**: `*.svelte.test.ts` run in jsdom (the `client` project); all other `*.test.ts` run in
  Node (the `server` project). Keep pure logic testable without rendering, e.g. the PDF document
  definition is a pure function. Test our logic, not the libraries.
- **DB tests** run against PGlite (in-memory Postgres with the real migrations), never the dev
  database. A test file opts in with one line:
  `vi.mock('$lib/server/db/client', () => import('$lib/server/testing/testDb'));` Each file gets
  its own fresh database; `resetDb()` empties it between tests. Don't mock Drizzle.
- **Dependencies**: `adapter-node` bundles `devDependencies` into the build but leaves
  `dependencies` external, so anything imported at runtime by server code that should not be
  bundled (drizzle, postgres, pdfmake) goes in `dependencies` and is installed on the server.
- **No lint or type suppressions** (`eslint-disable`, `@ts-ignore`, `@ts-expect-error`). Fix the
  design instead.

# Behavior Rules

- Question inherited decisions, including ones copied from `../chess` or `../mphotos-svelte`. A
  convention is only here because it has a reason. If it doesn't, say so.
- Ask before assuming when requirements are ambiguous.
- Write minimum code to solve the stated problem. No preemptive abstraction.
- Only modify files and functions directly involved in the current task.
- Say "I'm not sure" when uncertain rather than confabulating.

# Committing

1. Run `pnpm check`. Abort and report if anything fails.
2. Review `git status` / diffs and propose a logical commit grouping.
3. Commit only when explicitly asked. No Claude attribution / `Co-Authored-By`. Push only when
   asked.
