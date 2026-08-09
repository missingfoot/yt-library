import { init, id, tx } from "@instantdb/admin";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import schema from "../instant.schema";
import { catColor } from "../src/lib/categoryColors";
import { defaultIconKeyForName } from "../src/lib/categoryIcons";

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
    tx.categories[categoryIds.get(name)!].update({ name, color: catColor(name), icon: defaultIconKeyForName(name) })
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
