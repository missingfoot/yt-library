"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { CategorySelect } from "@/components/CategorySelect";

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
}

export function AddChannelModal({ categories, tags, onAdd, onClose }: AddChannelModalProps) {
  const [channelId, setChannelId] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-3">
        <h2 className="font-serif text-xl">Add channel</h2>
        <input
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          placeholder="Channel ID (e.g. UC...)"
          className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
        />
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
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((t) => (
            <span key={t} className="flex items-center gap-1 rounded-full bg-[var(--surface-active)] px-2 py-0.5 text-[11px]">
              {t}
              <button onClick={() => setSelectedTags((prev) => prev.filter((x) => x !== t))} className="flex items-center">
                <X size={11} strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
        <input
          list="add-tag-vocabulary"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const trimmed = tagInput.trim();
              if (trimmed && !selectedTags.includes(trimmed)) setSelectedTags((prev) => [...prev, trimmed]);
              setTagInput("");
            }
          }}
          placeholder="Add tag and press Enter"
          className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
        />
        <datalist id="add-tag-vocabulary">
          {tags.map((t) => (
            <option key={t.id} value={t.name} />
          ))}
        </datalist>

        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="text-xs font-mono text-[var(--text-dim)] px-3 py-1.5">
            cancel
          </button>
          <button
            disabled={!channelId || !title || !url}
            onClick={() => onAdd({ channelId, title, url, category, tags: selectedTags })}
            className="text-xs font-mono text-[var(--accent)] px-3 py-1.5 border border-[var(--accent-line)] rounded disabled:opacity-40"
          >
            add
          </button>
        </div>
      </div>
    </div>
  );
}
