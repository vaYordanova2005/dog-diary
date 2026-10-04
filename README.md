# The Dog Diary

A web app for keeping the medical records of animals at a veterinary clinic:
who the owner is, what was done and when, which medications were prescribed,
and when the next vaccination is due.

> This is the English, demo version of a project I built for a real clinic.
> It runs on its own database with made-up animals and owners — no real data.

**Live demo:** https://dog-diary-alpha.vercel.app/ — no sign-up and no password: click "Continue as doctor" or "Continue as intern".

## Features

- **Animal list** — search while typing (name, species, breed, owner) and filter by species, breed and gender.
- **Animal profile** — details, owner, examinations, vaccinations (with the next due date, overdue doses are highlighted) and prescribed medications. Everything is editable in place.
- **Photos and documents** — upload images, PDF and Word files straight to Cloudinary, organise them in folders and move them by drag and drop.
- **New animal** — pick an existing owner or create a new one on the spot.
- **Accounts and roles** — username + password login, with a "remember me" option and a page to change your own password.
  - `DOCTOR` — full access.
  - `INTERN` — can add and edit, but cannot delete anything. This is enforced both in the UI and in the server actions.
- **One-click demo login** — with `DEMO_MODE="true"`, the login page shows "Continue as doctor / intern" buttons that sign in without a password. It only ever works for those two demo accounts, and only when the flag is set.

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Turbopack), TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (Neon) with Prisma 7 and the `pg` driver adapter |
| Auth | Auth.js / NextAuth v5 (Credentials provider, bcrypt, JWT sessions) |
| Files | Cloudinary (signed direct browser uploads) |
| Hosting | Vercel |

A few things I'm happy with:

- **Auth split for the Edge runtime** — `proxy.ts` runs on the Edge, where Prisma can't, so the config is split into a light `auth.config.ts` (route protection) and a full `auth.ts` (credentials + database).
- **Roles re-checked on every request** — the role is re-read from the database, so a role change or a deleted account takes effect immediately.
- **Direct-to-Cloudinary uploads** — the browser uploads with a signature issued by a server action, and the server then re-reads the file from Cloudinary instead of trusting what the browser reports (size, URL). Orphaned files are cleaned up if saving fails.
- **Server actions that return errors** — upload/folder actions return `{ error }` instead of throwing, because production Next.js hides the message of thrown errors.

## Running locally

1. `npm install`
2. Create a `.env` file in the project root (it is not committed):
   ```
   DATABASE_URL="postgresql://...neon.tech/...?sslmode=require&uselibpqcompat=true"
   AUTH_SECRET="..."            # e.g. output of: npx auth secret
   # REGISTRATION_CODE="..."    # optional: enables /register in production
   DEMO_MODE="true"             # one-click login for the demo accounts (no password)

   # Optional — only needed for photo/document uploads
   # CLOUDINARY_CLOUD_NAME="..."
   # CLOUDINARY_API_KEY="..."
   # CLOUDINARY_API_SECRET="..."
   ```
3. `npx prisma migrate deploy` — applies the migrations.
4. `npm run seed` — creates the `doctor` and `intern` demo accounts and a few made-up animals (safe to re-run). The accounts get a random password nobody knows; with `DEMO_MODE="true"` you sign in with the one-click buttons.
5. `npm run dev` — starts the app at http://localhost:3000

### Demo accounts

| Role | What it can do |
|---|---|
| Doctor | Everything, including deleting records |
| Intern | Add and edit, but not delete |

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run seed` | Creates the demo accounts and sample animals |
| `npx prisma migrate deploy` | Applies migrations |
| `npx prisma studio` | Visual database browser/editor |

## Deployment (Vercel)

Every push to `main` deploys automatically. Vercel needs `DATABASE_URL` and
`AUTH_SECRET`, `DEMO_MODE="true"` for a public demo, optionally `REGISTRATION_CODE`,
and the three `CLOUDINARY_*` variables if file uploads should work.

New migrations are written by hand as a folder in `prisma/migrations/` and
applied with `npx prisma migrate deploy`, because `prisma migrate dev`
doesn't work non-interactively.
