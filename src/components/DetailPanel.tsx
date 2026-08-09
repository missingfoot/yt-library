"use client";

import { useEffect, useState } from "react";
import { X, ImageDown, RefreshCw } from "lucide-react";
import { CategorySelect } from "@/components/CategorySelect";
import { TagPicker } from "@/components/TagPicker";
import type { ChannelView } from "@/lib/filterChannels";

interface CategoryOption {
  id: string;
  name: string;
}
interface TagOption {
  id: string;
  name: string;
}

interface DetailPanelProps {
  channel: ChannelView | null;
  categories: CategoryOption[];
  tags: TagOption[];
  onSave: (channelId: string, updates: { title: string; url: string; category: string | undefined; tags: string[] }) => void;
  onDelete: (channelId: string) => void;
  onFetchAvatar: (channelId: string, url: string) => Promise<void>;
  onClose: () => void;
}

export function DetailPanel({ channel, categories, tags, onSave, onDelete, onFetchAvatar, onClose }: DetailPanelProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    if (channel) {
      setTitle(channel.title);
      setUrl(channel.url);
      setCategory(channel.category);
      setSelectedTags(channel.tags);
    }
  }, [channel]);

  if (!channel) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <p className="text-sm text-[var(--text-faint)]">Select a channel from the list to view and edit its details.</p>
      </div>
    );
  }

  function toggleTag(name: string) {
    setSelectedTags((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));
  }

  async function handleFetchAvatar() {
    setAvatarLoading(true);
    try {
      await onFetchAvatar(channel!.id, channel!.url);
    } finally {
      setAvatarLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-[19px] border-b border-[var(--border-soft)] sticky top-0 z-10 bg-[var(--bg)] shrink-0">
        <h2 className="font-serif text-lg">Edit channel</h2>
        <button onClick={onClose} title="Close" className="text-[var(--text-dim)] hover:text-[var(--text)]">
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

      <button
        onClick={handleFetchAvatar}
        disabled={avatarLoading}
        title={channel.avatarUrl ? "Refresh avatar" : "Get avatar"}
        className="group relative h-32 w-32 rounded-lg shrink-0 overflow-hidden disabled:opacity-60"
      >
        {channel.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={channel.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[var(--surface-active)]" />
        )}
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity
            ${avatarLoading ? "opacity-100" : channel.avatarUrl ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
        >
          {channel.avatarUrl ? (
            <RefreshCw size={24} strokeWidth={2} className={`text-white ${avatarLoading ? "animate-spin" : ""}`} />
          ) : (
            <ImageDown size={28} strokeWidth={2} className={`text-[var(--text-dim)] ${avatarLoading ? "animate-spin" : ""}`} />
          )}
        </div>
      </button>

      <label className="flex flex-col gap-1">
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">URL</span>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">Category</span>
        <CategorySelect value={category} categories={categories} onChange={setCategory} />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">Tags</span>
        <TagPicker allTags={tags} selectedTags={selectedTags} onToggle={toggleTag} />
      </div>
      </div>

      <div className="flex gap-2 justify-between px-5 py-4 border-t border-[var(--border-soft)] sticky bottom-0 z-10 bg-[var(--bg)] shrink-0">
        <button
          onClick={() => onDelete(channel.id)}
          className="text-xs font-mono text-[var(--text-faint)] hover:text-red-400 px-3 py-1.5"
        >
          delete channel
        </button>
        <button
          onClick={() => onSave(channel.id, { title, url, category, tags: selectedTags })}
          className="text-xs font-mono text-[var(--accent)] px-3 py-1.5 border border-[var(--accent-line)] rounded"
        >
          save
        </button>
      </div>
    </div>
  );
}
