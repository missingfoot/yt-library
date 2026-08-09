"use client";

import { useMemo, useState } from "react";
import { db } from "@/lib/db";
import { filterChannels, type ChannelView } from "@/lib/filterChannels";
import { catColor } from "@/lib/categoryColors";
import { defaultIconKeyForName, resolveIcon } from "@/lib/categoryIcons";
import { Sidebar } from "@/components/Sidebar";
import { TopBar, type ViewMode } from "@/components/TopBar";
import { ChannelRow } from "@/components/ChannelRow";
import { DetailPanel } from "@/components/DetailPanel";
import { AddChannelModal } from "@/components/AddChannelModal";
import { MergeTagsModal } from "@/components/MergeTagsModal";
import { type ChipItem } from "@/components/FilterChips";
import { AuthModal } from "@/components/AuthModal";
import { id } from "@instantdb/react";
import { useDragScroll } from "@/lib/useDragScroll";

export default function Home() {
  const { isLoading, error, data } = db.useQuery({
    channels: { category: {}, tags: {}, avatarFile: {} },
    categories: {},
    tags: { channels: {} },
  });
  const { user } = db.useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  function requireAuth(): boolean {
    if (!user) {
      setShowSignIn(true);
      return false;
    }
    return true;
  }

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [categoryMode, setCategoryMode] = useState<"additive" | "toggle">("additive");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [tagMode, setTagMode] = useState<"and" | "or">("and");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [mergeSourceTagId, setMergeSourceTagId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dragScroll = useDragScroll<HTMLDivElement>();

  const channels: ChannelView[] = useMemo(() => {
    if (!data) return [];
    return data.channels.map((c) => ({
      id: c.id,
      title: c.title,
      url: c.url,
      category: c.category?.name,
      tags: c.tags.map((t) => t.name),
      avatarUrl: c.avatarFile?.url,
      isFavorite: c.isFavorite ?? false,
      categoryColor: c.category?.color,
      categoryIcon: c.category?.icon,
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
        const entity = categoryName ? data?.categories.find((c) => c.name === categoryName) : undefined;
        return {
          key,
          label: key,
          count,
          color: entity?.color || catColor(categoryName),
          icon: resolveIcon(entity?.icon),
          entityId: entity?.id,
        };
      });
  }, [channels, data?.categories]);

  const tagChips: ChipItem[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of channels) {
      for (const t of c.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ key, label: key, count, entityId: data?.tags.find((t) => t.name === key)?.id }));
  }, [channels, data?.tags]);

  function toggleCategory(key: string) {
    setSelectedCategories((prev) => {
      if (categoryMode === "toggle") {
        return prev.has(key) ? new Set() : new Set([key]);
      }
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    setSelectedId(null);
  }

  function toggleTag(key: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    setSelectedId(null);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setSelectedId(null);
  }

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode);
    setSelectedId(null);
  }

  function handleToggleTagMode() {
    setTagMode((m) => (m === "and" ? "or" : "and"));
    setSelectedId(null);
  }

  function handleClearCategories() {
    setSelectedCategories(new Set());
    setSelectedId(null);
  }

  function handleToggleCategoryMode() {
    setCategoryMode((m) => {
      const next = m === "additive" ? "toggle" : "additive";
      if (next === "toggle" && selectedCategories.size > 1) {
        setSelectedCategories(new Set([[...selectedCategories][0]]));
      }
      return next;
    });
    setSelectedId(null);
  }

  function handleClearTags() {
    setSelectedTags(new Set());
    setSelectedId(null);
  }

  const visible = useMemo(() => {
    const base = viewMode === "starred" ? channels.filter((c) => c.isFavorite) : channels;
    return filterChannels(base, {
      search,
      categories: selectedCategories,
      tags: selectedTags,
      tagMode,
      sort: "name",
    });
  }, [channels, search, selectedCategories, selectedTags, tagMode, viewMode]);

  const selectedChannel = channels.find((c) => c.id === selectedId) ?? null;

  function handleToggleFavorite(channelId: string, current: boolean) {
    if (!requireAuth()) return;
    db.transact(db.tx.channels[channelId].update({ isFavorite: !current }));
  }

  async function handleFetchAvatar(channelId: string, url: string) {
    if (!requireAuth()) return;
    const res = await fetch(`/api/avatar?channelId=${encodeURIComponent(channelId)}&url=${encodeURIComponent(url)}`, {
      headers: { Authorization: `Bearer ${user!.refresh_token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "Failed to fetch avatar");
    }
  }

  async function handleClearAvatar(channelId: string) {
    if (!requireAuth()) return;
    await fetch(`/api/avatar?channelId=${encodeURIComponent(channelId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user!.refresh_token}` },
    });
  }

  async function handleFetchChannelTags(url: string): Promise<string[]> {
    const res = await fetch(`/api/channel-tags?url=${encodeURIComponent(url)}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status !== 404) alert(body.error ?? "Failed to fetch channel tags");
      return [];
    }
    const { tags: fetchedTags } = await res.json();
    return fetchedTags;
  }

  function handleDelete(channelId: string) {
    if (!requireAuth()) return;
    if (!confirm("Delete this channel?")) return;
    db.transact(db.tx.channels[channelId].delete());
    setSelectedId(null);
  }

  async function handleSaveEdit(
    channelId: string,
    updates: { title: string; url: string; category: string | undefined; tags: string[] }
  ) {
    if (!requireAuth()) return;
    const txSteps = [];
    let step = db.tx.channels[channelId].update({ title: updates.title, url: updates.url });

    if (updates.category) {
      const existing = data?.categories.find((c) => c.name === updates.category);
      const categoryId = existing?.id ?? id();
      if (!existing) {
        txSteps.push(
          db.tx.categories[categoryId].update({
            name: updates.category,
            color: catColor(updates.category),
            icon: defaultIconKeyForName(updates.category),
          })
        );
      }
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
    if (!requireAuth()) return;
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
      if (!existing) {
        txSteps.push(
          db.tx.categories[categoryId].update({
            name: values.category,
            color: catColor(values.category),
            icon: defaultIconKeyForName(values.category),
          })
        );
      }
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
    if (!requireAuth()) return;
    db.transact(db.tx.categories[categoryId].update({ name: newName }));
  }

  function handleDeleteCategory(categoryId: string) {
    if (!requireAuth()) return;
    db.transact(db.tx.categories[categoryId].delete());
  }

  function handleRenameTag(tagId: string, newName: string) {
    if (!requireAuth()) return;
    const trimmedName = newName.trim();
    const existingMatch = data?.tags.find(
      (t) => t.name.toLowerCase() === trimmedName.toLowerCase() && t.id !== tagId,
    );
    if (existingMatch) {
      handleMergeTags([tagId, existingMatch.id], trimmedName);
      return;
    }
    db.transact(db.tx.tags[tagId].update({ name: trimmedName }));
  }

  function handleDeleteTag(tagId: string) {
    if (!requireAuth()) return;
    db.transact(db.tx.tags[tagId].delete());
  }

  async function handleMergeTags(tagIds: string[], finalName: string) {
    if (!requireAuth()) return;
    if (tagIds.length < 2 || !finalName.trim()) return;
    const trimmedName = finalName.trim();

    const existingMatch = data?.tags.find(
      (t) => t.name.toLowerCase() === trimmedName.toLowerCase() && !tagIds.includes(t.id),
    );

    const survivorId = existingMatch?.id ?? tagIds[0];
    const obsoleteIds = existingMatch
      ? tagIds
      : tagIds.slice(1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txSteps: any[] = [];
    if (!existingMatch) {
      txSteps.push(db.tx.tags[survivorId].update({ name: trimmedName }));
    }

    for (const obsoleteId of obsoleteIds) {
      const tagRecord = data?.tags.find((t) => t.id === obsoleteId);
      for (const ch of tagRecord?.channels ?? []) {
        txSteps.push(db.tx.channels[ch.id].link({ tags: [survivorId] }));
      }
    }
    for (const obsoleteId of obsoleteIds) {
      txSteps.push(db.tx.tags[obsoleteId].delete());
    }

    await db.transact(txSteps);
    setMergeSourceTagId(null);
  }

  if (isLoading) return <div className="p-10 text-[var(--text-dim)]">Loading...</div>;
  if (error) return <div className="p-10 text-red-400">Error: {error.message}</div>;

  return (
    <div className="h-screen flex overflow-hidden relative">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 min-[1440px]:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 max-[479px]:w-full min-[480px]:max-[619px]:w-3/4 min-[620px]:max-[959px]:w-2/3 min-[960px]:max-[1439px]:w-1/2 border-r border-[var(--border-soft)] bg-[var(--bg)] h-full transition-transform duration-200
          min-[1440px]:static min-[1440px]:z-auto min-[1440px]:w-auto min-[1440px]:flex-[3] min-[1440px]:translate-x-0 min-[1440px]:transition-none min-[1440px]:min-w-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          categoryChips={categoryChips}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
          onClearCategories={handleClearCategories}
          categoryMode={categoryMode}
          onToggleCategoryMode={handleToggleCategoryMode}
          tagChips={tagChips}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          onClearTags={handleClearTags}
          tagMode={tagMode}
          onToggleTagMode={handleToggleTagMode}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
          onRenameTag={handleRenameTag}
          onDeleteTag={handleDeleteTag}
          onMergeTagRequest={(id: string) => requireAuth() && setMergeSourceTagId(id)}
        />
      </aside>

      <main className="flex-[7] min-w-0 h-full flex flex-col">
        <div className="sticky top-0 z-10 bg-[var(--bg)]">
          <TopBar
            onOpenSidebar={() => setSidebarOpen(true)}
            search={search}
            onSearchChange={handleSearchChange}
            onAddChannel={() => requireAuth() && setShowAddModal(true)}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />
          <div className="px-4 py-2 text-xs font-mono text-[var(--text-faint)] border-b border-[var(--border-soft)]">
            {visible.length} channel{visible.length === 1 ? "" : "s"}
          </div>
        </div>
        <div
          ref={dragScroll.ref}
          onMouseDown={dragScroll.onMouseDown}
          onMouseMove={dragScroll.onMouseMove}
          onMouseUp={dragScroll.onMouseUp}
          onMouseLeave={dragScroll.onMouseLeave}
          onClickCapture={dragScroll.onClickCapture}
          className="flex-1 overflow-y-auto overflow-x-auto select-none cursor-grab active:cursor-grabbing"
        >
          <div className="w-max min-w-full">
            {visible.map((channel) => (
              <ChannelRow
                key={channel.id}
                channel={channel}
                isSelected={channel.id === selectedId}
                onSelect={() => setSelectedId(channel.id)}
                onToggleFavorite={() => handleToggleFavorite(channel.id, channel.isFavorite)}
              />
            ))}
          </div>
        </div>
      </main>

      {selectedChannel && (
        <div
          className="fixed inset-0 z-30 bg-black/50 min-[1280px]:hidden"
          onClick={() => setSelectedId(null)}
        />
      )}
      <aside
        className={`fixed inset-y-0 right-0 z-40 max-[479px]:w-full min-[480px]:max-[619px]:w-3/4 min-[620px]:max-[959px]:w-2/3 min-[960px]:max-[1279px]:w-1/2 border-l border-[var(--border-soft)] bg-[var(--bg)] h-full transition-transform duration-200
          min-[1280px]:static min-[1280px]:z-auto min-[1280px]:w-auto min-[1280px]:flex-[3] min-[1280px]:translate-x-0 min-[1280px]:transition-none min-[1280px]:min-w-0
          ${selectedChannel ? "translate-x-0" : "translate-x-full"}`}
      >
        <DetailPanel
          onClose={() => setSelectedId(null)}
          channel={selectedChannel}
          categories={data?.categories ?? []}
          tags={data?.tags ?? []}
          tagCounts={tagChips}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
          onFetchAvatar={handleFetchAvatar}
          onClearAvatar={handleClearAvatar}
          onFetchChannelTags={handleFetchChannelTags}
          onRenameTag={handleRenameTag}
          onDeleteTag={handleDeleteTag}
          onMergeTagRequest={(id: string) => requireAuth() && setMergeSourceTagId(id)}
        />
      </aside>

      {showAddModal && (
        <AddChannelModal
          categories={data?.categories ?? []}
          tags={data?.tags ?? []}
          onAdd={handleAddChannel}
          onClose={() => setShowAddModal(false)}
          onRenameTag={handleRenameTag}
          onDeleteTag={handleDeleteTag}
          onMergeTagRequest={(id: string) => requireAuth() && setMergeSourceTagId(id)}
        />
      )}

      {mergeSourceTagId && (
        <MergeTagsModal
          sourceTagId={mergeSourceTagId}
          allTags={data?.tags ?? []}
          onMerge={handleMergeTags}
          onClose={() => setMergeSourceTagId(null)}
        />
      )}

      {showSignIn && <AuthModal onClose={() => setShowSignIn(false)} />}
    </div>
  );
}
