"use client";

import { useMemo, useState } from "react";
import { db } from "@/lib/db";
import { filterChannels, type ChannelView } from "@/lib/filterChannels";
import { catColor } from "@/lib/categoryColors";
import { StatsBar } from "@/components/StatsBar";
import { SearchBar } from "@/components/SearchBar";
import { FilterChips, type ChipItem } from "@/components/FilterChips";
import { ChannelCard } from "@/components/ChannelCard";
import { EditChannelPanel } from "@/components/EditChannelPanel";
import { AddChannelModal } from "@/components/AddChannelModal";
import { id } from "@instantdb/react";

export default function Home() {
  const { isLoading, error, data } = db.useQuery({
    channels: { category: {}, tags: {} },
    categories: {},
    tags: {},
  });

  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [tagMode, setTagMode] = useState<"and" | "or">("and");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

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
    const channelBefore = data?.channels.find((c) => c.id === channelId);
    const oldTagIds = (channelBefore?.tags ?? []).map((t) => t.id);
    const removedTagIds = oldTagIds.filter((tid) => !tagIds.includes(tid));
    if (removedTagIds.length > 0) step = step.unlink({ tags: removedTagIds });
    if (tagIds.length > 0) step = step.link({ tags: tagIds });

    txSteps.push(step);
    await db.transact(txSteps);
    setEditingId(null);
  }

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
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-6 text-xs font-mono text-[var(--accent)] border border-[var(--accent-line)] rounded px-3 py-1.5"
        >
          + add channel
        </button>
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

      <div className="py-6 text-xs font-mono text-[var(--text-faint)]">
        {visible.length} channel{visible.length === 1 ? "" : "s"}
      </div>

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

      {showAddModal && (
        <AddChannelModal
          categories={data?.categories ?? []}
          tags={data?.tags ?? []}
          onAdd={handleAddChannel}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </main>
  );
}
