"use client";

import { useState } from "react";
import { CategorySelect } from "@/components/CategorySelect";
import { TagPicker } from "@/components/TagPicker";
import { deriveChannelId } from "@/lib/deriveChannelId";

interface CategoryOption {
  id: string;
  name: string;
}
interface TagOption {
  id: string;
  name: string;
}

interface AddChannelModalProps {
  categories: CategoryOption[];
  tags: TagOption[];
  onAdd: (values: { channelId: string; title: string; url: string; category: string | undefined; tags: string[] }) => void;
  onClose: () => void;
  onRenameTag: (id: string, newName: string) => void;
  onDeleteTag: (id: string) => void;
}

export function AddChannelModal({ categories, tags, onAdd, onClose, onRenameTag, onDeleteTag }: AddChannelModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  function toggleTag(name: string) {
    setSelectedTags((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-3">
        <h2 className="font-serif text-xl">Add channel</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL"
          className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
        />
        <CategorySelect value={category} categories={categories} onChange={setCategory} />
        <TagPicker
          allTags={tags}
          selectedTags={selectedTags}
          onToggle={toggleTag}
          onRenameTag={onRenameTag}
          onDeleteTag={onDeleteTag}
        />

        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="text-xs font-mono text-[var(--text-dim)] px-3 py-1.5">
            cancel
          </button>
          <button
            disabled={!title || !url}
            onClick={() => onAdd({ channelId: deriveChannelId(url), title, url, category, tags: selectedTags })}
            className="text-xs font-mono text-[var(--accent)] px-3 py-1.5 border border-[var(--accent-line)] rounded disabled:opacity-40"
          >
            add
          </button>
        </div>
      </div>
    </div>
  );
}
