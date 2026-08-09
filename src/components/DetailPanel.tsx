"use client";

import { useEffect, useRef, useState } from "react";
import { ImageDown, Loader2, RefreshCw, Trash2, Wand2, X } from "lucide-react";
import { CategorySelect, type CategoryOption } from "@/components/CategorySelect";
import { TagPicker } from "@/components/TagPicker";
import type { ChipItem } from "@/components/FilterChips";
import type { ChannelView } from "@/lib/filterChannels";

interface TagOption {
  id: string;
  name: string;
}

interface DetailPanelProps {
  onClose: () => void;
  channel: ChannelView | null;
  categories: CategoryOption[];
  tags: TagOption[];
  tagCounts: ChipItem[];
  onSave: (channelId: string, updates: { title: string; url: string; category: string | undefined; tags: string[] }) => void;
  onDelete: (channelId: string) => void;
  onFetchAvatar: (channelId: string, url: string) => Promise<void>;
  onClearAvatar: (channelId: string) => Promise<void>;
  onFetchChannelTags: (url: string) => Promise<string[]>;
  onRenameTag: (id: string, newName: string) => void;
  onDeleteTag: (id: string) => void;
  onMergeTagRequest: (id: string) => void;
}

export function DetailPanel({ onClose, channel, categories, tags, tagCounts, onSave, onDelete, onFetchAvatar, onClearAvatar, onFetchChannelTags, onRenameTag, onDeleteTag, onMergeTagRequest }: DetailPanelProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const avatarBeforeFetch = useRef<string | undefined>(undefined);
  const [channelTags, setChannelTags] = useState<string[] | null>(null);
  const [channelTagsLoading, setChannelTagsLoading] = useState(false);

  useEffect(() => {
    if (channel) {
      setTitle(channel.title);
      setUrl(channel.url);
      setCategory(channel.category);
      setSelectedTags(channel.tags);
      setAvatarBroken(false);
      setAvatarLoading(false);
      setChannelTags(null);
    }
  }, [channel?.id]);

  useEffect(() => {
    if (!avatarLoading || channel?.avatarUrl === avatarBeforeFetch.current) return;
    if (!channel?.avatarUrl) {
      setAvatarLoading(false);
      return;
    }
    const preload = new Image();
    preload.onload = () => setAvatarLoading(false);
    preload.onerror = () => {
      setAvatarBroken(true);
      setAvatarLoading(false);
    };
    preload.src = channel.avatarUrl;
    return () => {
      preload.onload = null;
      preload.onerror = null;
    };
  }, [channel?.avatarUrl, avatarLoading]);

  if (!channel) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <p className="text-sm text-[var(--text-faint)]">Select a channel from the list to view and edit its details.</p>
      </div>
    );
  }

  function persist(overrides: Partial<{ title: string; url: string; category: string | undefined; tags: string[] }>) {
    onSave(channel!.id, { title, url, category, tags: selectedTags, ...overrides });
  }

  function handleCategoryChange(newCategory: string | undefined) {
    setCategory(newCategory);
    persist({ category: newCategory });
  }

  function toggleTag(name: string) {
    const newTags = selectedTags.includes(name)
      ? selectedTags.filter((x) => x !== name)
      : [...selectedTags, name];
    setSelectedTags(newTags);
    persist({ tags: newTags });
  }

  async function handleFetchAvatar() {
    avatarBeforeFetch.current = channel!.avatarUrl;
    setAvatarLoading(true);
    setAvatarBroken(false);
    try {
      await onFetchAvatar(channel!.id, channel!.url);
    } catch {
      setAvatarLoading(false);
    }
  }

  async function handleFetchChannelTags() {
    setChannelTagsLoading(true);
    try {
      const result = await onFetchChannelTags(channel!.url);
      setChannelTags(result);
    } catch {
      setChannelTags([]);
    } finally {
      setChannelTagsLoading(false);
    }
  }

  async function handleClearAvatar(e: React.MouseEvent) {
    e.stopPropagation();
    avatarBeforeFetch.current = channel!.avatarUrl;
    setAvatarLoading(true);
    try {
      await onClearAvatar(channel!.id);
    } catch {
      setAvatarLoading(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <div className="min-[1280px]:hidden sticky top-0 z-10 flex items-center justify-between bg-[var(--bg)] p-3 border-b border-[var(--border-soft)]">
        <span className="font-serif text-lg font-semibold">Edit channel</span>
        <button
          onClick={onClose}
          title="Close"
          className="rounded p-1.5 text-[var(--text-dim)] hover:bg-[var(--surface-hover)]"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
      <div className="flex flex-col gap-4 p-5">
      <button
        onClick={handleFetchAvatar}
        onContextMenu={(e) => {
          e.preventDefault();
          handleFetchAvatar();
        }}
        disabled={avatarLoading}
        title={channel.avatarUrl ? "Refresh avatar (right-click also refreshes)" : "Get avatar"}
        className="group relative h-32 w-32 rounded-lg shrink-0 overflow-hidden disabled:opacity-60"
      >
        {channel.avatarUrl && !avatarBroken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={channel.avatarUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setAvatarBroken(true)}
          />
        ) : (
          <div className="h-full w-full bg-[var(--surface-active)]" />
        )}
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity
            ${avatarLoading ? "opacity-100" : channel.avatarUrl && !avatarBroken ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
        >
          {avatarLoading ? (
            <RefreshCw size={24} strokeWidth={2} className="text-white animate-spin" />
          ) : channel.avatarUrl && !avatarBroken ? (
            <RefreshCw size={24} strokeWidth={2} className="text-white" />
          ) : (
            <ImageDown size={28} strokeWidth={2} className="text-[var(--text-dim)]" />
          )}
        </div>
        {channel.avatarUrl && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClearAvatar}
            title="Clear avatar"
            className="absolute top-1 right-1 rounded bg-black/60 p-1 opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-opacity"
          >
            <X size={12} strokeWidth={2.5} className="text-white" />
          </span>
        )}
      </button>

      <label className="flex flex-col gap-1">
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={(e) => persist({ title: e.target.value })}
          className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">URL</span>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={(e) => persist({ url: e.target.value })}
          className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">Category</span>
        <CategorySelect value={category} categories={categories} onChange={handleCategoryChange} />
      </div>

      <div className="flex flex-col gap-1">
        <TagPicker
          key={channel.id}
          allTags={tags}
          tagCounts={tagCounts}
          selectedTags={selectedTags}
          onToggle={toggleTag}
          onRenameTag={onRenameTag}
          onDeleteTag={onDeleteTag}
          onMergeTagRequest={onMergeTagRequest}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <button
          onClick={handleFetchChannelTags}
          disabled={channelTagsLoading}
          className="self-start flex items-center gap-1.5 text-xs font-mono text-[var(--text-faint)] hover:text-[var(--text)] px-3 py-1.5 disabled:opacity-60"
        >
          {channelTagsLoading ? (
            <Loader2 size={14} strokeWidth={2} className="animate-spin" />
          ) : (
            <Wand2 size={14} strokeWidth={2} />
          )}
          get channel tags
        </button>

        {channelTags && (
          <>
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)] mt-1">
              Channel tags
            </span>
            {channelTags.length === 0 ? (
              <p className="text-xs text-[var(--text-faint)]">No keywords found for this channel.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {channelTags.map((tag) => {
                  const added = selectedTags.some((t) => t.toLowerCase() === tag.toLowerCase());
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => !added && toggleTag(tag)}
                      disabled={added}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
                        ${added
                          ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent)] cursor-default"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] hover:bg-[var(--surface-hover)]"
                        }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <button
        onClick={() => onDelete(channel.id)}
        className="self-start flex items-center gap-1.5 text-xs font-mono text-[var(--text-faint)] hover:text-red-400 px-3 py-1.5 mt-2"
      >
        <Trash2 size={14} strokeWidth={2} />
        delete channel
      </button>
      </div>
    </div>
  );
}
