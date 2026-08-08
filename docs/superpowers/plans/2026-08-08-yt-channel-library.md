# YouTube Channel Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the static `youtube_subscriptions.json` (722 channels) and `channel_library.html` prototype into a Next.js + InstantDB app with live search/filter/sort and full CRUD over channels, categories, and tags.

**Architecture:** Next.js (App Router, TypeScript, Tailwind) client-only app. InstantDB (`@instantdb/react`) is the sole datastore, queried directly from client components via `db.useQuery` and mutated via `db.transact`. A one-time admin-SDK seed script migrates the JSON into InstantDB. No auth, no server API routes needed.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, `@instantdb/react`, `@instantdb/admin` (seed script only), Vitest (pure-logic unit tests), `tsx` (running the seed script).

## Global Constraints

- No auth — InstantDB permission rules allow open view/create/update/delete on all three entities (personal tool, spec explicitly scopes auth out of v1).
- Local dev only in v1 — no deployment step.
- Category palette must match the existing 19 colors from `channel_library.html` verbatim (see Task 3).
- The source JSON (`youtube_subscriptions.json`) is read exactly once, by the seed script — the running app never reads it.
- "No category" is represented by the *absence* of a `channels.category` link, not a literal `"Uncategorized"` string — the UI treats unlinked channels as the Uncategorized bucket (per spec's Data Model section).

---

## File Structure

```
package.json, tsconfig.json, next.config.ts, tailwind.config.ts   — scaffolded by create-next-app
instant.schema.ts          — InstantDB entity/link schema (shared by app + seed script)
instant.perms.ts           — InstantDB permission rules (open)
.env.local                 — NEXT_PUBLIC_INSTANT_APP_ID, INSTANT_APP_ADMIN_TOKEN (gitignored)
scripts/seed.ts            — one-time migration of youtube_subscriptions.json into InstantDB
src/lib/db.ts               — InstantDB client init (client-side)
src/lib/categoryColors.ts   — category name -> hex color palette + catColor() lookup
src/lib/filterChannels.ts   — pure functions: search/filter/sort over channel list (unit tested)
src/app/layout.tsx          — root layout, font imports, globals.css
src/app/globals.css         — Tailwind directives + CSS variables (dark theme tokens)
src/app/page.tsx            — main page: query hook, filter state, composes components below
src/components/StatsBar.tsx         — total/categories/uncategorized counts
src/components/SearchBar.tsx        — title search input
src/components/FilterChips.tsx      — generic multi-select chip list (used for categories + tags)
src/components/ChannelCard.tsx      — one channel card (view mode + delete action)
src/components/EditChannelPanel.tsx — inline edit form for a channel (title/url/category/tags)
src/components/AddChannelModal.tsx  — create-new-channel form
src/components/ManageTaxonomyModal.tsx — rename/delete categories and tags
```

---

### Task 1: Scaffold Next.js app with Tailwind and InstantDB dependencies

**Files:**
- Create: entire Next.js project at `/home/james/Projects/yt-playlist` (scaffolded in place — the two existing files `youtube_subscriptions.json` and `channel_library.html` stay untouched at the root)

**Interfaces:**
- Produces: a running `npm run dev` Next.js app on `localhost:3000` that all later tasks build inside.

- [ ] **Step 1: Scaffold the app**

Run from `/home/james/Projects/yt-playlist`:
```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --eslint --no-import-alias --use-npm
```
When prompted about the directory not being empty, confirm — it will only add its own scaffold files alongside the existing `youtube_subscriptions.json` / `channel_library.html`.

- [ ] **Step 2: Install InstantDB + seed script dependencies**

```bash
npm install @instantdb/react @instantdb/admin
npm install -D tsx vitest dotenv
```

- [ ] **Step 3: Verify the dev server boots**

Run: `npm run dev`
Expected: server starts on `http://localhost:3000` and the default Next.js starter page loads without errors. Stop the server (Ctrl-C) once confirmed.

- [ ] **Step 4: Add a `test` script and gitignore check**

Edit `package.json` scripts to add:
```json
"test": "vitest run"
```
Confirm `.gitignore` (created by `create-next-app`) already excludes `.env*.local` and `node_modules` — it does by default, no edit needed.

- [ ] **Step 5: Commit**

```bash
git init
git add -A
git commit -m "Scaffold Next.js app with Tailwind, InstantDB, and Vitest"
```

---

### Task 2: Provision InstantDB app and define schema + permissions

**Files:**
- Create: `instant.schema.ts`
- Create: `instant.perms.ts`
- Modify: `.env.local` (created by the CLI)

**Interfaces:**
- Produces: `AppSchema` type and default-exported `schema` from `instant.schema.ts`, imported by `src/lib/db.ts` (Task 3) and `scripts/seed.ts` (Task 5).

- [ ] **Step 1: Provision the InstantDB app**

Run:
```bash
npx instant-cli@latest init
```
Follow the prompts to log in (via getadb.com/InstantDB) and create a new app named "yt-channel-library". This writes `NEXT_PUBLIC_INSTANT_APP_ID` into `.env.local` and scaffolds a starter `instant.schema.ts` / `instant.perms.ts` — you'll overwrite both in the next steps.

- [ ] **Step 2: Get an admin token**

In the InstantDB dashboard for this app, find the Admin SDK token (under app settings). Add it to `.env.local`:
```
INSTANT_APP_ADMIN_TOKEN=<paste-token-here>
```

- [ ] **Step 3: Write the schema**

Write `instant.schema.ts`:
```typescript
import { i } from "@instantdb/core";

const _schema = i.schema({
  entities: {
    channels: i.entity({
      channelId: i.string().unique().indexed(),
      title: i.string(),
      url: i.string(),
      createdAt: i.number(),
    }),
    categories: i.entity({
      name: i.string().unique().indexed(),
      color: i.string(),
    }),
    tags: i.entity({
      name: i.string().unique().indexed(),
    }),
  },
  links: {
    channelCategory: {
      forward: { on: "channels", has: "one", label: "category" },
      reverse: { on: "categories", has: "many", label: "channels" },
    },
    channelTags: {
      forward: { on: "channels", has: "many", label: "tags" },
      reverse: { on: "tags", has: "many", label: "channels" },
    },
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
```

- [ ] **Step 4: Write permission rules**

Write `instant.perms.ts`:
```typescript
import type { InstantRules } from "@instantdb/react";

const rules = {
  channels: {
    allow: { view: "true", create: "true", update: "true", delete: "true" },
  },
  categories: {
    allow: { view: "true", create: "true", update: "true", delete: "true" },
  },
  tags: {
    allow: { view: "true", create: "true", update: "true", delete: "true" },
  },
} satisfies InstantRules;

export default rules;
```

- [ ] **Step 5: Push schema and permissions to InstantDB**

Run:
```bash
npx instant-cli@latest push
```
Expected: CLI confirms the schema (3 entities, 2 links) and permission rules were pushed successfully to the app.

- [ ] **Step 6: Commit**

```bash
git add instant.schema.ts instant.perms.ts
git commit -m "Define InstantDB schema and open permission rules"
```
(`.env.local` is gitignored and stays local — do not commit it.)

---

### Task 3: DB client and category color palette

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/lib/categoryColors.ts`
- Test: `src/lib/categoryColors.test.ts`

**Interfaces:**
- Consumes: `schema` from `instant.schema.ts` (Task 2)
- Produces: `db` (InstantDB client instance) from `src/lib/db.ts`; `catColor(name: string): string` and `CATEGORY_NAMES: string[]` from `src/lib/categoryColors.ts` — used by Task 6 (StatsBar), Task 7 (FilterChips), Task 8 (ChannelCard).

- [ ] **Step 1: Write the failing test**

Write `src/lib/categoryColors.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { catColor, CATEGORY_NAMES } from "./categoryColors";

describe("catColor", () => {
  it("returns the correct hex for a known category", () => {
    expect(catColor("Gaming")).toBe("#E8734A");
  });

  it("returns the fallback gray for an unknown category", () => {
    expect(catColor("Not A Real Category")).toBe("#5C6274");
  });

  it("returns the fallback gray for undefined (no category)", () => {
    expect(catColor(undefined)).toBe("#5C6274");
  });
});

describe("CATEGORY_NAMES", () => {
  it("contains all 19 known categories, excluding Uncategorized", () => {
    expect(CATEGORY_NAMES).toHaveLength(19);
    expect(CATEGORY_NAMES).not.toContain("Uncategorized");
    expect(CATEGORY_NAMES).toContain("Gaming");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/categoryColors.test.ts`
Expected: FAIL — `Cannot find module './categoryColors'`

- [ ] **Step 3: Write the implementation**

Write `src/lib/categoryColors.ts`:
```typescript
const CATEGORY_COLORS: Record<string, string> = {
  "Gaming": "#E8734A",
  "Science & Education": "#4FA8A0",
  "Tech & Gadgets": "#5B8DEF",
  "Video Essays & Culture": "#B98CE0",
  "Comedy & Entertainment": "#E8C34A",
  "Movies & TV Commentary": "#E85D75",
  "History": "#C08552",
  "Engineering & Making": "#8CA85E",
  "Cooking & Food": "#E89A4A",
  "Art & Design": "#D97BC4",
  "Cars & Vehicles": "#8B9BC4",
  "Music": "#7FC9E8",
  "Travel & Lifestyle": "#7ED9A8",
  "News & Politics Commentary": "#C4574A",
  "Anime & Animation": "#E084C1",
  "Aviation & Military": "#8FA37F",
  "Beauty & Fashion": "#E896C0",
  "Fitness & Health": "#6EC086",
  "ASMR": "#A896D9",
};

const UNCATEGORIZED_COLOR = "#5C6274";

export const CATEGORY_NAMES = Object.keys(CATEGORY_COLORS);

export function catColor(name: string | undefined): string {
  if (!name) return UNCATEGORIZED_COLOR;
  return CATEGORY_COLORS[name] ?? UNCATEGORIZED_COLOR;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/categoryColors.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Write the DB client**

Write `src/lib/db.ts`:
```typescript
import { init } from "@instantdb/react";
import schema from "../../instant.schema";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;

if (!APP_ID) {
  throw new Error("NEXT_PUBLIC_INSTANT_APP_ID is not set in .env.local");
}

export const db = init({ appId: APP_ID, schema });
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/db.ts src/lib/categoryColors.ts src/lib/categoryColors.test.ts
git commit -m "Add InstantDB client and category color palette"
```

---

### Task 4: Pure filter/sort logic for channel lists

**Files:**
- Create: `src/lib/filterChannels.ts`
- Test: `src/lib/filterChannels.test.ts`

**Interfaces:**
- Produces: `ChannelView` type, `filterChannels(list, options): ChannelView[]` — used by Task 6's `page.tsx` to derive the visible list from the raw InstantDB query result + filter state.

`ChannelView` is the shape the UI works with after flattening InstantDB's linked query result (category/tags resolved to plain strings), decoupling filtering logic from InstantDB's query response shape.

- [ ] **Step 1: Write the failing tests**

Write `src/lib/filterChannels.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { filterChannels, type ChannelView } from "./filterChannels";

const sample: ChannelView[] = [
  { id: "1", title: "PewDiePie", url: "u1", category: "Gaming", tags: ["Let's Play", "Comedy"] },
  { id: "2", title: "Astrum", url: "u2", category: "Science & Education", tags: ["Space/Astronomy"] },
  { id: "3", title: "Arlo", url: "u3", category: "Gaming", tags: ["Lore/Analysis", "Commentary"] },
  { id: "4", title: "decayingmidwest", url: "u4", category: undefined, tags: [] },
];

describe("filterChannels", () => {
  it("returns all channels with no filters", () => {
    const result = filterChannels(sample, {});
    expect(result).toHaveLength(4);
  });

  it("filters by search query (case-insensitive substring on title)", () => {
    const result = filterChannels(sample, { search: "pewdie" });
    expect(result.map((c) => c.title)).toEqual(["PewDiePie"]);
  });

  it("filters by selected categories", () => {
    const result = filterChannels(sample, { categories: new Set(["Gaming"]) });
    expect(result.map((c) => c.title).sort()).toEqual(["Arlo", "PewDiePie"]);
  });

  it("treats undefined category as Uncategorized when selected", () => {
    const result = filterChannels(sample, { categories: new Set(["Uncategorized"]) });
    expect(result.map((c) => c.title)).toEqual(["decayingmidwest"]);
  });

  it("filters by tags with AND mode (default) requiring all selected tags", () => {
    const result = filterChannels(sample, { tags: new Set(["Let's Play", "Comedy"]), tagMode: "and" });
    expect(result.map((c) => c.title)).toEqual(["PewDiePie"]);
  });

  it("filters by tags with OR mode requiring any selected tag", () => {
    const result = filterChannels(sample, {
      tags: new Set(["Space/Astronomy", "Commentary"]),
      tagMode: "or",
    });
    expect(result.map((c) => c.title).sort()).toEqual(["Arlo", "Astrum"]);
  });

  it("sorts by name ascending, case-insensitive", () => {
    const result = filterChannels(sample, { sort: "name" });
    expect(result.map((c) => c.title)).toEqual(["Arlo", "Astrum", "decayingmidwest", "PewDiePie"]);
  });

  it("sorts by category, with Uncategorized last", () => {
    const result = filterChannels(sample, { sort: "category" });
    expect(result.map((c) => c.category ?? "Uncategorized")).toEqual([
      "Gaming",
      "Gaming",
      "Science & Education",
      "Uncategorized",
    ]);
  });

  it("combines search, category, and tag filters together", () => {
    const result = filterChannels(sample, {
      search: "ar",
      categories: new Set(["Gaming"]),
      tags: new Set(["Lore/Analysis"]),
    });
    expect(result.map((c) => c.title)).toEqual(["Arlo"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/filterChannels.test.ts`
Expected: FAIL — `Cannot find module './filterChannels'`

- [ ] **Step 3: Write the implementation**

Write `src/lib/filterChannels.ts`:
```typescript
export interface ChannelView {
  id: string;
  title: string;
  url: string;
  category: string | undefined;
  tags: string[];
}

export interface FilterOptions {
  search?: string;
  categories?: Set<string>;
  tags?: Set<string>;
  tagMode?: "and" | "or";
  sort?: "name" | "category";
}

function matchesCategory(channel: ChannelView, categories: Set<string>): boolean {
  const effective = channel.category ?? "Uncategorized";
  return categories.has(effective);
}

function matchesTags(channel: ChannelView, tags: Set<string>, mode: "and" | "or"): boolean {
  if (mode === "and") {
    return [...tags].every((t) => channel.tags.includes(t));
  }
  return [...tags].some((t) => channel.tags.includes(t));
}

export function filterChannels(list: ChannelView[], options: FilterOptions): ChannelView[] {
  let result = list;

  const search = options.search?.trim().toLowerCase();
  if (search) {
    result = result.filter((c) => c.title.toLowerCase().includes(search));
  }

  if (options.categories && options.categories.size > 0) {
    result = result.filter((c) => matchesCategory(c, options.categories!));
  }

  if (options.tags && options.tags.size > 0) {
    result = result.filter((c) => matchesTags(c, options.tags!, options.tagMode ?? "and"));
  }

  const sorted = [...result];
  if (options.sort === "category") {
    sorted.sort((a, b) => {
      const ac = a.category ?? "￿"; // sorts Uncategorized last
      const bc = b.category ?? "￿";
      if (ac !== bc) return ac.localeCompare(bc);
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    });
  } else {
    sorted.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
  }

  return sorted;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/filterChannels.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/filterChannels.ts src/lib/filterChannels.test.ts
git commit -m "Add pure filter/sort logic for channel lists"
```

---

### Task 5: Seed script — migrate JSON into InstantDB

**Files:**
- Create: `scripts/seed.ts`

**Interfaces:**
- Consumes: `schema` from `instant.schema.ts` (Task 2), `youtube_subscriptions.json` at repo root.
- Produces: populated InstantDB app (722 `channels`, 19 `categories`, full `tags` vocabulary, linked) — no exported symbols, this is a standalone script.

- [ ] **Step 1: Write the seed script**

Write `scripts/seed.ts`:
```typescript
import "dotenv/config";
import { init, id, tx } from "@instantdb/admin";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import schema from "../instant.schema";

interface SourceChannel {
  id: string;
  title: string;
  url: string;
  category: string;
  tags: string[];
}

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_APP_ADMIN_TOKEN;

if (!APP_ID || !ADMIN_TOKEN) {
  throw new Error("NEXT_PUBLIC_INSTANT_APP_ID and INSTANT_APP_ADMIN_TOKEN must be set in .env.local");
}

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN, schema });

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const raw = readFileSync(join(__dirname, "..", "youtube_subscriptions.json"), "utf-8");
  const channels: SourceChannel[] = JSON.parse(raw);

  const categoryNames = [...new Set(channels.map((c) => c.category).filter((c) => c !== "Uncategorized"))];
  const tagNames = [...new Set(channels.flatMap((c) => c.tags))];

  const categoryIds = new Map<string, string>();
  for (const name of categoryNames) categoryIds.set(name, id());

  const tagIds = new Map<string, string>();
  for (const name of tagNames) tagIds.set(name, id());

  console.log(`Seeding ${categoryNames.length} categories, ${tagNames.length} tags, ${channels.length} channels...`);

  const categoryTxs = categoryNames.map((name) =>
    tx.categories[categoryIds.get(name)!].update({ name, color: "" })
  );
  for (const batch of chunk(categoryTxs, 50)) {
    await db.transact(batch);
  }

  const tagTxs = tagNames.map((name) => tx.tags[tagIds.get(name)!].update({ name }));
  for (const batch of chunk(tagTxs, 50)) {
    await db.transact(batch);
  }

  const channelTxs = channels.map((ch) => {
    const channelId = id();
    let txStep = tx.channels[channelId].update({
      channelId: ch.id,
      title: ch.title,
      url: ch.url,
      createdAt: Date.now(),
    });
    if (ch.category !== "Uncategorized") {
      txStep = txStep.link({ category: categoryIds.get(ch.category)! });
    }
    if (ch.tags.length > 0) {
      txStep = txStep.link({ tags: ch.tags.map((t) => tagIds.get(t)!) });
    }
    return txStep;
  });
  for (const batch of chunk(channelTxs, 50)) {
    await db.transact(batch);
  }

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Note: category `color` is seeded as `""` here because the palette lives in `src/lib/categoryColors.ts` (Task 3) and is looked up by name at render time — the DB doesn't need to duplicate the hex value, but the schema keeps the field for future direct-DB color overrides. Leave it empty string.

- [ ] **Step 2: Run the seed script**

Run:
```bash
npx tsx scripts/seed.ts
```
Expected: logs category/tag/channel counts, then "Seed complete." with no errors.

- [ ] **Step 3: Verify in the InstantDB dashboard**

Open the InstantDB dashboard's data explorer for this app. Confirm `channels` has 722 rows, `categories` has 19 rows, `tags` has the expected vocabulary (spot check a few, e.g. "Deep-Dive", "Comedy").

- [ ] **Step 4: Commit**

```bash
git add scripts/seed.ts
git commit -m "Add seed script to migrate youtube_subscriptions.json into InstantDB"
```

---

### Task 6: Page shell, InstantDB query hook, and stats bar

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/app/page.tsx`
- Create: `src/components/StatsBar.tsx`

**Interfaces:**
- Consumes: `db` (Task 3), `ChannelView`/`filterChannels` (Task 4), `catColor`/`CATEGORY_NAMES` (Task 3)
- Produces: `useChannelsQuery()`-shaped data flow inlined in `page.tsx` (raw InstantDB query → mapped `ChannelView[]`), passed down as props to all components built in Tasks 7-9. `StatsBar` props: `{ total: number; categoryCount: number; uncategorizedCount: number }`.

- [ ] **Step 1: Set dark theme tokens in globals.css**

Replace the contents of `src/app/globals.css` with:
```css
@import "tailwindcss";

:root {
  --bg: #12151c;
  --bg-2: #0e1116;
  --surface: #1a1e27;
  --surface-hover: #212636;
  --surface-active: #262c3c;
  --border: #282e3c;
  --border-soft: #20242f;
  --text: #ece9e2;
  --text-dim: #9198a9;
  --text-faint: #5c6274;
  --accent: #e8a33d;
  --accent-soft: rgba(232, 163, 61, 0.14);
  --accent-line: rgba(232, 163, 61, 0.35);
}

body {
  background: var(--bg);
  color: var(--text);
}
```

- [ ] **Step 2: Update the root layout**

Replace `src/app/layout.tsx` with:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Channel Library",
  description: "Browse, filter, and tag your YouTube channel subscriptions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Write StatsBar**

Write `src/components/StatsBar.tsx`:
```tsx
interface StatsBarProps {
  total: number;
  categoryCount: number;
  uncategorizedCount: number;
}

export function StatsBar({ total, categoryCount, uncategorizedCount }: StatsBarProps) {
  const stats = [
    { label: "Channels", value: total },
    { label: "Categories", value: categoryCount },
    { label: "Uncategorized", value: uncategorizedCount },
  ];

  return (
    <div className="flex gap-7 flex-wrap">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col gap-0.5">
          <span className="font-mono text-xl font-semibold text-[var(--text)]">{s.value}</span>
          <span className="font-mono text-[10.5px] tracking-wider uppercase text-[var(--text-faint)]">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Write the page shell with the InstantDB query**

Write `src/app/page.tsx`:
```tsx
"use client";

import { useMemo } from "react";
import { db } from "@/lib/db";
import { filterChannels, type ChannelView } from "@/lib/filterChannels";
import { StatsBar } from "@/components/StatsBar";

export default function Home() {
  const { isLoading, error, data } = db.useQuery({
    channels: { category: {}, tags: {} },
  });

  const channels: ChannelView[] = useMemo(() => {
    if (!data) return [];
    return data.channels.map((c) => ({
      id: c.id,
      title: c.title,
      url: c.url,
      category: c.category?.name,
      tags: c.tags.map((t) => t.name),
    }));
  }, [data]);

  const categoryCount = useMemo(
    () => new Set(channels.map((c) => c.category).filter(Boolean)).size,
    [channels]
  );
  const uncategorizedCount = channels.filter((c) => !c.category).length;

  const visible = useMemo(() => filterChannels(channels, { sort: "name" }), [channels]);

  if (isLoading) return <div className="p-10 text-[var(--text-dim)]">Loading...</div>;
  if (error) return <div className="p-10 text-red-400">Error: {error.message}</div>;

  return (
    <main className="max-w-[1180px] mx-auto px-6 pb-20">
      <div className="py-14 border-b border-[var(--border-soft)]">
        <h1 className="font-serif text-4xl font-semibold mb-3">Channel Library</h1>
        <p className="text-[var(--text-dim)] max-w-lg mb-6">
          Search, filter, and tag your YouTube subscriptions.
        </p>
        <StatsBar total={channels.length} categoryCount={categoryCount} uncategorizedCount={uncategorizedCount} />
      </div>
      <div className="py-6 text-[var(--text-dim)]">
        {visible.length} channel{visible.length === 1 ? "" : "s"} (filters land in Tasks 7-9)
      </div>
    </main>
  );
}
```

Add a path alias check: `create-next-app` sets up `@/*` -> `./src/*` in `tsconfig.json` by default when `--src-dir` is used; if `paths` is missing, add to `tsconfig.json`'s `compilerOptions`:
```json
"paths": { "@/*": ["./src/*"] }
```

- [ ] **Step 5: Verify in the browser**

Run `npm run dev`, open `http://localhost:3000`. Expected: page loads, shows "722" channels, correct category count, "244" uncategorized, and "722 channels" in the placeholder line below. This confirms the InstantDB query and schema linking work end-to-end.

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/app/page.tsx src/components/StatsBar.tsx tsconfig.json
git commit -m "Add page shell, InstantDB query wiring, and stats bar"
```

---

### Task 7: Search bar and category/tag filter chips

**Files:**
- Create: `src/components/SearchBar.tsx`
- Create: `src/components/FilterChips.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `ChannelView[]`, `filterChannels` (Task 4), `catColor` (Task 3)
- Produces: filter state lifted into `page.tsx` (`search`, `selectedCategories`, `selectedTags`, `tagMode`), passed to Task 8's `ChannelCard` grid.

- [ ] **Step 1: Write SearchBar**

Write `src/components/SearchBar.tsx`:
```tsx
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search channels..."
      className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5
                 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)]
                 focus:outline-none focus:border-[var(--accent-line)]"
    />
  );
}
```

- [ ] **Step 2: Write generic FilterChips**

Write `src/components/FilterChips.tsx`:
```tsx
export interface ChipItem {
  key: string;
  label: string;
  count: number;
  color?: string;
}

interface FilterChipsProps {
  items: ChipItem[];
  selected: Set<string>;
  onToggle: (key: string) => void;
}

export function FilterChips({ items, selected, onToggle }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = selected.has(item.key);
        return (
          <button
            key={item.key}
            onClick={() => onToggle(item.key)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
              ${isActive
                ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] hover:bg-[var(--surface-hover)]"
              }`}
          >
            {item.color && (
              <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            )}
            {item.label}
            <span className="text-[var(--text-faint)]">{item.count}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Wire search + filters into page.tsx**

Modify `src/app/page.tsx`: add filter state and derive chip data. Replace the body of the `Home` component with:
```tsx
"use client";

import { useMemo, useState } from "react";
import { db } from "@/lib/db";
import { filterChannels, type ChannelView } from "@/lib/filterChannels";
import { catColor } from "@/lib/categoryColors";
import { StatsBar } from "@/components/StatsBar";
import { SearchBar } from "@/components/SearchBar";
import { FilterChips, type ChipItem } from "@/components/FilterChips";

export default function Home() {
  const { isLoading, error, data } = db.useQuery({
    channels: { category: {}, tags: {} },
  });

  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [tagMode, setTagMode] = useState<"and" | "or">("and");

  const channels: ChannelView[] = useMemo(() => {
    if (!data) return [];
    return data.channels.map((c) => ({
      id: c.id,
      title: c.title,
      url: c.url,
      category: c.category?.name,
      tags: c.tags.map((t) => t.name),
    }));
  }, [data]);

  const categoryCount = useMemo(
    () => new Set(channels.map((c) => c.category).filter(Boolean)).size,
    [channels]
  );
  const uncategorizedCount = channels.filter((c) => !c.category).length;

  const categoryChips: ChipItem[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of channels) {
      const key = c.category ?? "Uncategorized";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ key, label: key, count, color: catColor(key === "Uncategorized" ? undefined : key) }));
  }, [channels]);

  const tagChips: ChipItem[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of channels) {
      for (const t of c.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ key, label: key, count }));
  }, [channels]);

  function toggleCategory(key: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleTag(key: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const visible = useMemo(
    () =>
      filterChannels(channels, {
        search,
        categories: selectedCategories,
        tags: selectedTags,
        tagMode,
        sort: "name",
      }),
    [channels, search, selectedCategories, selectedTags, tagMode]
  );

  if (isLoading) return <div className="p-10 text-[var(--text-dim)]">Loading...</div>;
  if (error) return <div className="p-10 text-red-400">Error: {error.message}</div>;

  return (
    <main className="max-w-[1180px] mx-auto px-6 pb-20">
      <div className="py-14 border-b border-[var(--border-soft)]">
        <h1 className="font-serif text-4xl font-semibold mb-3">Channel Library</h1>
        <p className="text-[var(--text-dim)] max-w-lg mb-6">
          Search, filter, and tag your YouTube subscriptions.
        </p>
        <StatsBar total={channels.length} categoryCount={categoryCount} uncategorizedCount={uncategorizedCount} />
      </div>

      <div className="sticky top-0 z-20 bg-[var(--bg)]/90 backdrop-blur py-4 border-b border-[var(--border-soft)] flex flex-col gap-4">
        <SearchBar value={search} onChange={setSearch} />
        <FilterChips items={categoryChips} selected={selectedCategories} onToggle={toggleCategory} />
        <div className="flex items-center gap-3">
          <FilterChips items={tagChips} selected={selectedTags} onToggle={toggleTag} />
          {selectedTags.size > 1 && (
            <button
              onClick={() => setTagMode((m) => (m === "and" ? "or" : "and"))}
              className="text-xs font-mono text-[var(--accent)] uppercase shrink-0"
            >
              match: {tagMode}
            </button>
          )}
        </div>
      </div>

      <div className="py-6 text-[var(--text-dim)]">
        {visible.length} channel{visible.length === 1 ? "" : "s"} (cards land in Task 8)
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify in the browser**

Run `npm run dev`. Type a known channel title into search (e.g. "PewDiePie") and confirm the count drops to 1. Click the "Gaming" category chip and confirm the count matches ~86. Click a tag chip and confirm the count narrows further. Clear filters and confirm the count returns to 722.

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchBar.tsx src/components/FilterChips.tsx src/app/page.tsx
git commit -m "Add search bar and category/tag filter chips"
```

---

### Task 8: Channel card grid

**Files:**
- Create: `src/components/ChannelCard.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `ChannelView` (Task 4), `catColor` (Task 3)
- Produces: `ChannelCard` props `{ channel: ChannelView; onEdit: () => void; onDelete: () => void }` — `onEdit`/`onDelete` wired up for real in Task 9.

- [ ] **Step 1: Write ChannelCard**

Write `src/components/ChannelCard.tsx`:
```tsx
import { catColor } from "@/lib/categoryColors";
import type { ChannelView } from "@/lib/filterChannels";

interface ChannelCardProps {
  channel: ChannelView;
  onEdit: () => void;
  onDelete: () => void;
}

export function ChannelCard({ channel, onEdit, onDelete }: ChannelCardProps) {
  const categoryLabel = channel.category ?? "Uncategorized";

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-3 hover:bg-[var(--surface-hover)] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <a
          href={channel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--text)] hover:text-[var(--accent)] leading-snug"
        >
          {channel.title}
        </a>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="text-xs font-mono text-[var(--text-faint)] hover:text-[var(--accent)] px-1.5 py-0.5"
          >
            edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs font-mono text-[var(--text-faint)] hover:text-red-400 px-1.5 py-0.5"
          >
            delete
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-[var(--text-dim)]">
        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: catColor(channel.category) }} />
        {categoryLabel}
      </div>

      {channel.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {channel.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--surface-active)] px-2 py-0.5 text-[11px] text-[var(--text-dim)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Render the grid in page.tsx**

In `src/app/page.tsx`, replace the placeholder line:
```tsx
      <div className="py-6 text-[var(--text-dim)]">
        {visible.length} channel{visible.length === 1 ? "" : "s"} (cards land in Task 8)
      </div>
```
with:
```tsx
      <div className="py-6 text-xs font-mono text-[var(--text-faint)]">
        {visible.length} channel{visible.length === 1 ? "" : "s"}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        ))}
      </div>
```
Add the import: `import { ChannelCard } from "@/components/ChannelCard";`

- [ ] **Step 3: Verify in the browser**

Run `npm run dev`. Confirm cards render in a responsive grid, each showing title (linking out to YouTube), category dot + label, and tag pills. Confirm clicking a card title opens the channel's YouTube page in a new tab.

- [ ] **Step 4: Commit**

```bash
git add src/components/ChannelCard.tsx src/app/page.tsx
git commit -m "Add channel card grid"
```

---

### Task 9: Edit panel and delete (full CRUD on a single channel)

**Files:**
- Create: `src/components/EditChannelPanel.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `db` (Task 3), `ChannelView` (Task 4), `CATEGORY_NAMES` (Task 3), raw `data.categories`/`data.tags` from the InstantDB query (Task 6) — needed here because editing must link to real `categories`/`tags` entity ids, not just names.
- Produces: working edit (title/url/category/tags) and delete for any channel, replacing the `onEdit`/`onDelete` no-ops from Task 8.

- [ ] **Step 1: Write EditChannelPanel**

Write `src/components/EditChannelPanel.tsx`:
```tsx
"use client";

import { useState } from "react";
import type { ChannelView } from "@/lib/filterChannels";

interface CategoryOption {
  id: string;
  name: string;
}
interface TagOption {
  id: string;
  name: string;
}

interface EditChannelPanelProps {
  channel: ChannelView;
  categories: CategoryOption[];
  tags: TagOption[];
  onSave: (updates: { title: string; url: string; category: string | undefined; tags: string[] }) => void;
  onCancel: () => void;
}

export function EditChannelPanel({ channel, categories, tags, onSave, onCancel }: EditChannelPanelProps) {
  const [title, setTitle] = useState(channel.title);
  const [url, setUrl] = useState(channel.url);
  const [category, setCategory] = useState<string | undefined>(channel.category);
  const [selectedTags, setSelectedTags] = useState<string[]>(channel.tags);
  const [tagInput, setTagInput] = useState("");

  const tagNames = tags.map((t) => t.name);

  function addTag(name: string) {
    const trimmed = name.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }

  return (
    <div className="rounded-lg border border-[var(--accent-line)] bg-[var(--surface)] p-4 flex flex-col gap-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
        placeholder="Title"
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
        placeholder="URL"
      />
      <select
        value={category ?? ""}
        onChange={(e) => setCategory(e.target.value || undefined)}
        className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
      >
        <option value="">Uncategorized</option>
        {categories.map((c) => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 rounded-full bg-[var(--surface-active)] px-2 py-0.5 text-[11px]"
          >
            {t}
            <button onClick={() => setSelectedTags((prev) => prev.filter((x) => x !== t))}>&times;</button>
          </span>
        ))}
      </div>
      <input
        list="tag-vocabulary"
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag(tagInput);
          }
        }}
        placeholder="Add tag and press Enter"
        className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
      />
      <datalist id="tag-vocabulary">
        {tagNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-xs font-mono text-[var(--text-dim)] px-3 py-1.5">
          cancel
        </button>
        <button
          onClick={() => onSave({ title, url, category, tags: selectedTags })}
          className="text-xs font-mono text-[var(--accent)] px-3 py-1.5 border border-[var(--accent-line)] rounded"
        >
          save
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire edit + delete transactions into page.tsx**

In `src/app/page.tsx`:
1. Add import: `import { EditChannelPanel } from "@/components/EditChannelPanel";`
2. Add `import { id } from "@instantdb/react";` (needed if creating new tag/category ids on the fly)
3. Add state: `const [editingId, setEditingId] = useState<string | null>(null);`
4. Add handler functions inside `Home`, above the `return`:
```tsx
  function handleDelete(channelId: string) {
    if (!confirm("Delete this channel?")) return;
    db.transact(db.tx.channels[channelId].delete());
  }

  async function handleSaveEdit(
    channelId: string,
    updates: { title: string; url: string; category: string | undefined; tags: string[] }
  ) {
    const txSteps = [];
    let step = db.tx.channels[channelId].update({ title: updates.title, url: updates.url });

    if (updates.category) {
      const existing = data?.categories.find((c) => c.name === updates.category);
      const categoryId = existing?.id ?? id();
      if (!existing) txSteps.push(db.tx.categories[categoryId].update({ name: updates.category, color: "" }));
      step = step.link({ category: categoryId });
    } else {
      step = step.unlink({ category: editingId ? undefined : undefined });
    }

    const tagIds: string[] = [];
    for (const tagName of updates.tags) {
      const existing = data?.tags.find((t) => t.name === tagName);
      const tagId = existing?.id ?? id();
      if (!existing) txSteps.push(db.tx.tags[tagId].update({ name: tagName }));
      tagIds.push(tagId);
    }
    step = step.link({ tags: tagIds });

    txSteps.push(step);
    await db.transact(txSteps);
    setEditingId(null);
  }
```
5. Replace the grid's `ChannelCard` mapping (from Task 8) with a version that renders `EditChannelPanel` in place of the card when editing:
```tsx
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((channel) =>
          editingId === channel.id ? (
            <EditChannelPanel
              key={channel.id}
              channel={channel}
              categories={data?.categories ?? []}
              tags={data?.tags ?? []}
              onCancel={() => setEditingId(null)}
              onSave={(updates) => handleSaveEdit(channel.id, updates)}
            />
          ) : (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onEdit={() => setEditingId(channel.id)}
              onDelete={() => handleDelete(channel.id)}
            />
          )
        )}
      </div>
```

**Fix the `unlink` branch**: the placeholder `step.unlink({ category: editingId ? undefined : undefined })` above is wrong — replace it with a real conditional. Change the `if (updates.category) { ... } else { ... }` block to:
```tsx
    if (updates.category) {
      const existing = data?.categories.find((c) => c.name === updates.category);
      const categoryId = existing?.id ?? id();
      if (!existing) txSteps.push(db.tx.categories[categoryId].update({ name: updates.category, color: "" }));
      step = step.link({ category: categoryId });
    }
```
(Dropping the `else` branch entirely: InstantDB's `has: "one"` link is simply not set when the channel already has none, and re-linking to a different category id automatically replaces the old link — no explicit unlink call is needed for the "still has a category, just changed" case. For "user clears category to Uncategorized," add one more branch: if `!updates.category && channel.category`, push `db.tx.channels[channelId].unlink({ category: existingCategoryId })` — look up `existingCategoryId` via `data?.categories.find(c => c.name === channel.category)?.id`.)

Full corrected handler:
```tsx
  async function handleSaveEdit(
    channelId: string,
    updates: { title: string; url: string; category: string | undefined; tags: string[] }
  ) {
    const txSteps = [];
    let step = db.tx.channels[channelId].update({ title: updates.title, url: updates.url });

    if (updates.category) {
      const existing = data?.categories.find((c) => c.name === updates.category);
      const categoryId = existing?.id ?? id();
      if (!existing) txSteps.push(db.tx.categories[categoryId].update({ name: updates.category, color: "" }));
      step = step.link({ category: categoryId });
    } else {
      const channelBefore = data?.channels.find((c) => c.id === channelId);
      const oldCategoryId = channelBefore?.category?.id;
      if (oldCategoryId) step = step.unlink({ category: oldCategoryId });
    }

    const tagIds: string[] = [];
    for (const tagName of updates.tags) {
      const existing = data?.tags.find((t) => t.name === tagName);
      const tagId = existing?.id ?? id();
      if (!existing) txSteps.push(db.tx.tags[tagId].update({ name: tagName }));
      tagIds.push(tagId);
    }
    step = step.link({ tags: tagIds });

    txSteps.push(step);
    await db.transact(txSteps);
    setEditingId(null);
  }
```

- [ ] **Step 3: Verify in the browser**

Run `npm run dev`. Click "edit" on a card, change its category and add a new tag not previously in the vocabulary, save, confirm the card updates immediately and the tag chip list (Task 7) gains the new tag with count 1. Reload the page and confirm the change persisted. Click "delete" on a different card, confirm it disappears and stays gone after reload.

- [ ] **Step 4: Commit**

```bash
git add src/components/EditChannelPanel.tsx src/app/page.tsx
git commit -m "Add inline edit panel and delete for channels"
```

---

### Task 10: Add-channel modal

**Files:**
- Create: `src/components/AddChannelModal.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `db`, `id` from `@instantdb/react`, `CategoryOption`/`TagOption` shapes from Task 9.
- Produces: a working "Add channel" button in the page header that creates a new `channels` row.

- [ ] **Step 1: Write AddChannelModal**

Write `src/components/AddChannelModal.tsx`:
```tsx
"use client";

import { useState } from "react";

interface CategoryOption {
  id: string;
  name: string;
}
interface TagOption {
  id: string;
  name: string;
}

interface AddChannelModalProps {
  categories: CategoryOption[];
  tags: TagOption[];
  onAdd: (values: { channelId: string; title: string; url: string; category: string | undefined; tags: string[] }) => void;
  onClose: () => void;
}

export function AddChannelModal({ categories, tags, onAdd, onClose }: AddChannelModalProps) {
  const [channelId, setChannelId] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-3">
        <h2 className="font-serif text-xl">Add channel</h2>
        <input
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          placeholder="Channel ID (e.g. UC...)"
          className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL"
          className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
        />
        <select
          value={category ?? ""}
          onChange={(e) => setCategory(e.target.value || undefined)}
          className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
        >
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((t) => (
            <span key={t} className="flex items-center gap-1 rounded-full bg-[var(--surface-active)] px-2 py-0.5 text-[11px]">
              {t}
              <button onClick={() => setSelectedTags((prev) => prev.filter((x) => x !== t))}>&times;</button>
            </span>
          ))}
        </div>
        <input
          list="add-tag-vocabulary"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const trimmed = tagInput.trim();
              if (trimmed && !selectedTags.includes(trimmed)) setSelectedTags((prev) => [...prev, trimmed]);
              setTagInput("");
            }
          }}
          placeholder="Add tag and press Enter"
          className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
        />
        <datalist id="add-tag-vocabulary">
          {tags.map((t) => (
            <option key={t.id} value={t.name} />
          ))}
        </datalist>

        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="text-xs font-mono text-[var(--text-dim)] px-3 py-1.5">
            cancel
          </button>
          <button
            disabled={!channelId || !title || !url}
            onClick={() => onAdd({ channelId, title, url, category, tags: selectedTags })}
            className="text-xs font-mono text-[var(--accent)] px-3 py-1.5 border border-[var(--accent-line)] rounded disabled:opacity-40"
          >
            add
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into page.tsx**

In `src/app/page.tsx`:
1. Import: `import { AddChannelModal } from "@/components/AddChannelModal";`
2. Add state: `const [showAddModal, setShowAddModal] = useState(false);`
3. Add a handler:
```tsx
  async function handleAddChannel(values: {
    channelId: string;
    title: string;
    url: string;
    category: string | undefined;
    tags: string[];
  }) {
    const txSteps = [];
    const newId = id();
    let step = db.tx.channels[newId].update({
      channelId: values.channelId,
      title: values.title,
      url: values.url,
      createdAt: Date.now(),
    });

    if (values.category) {
      const existing = data?.categories.find((c) => c.name === values.category);
      const categoryId = existing?.id ?? id();
      if (!existing) txSteps.push(db.tx.categories[categoryId].update({ name: values.category, color: "" }));
      step = step.link({ category: categoryId });
    }

    const tagIds: string[] = [];
    for (const tagName of values.tags) {
      const existing = data?.tags.find((t) => t.name === tagName);
      const tagId = existing?.id ?? id();
      if (!existing) txSteps.push(db.tx.tags[tagId].update({ name: tagName }));
      tagIds.push(tagId);
    }
    if (tagIds.length > 0) step = step.link({ tags: tagIds });

    txSteps.push(step);
    await db.transact(txSteps);
    setShowAddModal(false);
  }
```
4. Add a button in the header area (inside the `py-14 border-b ...` div, after the `StatsBar`):
```tsx
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-6 text-xs font-mono text-[var(--accent)] border border-[var(--accent-line)] rounded px-3 py-1.5"
        >
          + add channel
        </button>
```
5. Render the modal conditionally right before the closing `</main>`:
```tsx
      {showAddModal && (
        <AddChannelModal
          categories={data?.categories ?? []}
          tags={data?.tags ?? []}
          onAdd={handleAddChannel}
          onClose={() => setShowAddModal(false)}
        />
      )}
```

- [ ] **Step 3: Verify in the browser**

Run `npm run dev`. Click "+ add channel", fill in a test channel ID/title/URL, pick a category, add a tag, submit. Confirm the new card appears in the grid and the stats bar total increments. Reload and confirm it persisted. Delete it afterward via the card's delete button to clean up test data.

- [ ] **Step 4: Commit**

```bash
git add src/components/AddChannelModal.tsx src/app/page.tsx
git commit -m "Add create-channel modal"
```

---

### Task 11: Manage categories and tags (rename/delete)

**Files:**
- Create: `src/components/ManageTaxonomyModal.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `db`, raw `data.categories` / `data.tags` (Task 6's query already fetches these at the top level).
- Produces: a "manage categories & tags" entry point that can rename or delete any category/tag, with categories falling back to Uncategorized (link removed, channels not deleted) per spec.

- [ ] **Step 1: Write ManageTaxonomyModal**

Write `src/components/ManageTaxonomyModal.tsx`:
```tsx
"use client";

import { useState } from "react";

interface TaxonomyItem {
  id: string;
  name: string;
}

interface ManageTaxonomyModalProps {
  categories: TaxonomyItem[];
  tags: TaxonomyItem[];
  onRenameCategory: (id: string, newName: string) => void;
  onDeleteCategory: (id: string) => void;
  onRenameTag: (id: string, newName: string) => void;
  onDeleteTag: (id: string) => void;
  onClose: () => void;
}

function TaxonomyRow({
  item,
  onRename,
  onDelete,
}: {
  item: TaxonomyItem;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(item.name);
  return (
    <div className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-sm"
      />
      <button
        onClick={() => onRename(item.id, name)}
        disabled={name.trim() === item.name || !name.trim()}
        className="text-xs font-mono text-[var(--accent)] px-2 py-1 disabled:opacity-30"
      >
        rename
      </button>
      <button
        onClick={() => {
          if (confirm(`Delete "${item.name}"?`)) onDelete(item.id);
        }}
        className="text-xs font-mono text-[var(--text-faint)] hover:text-red-400 px-2 py-1"
      >
        delete
      </button>
    </div>
  );
}

export function ManageTaxonomyModal({
  categories,
  tags,
  onRenameCategory,
  onDeleteCategory,
  onRenameTag,
  onDeleteTag,
  onClose,
}: ManageTaxonomyModalProps) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">Manage categories & tags</h2>
          <button onClick={onClose} className="text-xs font-mono text-[var(--text-dim)]">
            close
          </button>
        </div>

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-mono uppercase text-[var(--text-faint)]">Categories</h3>
          {categories.map((c) => (
            <TaxonomyRow key={c.id} item={c} onRename={onRenameCategory} onDelete={onDeleteCategory} />
          ))}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-mono uppercase text-[var(--text-faint)]">Tags</h3>
          {tags.map((t) => (
            <TaxonomyRow key={t.id} item={t} onRename={onRenameTag} onDelete={onDeleteTag} />
          ))}
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into page.tsx**

In `src/app/page.tsx`:
1. Import: `import { ManageTaxonomyModal } from "@/components/ManageTaxonomyModal";`
2. Add state: `const [showManageModal, setShowManageModal] = useState(false);`
3. Add handlers:
```tsx
  function handleRenameCategory(categoryId: string, newName: string) {
    db.transact(db.tx.categories[categoryId].update({ name: newName }));
  }

  function handleDeleteCategory(categoryId: string) {
    db.transact(db.tx.categories[categoryId].delete());
  }

  function handleRenameTag(tagId: string, newName: string) {
    db.transact(db.tx.tags[tagId].update({ name: newName }));
  }

  function handleDeleteTag(tagId: string) {
    db.transact(db.tx.tags[tagId].delete());
  }
```
Note: deleting a `categories` or `tags` entity in InstantDB automatically removes the link on any `channels` that referenced it — no manual unlink of affected channels is required, matching the spec's "falls back to Uncategorized" behavior.

4. Add a button next to "+ add channel" in the header:
```tsx
        <button
          onClick={() => setShowManageModal(true)}
          className="mt-6 ml-2 text-xs font-mono text-[var(--text-dim)] border border-[var(--border)] rounded px-3 py-1.5"
        >
          manage categories & tags
        </button>
```
(wrap both buttons in a `<div className="flex gap-2">` if they were previously siblings without a wrapper — adjust JSX so the two buttons sit side by side)

5. Render the modal near the `AddChannelModal` render block:
```tsx
      {showManageModal && (
        <ManageTaxonomyModal
          categories={data?.categories ?? []}
          tags={data?.tags ?? []}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
          onRenameTag={handleRenameTag}
          onDeleteTag={handleDeleteTag}
          onClose={() => setShowManageModal(false)}
        />
      )}
```

- [ ] **Step 3: Verify in the browser**

Run `npm run dev`. Open "manage categories & tags". Rename a category (e.g. "Music" → "Music & Audio"), close the modal, confirm all previously-"Music" cards now show the new name and the category filter chip updated. Reopen, delete a low-use tag, confirm channels that had it no longer show it and the tag chip disappears from the filter bar. Test deleting a category: pick one with a couple of channels, delete it, confirm those channels now show "Uncategorized" and are still present (not deleted) and the uncategorized count in the stats bar increased accordingly.

- [ ] **Step 4: Commit**

```bash
git add src/components/ManageTaxonomyModal.tsx src/app/page.tsx
git commit -m "Add category/tag rename and delete management"
```

---

## Self-Review Notes

- **Spec coverage:** browsing/search/sort (Task 7), category+tag filter with AND/OR (Task 7), stats bar (Task 6), cards linking out (Task 8), inline edit of title/url/category/tags (Task 9), delete channel (Task 9), add channel (Task 10), rename/delete category with fallback-to-Uncategorized (Task 11), rename/delete tag (Task 11), seed script (Task 5), schema with normalized category/tags links (Task 2) — all spec sections have a task.
- **Type consistency:** `ChannelView` (Task 4) is used identically in Tasks 6-9; `CategoryOption`/`TagOption` shape (`{id, name}`) is reused verbatim across Tasks 9-11 rather than redefined incompatibly.
- **No placeholders:** all steps contain real, complete code; the one initially-wrong `unlink` snippet in Task 9 is explicitly corrected within the same task rather than left as a TODO.
