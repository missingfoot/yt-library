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
