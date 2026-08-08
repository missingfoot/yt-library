"use client";

import { useMemo, useState } from "react";
import { db } from "@/lib/db";
import { filterChannels, type ChannelView } from "@/lib/filterChannels";
import { catColor } from "@/lib/categoryColors";
import { catIcon } from "@/lib/categoryIcons";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { ChannelRow } from "@/components/ChannelRow";
import { DetailPanel } from "@/components/DetailPanel";
import { AddChannelModal } from "@/components/AddChannelModal";
import { ManageTaxonomyModal } from "@/components/ManageTaxonomyModal";
import { type ChipItem } from "@/components/FilterChips";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

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

  const categoryChips: ChipItem[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of channels) {
      const key = c.category ?? "Uncategorized";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => {
        const categoryName = key === "Uncategorized" ? undefined : key;
        return { key, label: key, count, color: catColor(categoryName), icon: catIcon(categoryName) };
      });
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

  const selectedChannel = channels.find((c) => c.id === selectedId) ?? null;

  function handleDelete(channelId: string) {
    if (!confirm("Delete this channel?")) return;
    db.transact(db.tx.channels[channelId].delete());
    setSelectedId(null);
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

  if (isLoading) return <div className="p-10 text-[var(--text-dim)]">Loading...</div>;
  if (error) return <div className="p-10 text-red-400">Error: {error.message}</div>;

  return (
    <div className="h-screen flex overflow-hidden">
      <aside className="flex-1 min-w-0 border-r border-[var(--border-soft)] h-full">
        <Sidebar
          categoryChips={categoryChips}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
          tagChips={tagChips}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          tagMode={tagMode}
          onToggleTagMode={() => setTagMode((m) => (m === "and" ? "or" : "and"))}
          onManageTaxonomy={() => setShowManageModal(true)}
        />
      </aside>

      <main className="flex-1 min-w-0 h-full flex flex-col">
        <div className="sticky top-0 z-10 bg-[var(--bg)]">
          <TopBar
            search={search}
            onSearchChange={setSearch}
            onAddChannel={() => setShowAddModal(true)}
          />
          <div className="px-4 py-2 text-xs font-mono text-[var(--text-faint)] border-b border-[var(--border-soft)]">
            {visible.length} channel{visible.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {visible.map((channel) => (
            <ChannelRow
              key={channel.id}
              channel={channel}
              isSelected={channel.id === selectedId}
              onSelect={() => setSelectedId(channel.id)}
            />
          ))}
        </div>
      </main>

      <aside className="flex-1 min-w-0 border-l border-[var(--border-soft)] h-full">
        <DetailPanel
          channel={selectedChannel}
          categories={data?.categories ?? []}
          tags={data?.tags ?? []}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
          onClose={() => setSelectedId(null)}
        />
      </aside>

      {showAddModal && (
        <AddChannelModal
          categories={data?.categories ?? []}
          tags={data?.tags ?? []}
          onAdd={handleAddChannel}
          onClose={() => setShowAddModal(false)}
        />
      )}

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
    </div>
  );
}
