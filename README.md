# cv

Martin Svensson's resume site: a public, bilingual (English/Swedish) CV page, a downloadable PDF,
and a GitHub-protected admin for editing the content, which lives in Postgres. Edits show up
immediately: no rebuild or redeploy. The admin also tracks job applications privately: status,
deadlines, contacts, a personal letter and a frozen copy of what was sent.

Built with SvelteKit (Svelte 5) as a full-stack app with server-side rendering, running on
Node. It replaces an earlier Next.js version,
[msvens/resume](https://github.com/msvens/resume), which is deprecated.

## Stack

- **Framework:** SvelteKit 2 + Svelte 5 (runes), TypeScript, `adapter-node`
- **Styling:** Tailwind CSS v4
- **Database:** Postgres + Drizzle ORM (postgres.js)
- **Auth:** [Better Auth](https://www.better-auth.com) with GitHub OAuth, one admin user, stateless
  sessions (an encrypted cookie; no auth tables)
- **PDF:** pdfmake, generated on the server
- **Markdown:** marked, rendered as a safe element tree (no raw HTML)
- **Images:** sharp (profile photo upload)
- **Testing:** Vitest + Testing Library, PGlite for database tests
- **CI:** GitHub Actions (type check, lint, test, build) on pull requests

## Features

- **Public resume page** at `/`, rendered on the server from the database
- **Bilingual** (EN/SV): the language is a cookie, so the first render is already in the right
  language. Toggle in the top bar.
- **Dark/light theme**, remembered per browser, with no flash on load
- **Generic sections:** create any section (Experience, Skills, Education, …) from the admin
  without schema changes. Two display types: **entries** (title, subtitle, dates, link,
  markdown description) and **chips** (tags).
- **Markdown** descriptions and bio: headings, bold, italics, bullet and numbered lists, links.
  The admin editor has a toolbar and a live preview.
- **PDF export** (`/api/pdf?lang=en|sv`): A4, markdown rendered as real lists, no section
  heading at the bottom of a page, and entries never split across pages
- **Separate site and PDF visibility** for each section
- **Reorderable** sections and items
- **Profile photo:** upload any image (scaled to 256×256 on the server, metadata removed), or link
  an existing image URL
- **Profile links:** GitHub and LinkedIn usernames, each with a show/hide switch. GitHub is
  filled in from the admin's login when empty.

### Job applications (admin only)

Private to the signed-in admin. Nothing about applications is ever sent to anyone else, on any
page or PDF.

- **Applications list:** active applications by deadline, closed ones (accepted, rejected,
  withdrawn) apart. Signing in lands here.
- **Status timeline:** Not applied → Applied → Interviewing → Offer → Accepted / Rejected /
  Withdrawn, every change recorded with its date. Moving to Applied fills in the applied date.
- **Needs attention:** an unapplied application whose deadline is within the attention window
  (7 days by default, set in Settings) or has passed. Shown at the top of the list, as a count
  in the admin nav, and as a slim notice on the public pages, for the admin only.
- **Details:** company, role, language (English/Swedish), location, ad link, the ad's text
  (kept in case the ad is taken down), deadline and notes.
- **Contacts:** the people involved, each with role, email, phone and a note.
- **Personal letter:** one per application, in markdown with the editor's live preview. It can
  start as a copy of an earlier letter. Its PDF is in the CV's style, optionally with your
  contact details at the top, a recipient (the company and a contact), and **your CV appended**
  as one combined PDF.
- **One language per application:** the letter, the attached CV and a CV-only snapshot all
  follow the application's language, never the site's current language.
- **Snapshots:** "Save what I sent" stores the PDF exactly as it was sent (the letter, the
  letter + CV, or the CV alone). Offered when the status becomes Applied; never automatic. Later
  edits to the letter or the CV don't change a snapshot. Download or delete them from the
  application page.

## Prerequisites

- Node.js **24+** (see `.nvmrc`)
- pnpm **11+**
- PostgreSQL (developed against 16)

## Setup

```bash
git clone https://github.com/msvens/cv.git
cd cv
pnpm install
```

Create a database and user:

```bash
createuser resume --pwprompt
createdb -O resume resume
```

Configure the environment and fill in the values (see [Environment](#environment)):

```bash
cp .env.example .env
```

Create the schema and, for a fresh database, the initial content:

```bash
pnpm db:migrate   # idempotent; applies any pending migrations
pnpm db:seed      # WIPES all content and inserts the seed data. Never on a database with real edits.
```

Start the dev server:

```bash
pnpm dev          # http://localhost:3004
```

## Environment

Every variable the app reads is declared, with validation, in `src/env.ts` (SvelteKit's explicit
environment variables). A missing or invalid value **fails both `pnpm build` and server start**
with a message naming the variable.

| Variable                                    | Description                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                              | Postgres connection string                                                                                         |
| `BETTER_AUTH_SECRET`                        | Encrypts the session cookie; at least 32 characters (`openssl rand -base64 32`)                                    |
| `BETTER_AUTH_URL`                           | Public origin of the app, e.g. `http://localhost:3004` in dev                                                      |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | From the GitHub OAuth app (see below)                                                                              |
| `ADMIN_GITHUB_ID`                           | The **numeric** GitHub user ID allowed into the admin: `curl -s https://api.github.com/users/YOUR_LOGIN \| jq .id` |

These are read by `adapter-node` itself in production, not by the app:

| Variable          | Description                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `ORIGIN`          | The public URL. **Required** in production, or form submissions fail SvelteKit's cross-site check. |
| `PORT`            | Defaults to 3000; this app uses **3004**                                                           |
| `BODY_SIZE_LIMIT` | Defaults to 512 KB. Set **`10M`** so photo uploads (up to 10 MB) work.                             |

## Admin and GitHub OAuth

The admin at `/admin` has the job applications, the profile and photo, the sections and items,
and the settings. Only the GitHub account whose numeric ID is `ADMIN_GITHUB_ID` can sign in.
Anyone else is refused at sign-in, and every admin page, action and PDF endpoint checks again.
Everything sent to the signed-in admin carries `Cache-Control: private, no-store`.

1. Create a GitHub OAuth app at <https://github.com/settings/developers>.
2. Set its callback URL to `<BETTER_AUTH_URL>/api/auth/callback/github`, e.g.
   `http://localhost:3004/api/auth/callback/github` for dev. Use a separate OAuth app for
   production, with the production URL.
3. Put the client ID and secret in `.env`.

## Scripts

| Script                          | Description                                                       |
| ------------------------------- | ----------------------------------------------------------------- |
| `pnpm dev`                      | Dev server on port 3004                                           |
| `pnpm build`                    | Production build into `build/` (needs the environment, see above) |
| `pnpm start`                    | Run the production build (`node build`; reads `.env` if present)  |
| `pnpm check`                    | Everything CI runs: type check, lint, tests, build                |
| `pnpm check:svelte`             | Type check (svelte-check)                                         |
| `pnpm lint`                     | Prettier + ESLint                                                 |
| `pnpm format`                   | Format with Prettier                                              |
| `pnpm test` / `pnpm test:watch` | Vitest                                                            |
| `pnpm db:generate`              | Generate a migration after changing `src/lib/server/db/schema.ts` |
| `pnpm db:migrate`               | Apply pending migrations (idempotent)                             |
| `pnpm db:seed`                  | **Wipe** and reseed all content                                   |
| `pnpm db:studio`                | Drizzle Studio (database browser)                                 |

## Project structure

```
src/
  env.ts                        # declared + validated environment variables
  hooks.server.ts               # language, session, /admin guard
  routes/
    +page.server.ts / +page.svelte    # public resume page
    api/pdf/+server.ts                # PDF download
    photo/+server.ts                  # uploaded profile photo
    admin/
      signin/                         # GitHub sign-in
      signout/+server.ts
      (app)/                          # signed-in admin
        applications/                 # list; [id]: details, contacts, snapshots
          [id]/letter/                # letter editor
          [id]/letter.pdf/            # letter (+ CV) PDF
          [id]/snapshots/[sid]/       # a saved snapshot's PDF
        profile/  sections/  settings/
  lib/
    components/                 # layout (TopBar, Footer), resume, admin
    server/                     # server-only: db, services, auth, pdf, forms, photo,
                                #   applicationPdf.ts (every PDF sent with an application)
    validation/schemas.ts       # zod schemas for the admin forms
    markdown*.ts                # safe markdown tree, parser, editor helpers
    translations.ts             # UI strings (en/sv; the admin is English-only)
scripts/                        # migrate, seed (run with tsx)
drizzle/migrations/             # generated SQL migrations (committed; never edited)
static/                         # favicon, default profile.jpg
```

## Database

The resume:

- **`profile`:** one row with name, title (EN/SV), email, phone, location (EN/SV), GitHub and
  LinkedIn usernames plus show switches, photo URL, availability, bio (EN/SV), `updated_at`
  (shown in the footer; job-application changes never move it)
- **`profile_photo`:** the uploaded photo, at most one row: a processed JPEG, served at
  `/photo?v=…`
- **`section`:** slug, label (EN/SV), display type (`entries`/`chips`), `visible`,
  `show_in_pdf`, sort order
- **`section_item`:** belongs to a section: title, subtitle and description (EN/SV), start and
  end dates, link, sort order

Job applications (deleting an application deletes everything below it):

- **`application`:** company, role, status, language, ad link and text, location, deadline,
  applied date, notes
- **`application_status_change`:** the timeline, one row per status the application has had
- **`application_contact`:** name, role, email, phone, note
- **`letter`:** at most one per application: the markdown body and the PDF options (contact
  details, recipient, attach the CV)
- **`application_snapshot`:** a frozen PDF (`bytea`) with its kind, language, filename and date
- **`settings`:** one row, one typed column per setting (the attention window)

Statuses, languages and snapshot kinds are plain text checked in code, so adding one needs no
migration.

Change the schema in `src/lib/server/db/schema.ts`, then run `pnpm db:generate` to create a new
migration. Never edit an existing migration.

## Testing

- `*.svelte.test.ts` run in jsdom (components). Everything else runs in Node.
- **Database code is tested against PGlite**, a real Postgres running in memory inside the test
  process, with the real migrations applied. Tests never touch your dev database, and CI needs
  no database service.
- Tests run with `TZ=Europe/Stockholm`.

## Deployment

A long-running Node process behind a reverse proxy:

1. `pnpm install --frozen-lockfile`, on the server itself, so `sharp` gets the right native
   binary for the platform.
2. Provide the environment (a `.env` in the app directory works). **The build validates it too.**
3. `pnpm build`, then `pnpm db:migrate`.
4. Run `pnpm start` (`node build`) under a process manager, with `ORIGIN`, `PORT=3004` and
   `BODY_SIZE_LIMIT=10M`.
5. In the reverse proxy, allow request bodies of at least 10 MB for photo uploads (nginx:
   `client_max_body_size 10m;`, since nginx's default is 1 MB).

`pnpm db:migrate` is safe to run on every deploy.
