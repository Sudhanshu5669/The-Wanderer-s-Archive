# Sudhanshu's Wanderer Archives

An immersive, book-like reading hub where every page can carry its own weather —
fire, frost, gold, starlight — because the look of the page is part of the story.

## Run it locally

```bash
npm run dev
```

Then open **http://localhost:3000**.

- **The Shelf** (`/`) — your public books.
- **The Archivist's Study** (`/archivist`) — where you write. Log in with the
  credentials in `.env` (`ARCHIVIST_EMAIL` / `ARCHIVIST_PASSWORD`).

> First time on a fresh database? Run `npm run migrate` then `npm run seed` to
> create your account and two demo books.

## How to write a book

1. Go to **/archivist** and click **+ Create** to make a book (Single or Collection).
2. Open the book → set its **title, blurb, genres, cover** → add **chapters**.
3. Click **✎ Write** on a chapter to open the **live editor**:
   - Type straight onto the page.
   - Each block of the story is a **Scene**. Use **+ Add scene** to start a new mood.
   - Select a scene and use the **Inspector** on the right to design it —
     background (color / gradient / image), **edge fade**, ink color & **font**,
     an **ambient effect** (starfield, burning ink, light rays, snow, rain, fog),
     and **stickers** (blood, etc.).
   - Apply a **Preset** (Hell, Heaven, Night, Brutal B&W) as a starting point.
   - Changes save automatically ("● Saved"). Hit **Preview ↗** to read it.
4. Back on the shelf, flip a book to **Public** when it's ready to be read.

Readers can switch between **📜 scroll** and **📖 page** modes while reading.

## The stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind v4** + a CSS-variable Scene Theme Engine (`lib/theme.ts`,
  `components/scene/`) shared by the editor and the reader
- **TipTap** for the edit-on-the-page WYSIWYG
- **Prisma 7** on **SQLite** locally (portable to Postgres for deploy)
- A lightweight `jose`-signed single-Archivist session (see `lib/session.ts`,
  `lib/auth.ts`, `proxy.ts`)
- Local-disk image uploads in dev (`lib/blob.ts`) — swap to Vercel Blob at deploy

## Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local site |
| `npm run build` | Production build |
| `npm run migrate` | Create/apply DB migrations |
| `npm run seed` | Seed the Archivist account + demo books |
| `npm run db:studio` | Browse the database (Prisma Studio) |

## Going live (later)

The app is built to deploy on **Vercel** with **Neon** (Postgres) and **Vercel
Blob**. The only code changes needed are swapping the Prisma adapter in
`lib/db.ts` and the upload backend in `lib/blob.ts`; the schema is already
Postgres-compatible.
