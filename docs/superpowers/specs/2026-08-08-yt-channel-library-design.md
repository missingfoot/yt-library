# YouTube Channel Library — Design Spec

Date: 2026-08-08

## Problem / Intent

The project currently has a static export of 722 subscribed YouTube channels
(`youtube_subscriptions.json`) plus a hand-built single-page HTML app
(`channel_library.html`) that embeds the same JSON inline and renders a
searchable/filterable/taggable UI with client-side-only edits (persisted via
some local storage/overrides mechanism, not the source JSON). 244 of 722
channels (34%) are still `"Uncategorized"`.

Goal: turn this into a proper Next.js app backed by InstantDB (via
getadb.com's InstantDB) so that:
- Browsing/searching/filtering channels feels like a Spotify-style library
- Categorization/tagging work (finishing the 244 uncategorized channels, and
  ongoing retagging) is easy and persists centrally
- Channels and categories/tags can be added, edited, or removed entirely
  through the UI, with no manual JSON editing

## Architecture

- **Next.js (App Router, TypeScript)**, single app, no separate backend —
  InstantDB is the database and sync layer, queried directly from the client
  via `@instantdb/react`.
- **Styling: Tailwind CSS.** Rebuild the existing dark theme (colors, type
  scale, category color coding, card grid, sticky filter bar) as Tailwind
  utility classes / a small design-token config (`tailwind.config.ts` theme
  extension), rather than porting the raw CSS verbatim.
- **No auth.** InstantDB permissions left open/permissive for reads and
  writes. This is a personal tool; if it's ever deployed, the URL is treated
  as effectively private (not indexed, not shared).
- **No source-JSON sync at runtime.** The JSON file is only used once, by a
  seed script, to populate InstantDB. After that, InstantDB is the single
  source of truth and the app never reads the JSON file again.

## Data Model (InstantDB schema)

Three entity types, defined in `instant.schema.ts`:

- **`channels`**
  - `channelId` (string, the YouTube `UC...` id — kept distinct from
    InstantDB's own internal row id)
  - `title` (string)
  - `url` (string)
  - `createdAt` (number, epoch ms)
- **`categories`**
  - `name` (string, unique)
  - `color` (string, hex — carried over from the existing
    `CATEGORY_COLORS` palette in `channel_library.html`)
- **`tags`**
  - `name` (string, unique)

**Links:**
- `channels.category` → `categories` (one category per channel; a channel
  may be uncategorized, i.e. no link, rather than relying on a magic
  `"Uncategorized"` string — the UI treats "no category" as the
  Uncategorized bucket)
- `channels.tags` ↔ `tags` (many-to-many)

Rationale for normalizing category/tags into their own entities instead of
free strings: enables rename-in-place (renaming a category updates every
channel that references it), safe delete-with-reassignment, and tag
autocomplete backed by a real, queryable vocabulary — matching what the
existing HTML app already fakes client-side via `allCategories`/`allTags`.

## Seed Script

`scripts/seed.ts`, run once manually via `tsx scripts/seed.ts` (not part of
app runtime):
1. Reads `youtube_subscriptions.json`.
2. Uses the InstantDB **admin SDK** (server-side, needs an admin token from
   the InstantDB dashboard) to batch-create all distinct categories (from
   the existing `CATEGORY_COLORS` palette in the HTML file, ~19 total) and
   all distinct tags found across all channels.
3. Batch-creates all 722 channels, linking each to its category (skipped/
   left unlinked for `"Uncategorized"`) and its tags, via `db.transact`
   with chunked batches (InstantDB has per-transaction size practical
   limits — batch ~50-100 entities per transact call).
4. Idempotency isn't a hard requirement (one-time run against a fresh app),
   but the script should be safe to re-run against an empty database
   without manual cleanup steps documented.

## Features (v1)

**Browsing**
- Header/stats bar: total channel count, category count (excluding
  Uncategorized), uncategorized count — mirrors the existing hero/stats-row.
- Live search-as-you-type on channel title.
- Category filter: multi-select chips with per-category counts, colored
  per the category palette.
- Tag filter: multi-select chips with per-tag counts, with an AND/OR toggle
  for how selected tags combine (matches existing `filteredList` behavior).
- Sort: by name or by category.
- Channel cards: title, category (color dot), tags, link out to the
  YouTube channel URL in a new tab.

**Editing (full CRUD)**
- Inline edit panel per card (opened via an "edit" affordance on the
  card, same interaction as the existing HTML): change title/url, change
  category (dropdown of existing categories, or create-new-inline), add/
  remove tags (autocomplete against the existing tag vocabulary, or
  create-new-inline).
- Add new channel: a form (title, URL or channel ID, category, tags).
- Delete channel: with a confirmation step.
- Manage categories: rename (propagates to all linked channels
  automatically since it's a relation, not a copy), delete (channels
  linked to a deleted category fall back to Uncategorized — i.e. the link
  is simply removed, not the channels).
- Manage tags: rename, delete (removes the tag link from any channels that
  had it).

All writes go directly through `db.transact` — InstantDB's realtime
local-first sync means no explicit "save" step is needed for most actions;
the edit panel batches its own field changes into one transact call on
"Save" to match the existing UX rather than firing a write per keystroke.

## Project Setup

- Scaffold via `create-next-app` (TypeScript, App Router, Tailwind CSS
  enabled at scaffold time, `src/` directory, no other opinionated
  add-ons).
- Provision the InstantDB app via `npx instant-cli@latest init`, which
  creates the app on InstantDB (getadb.com) and writes
  `NEXT_PUBLIC_INSTANT_APP_ID` into `.env.local`; push the schema via the
  CLI's schema push command.
- Admin token (for the seed script only) stored as `INSTANT_APP_ADMIN_TOKEN`
  in `.env.local` (server-side only, never exposed to the client bundle).
- Run locally with `npm run dev`. No deployment in v1 — local dev only.

## Out of Scope (v1)

- Auth / multi-user access control
- Deployment (Vercel etc.) — explicitly deferred
- Any YouTube API integration (thumbnails, subscriber counts, recent
  videos) — the data model intentionally stays limited to what's in the
  existing JSON
- Bulk CSV/JSON re-import from within the UI (seed script covers the
  one-time migration; future imports are a possible follow-up, not v1)

## Verification Plan

1. `npm run dev` boots without errors.
2. After running the seed script, the app shows 722 channels, 19
   categories (18 real + the "no category" bucket), and the same
   uncategorized count (244) as today.
3. Search for a known channel title (e.g. "PewDiePie") returns it.
4. Filter by a category (e.g. "Gaming") shows only its ~86 channels; filter
   by a tag narrows further; AND/OR toggle changes result count correctly.
5. Edit a channel's category and tags, reload the page, confirm the change
   persisted (proves InstantDB round-trip, not just local state).
6. Add a new channel, see it appear immediately; delete it, confirm it's
   gone after reload.
7. Rename a category, confirm all previously-linked channels show the new
   name; delete a category, confirm its channels fall back to
   Uncategorized rather than being deleted.
