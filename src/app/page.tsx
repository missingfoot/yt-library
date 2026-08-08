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
