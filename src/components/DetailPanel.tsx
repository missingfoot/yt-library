"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
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
  onClose: () => void;
}

export function DetailPanel({ channel, categories, tags, onSave, onDelete, onClose }: DetailPanelProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-[19px] border-b border-[var(--border-soft)] sticky top-0 z-10 bg-[var(--bg)] shrink-0">
        <h2 className="font-serif text-lg">Edit channel</h2>
        <button onClick={onClose} title="Close" className="text-[var(--text-dim)] hover:text-[var(--text)]">
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

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
