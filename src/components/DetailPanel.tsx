"use client";

import { useEffect, useState } from "react";
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
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (channel) {
      setTitle(channel.title);
      setUrl(channel.url);
      setCategory(channel.category);
      setSelectedTags(channel.tags);
      setTagInput("");
    }
  }, [channel]);

  if (!channel) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <p className="text-sm text-[var(--text-faint)]">Select a channel from the list to view and edit its details.</p>
      </div>
    );
  }

  const tagNames = tags.map((t) => t.name);

  function addTag(name: string) {
    const trimmed = name.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }

  return (
    <div className="h-full overflow-y-auto p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg">Edit channel</h2>
        <button onClick={onClose} className="text-xs font-mono text-[var(--text-dim)]">
          close
        </button>
      </div>

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

      <label className="flex flex-col gap-1">
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">Category</span>
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
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">Tags</span>
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
      </div>

      <div className="flex gap-2 justify-between pt-2 mt-auto border-t border-[var(--border-soft)]">
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
