"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CategorySelect, type CategoryOption } from "@/components/CategorySelect";
import { TagPicker } from "@/components/TagPicker";
import { deriveChannelId } from "@/lib/deriveChannelId";

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
  onMergeTagRequest: (id: string) => void;
}

export function AddChannelModal({ categories, tags, onAdd, onClose, onRenameTag, onDeleteTag, onMergeTagRequest }: AddChannelModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function requestClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  function toggleTag(name: string) {
    setSelectedTags((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));
  }

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/60" onClick={requestClose} />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`fixed z-40 bg-[var(--surface)] border-[var(--border)] flex flex-col overflow-hidden
          max-[1279px]:inset-y-0 max-[1279px]:right-0 max-[479px]:w-full min-[480px]:max-[619px]:w-3/4 min-[620px]:max-[959px]:w-2/3 min-[960px]:max-[1279px]:w-1/2 max-[1279px]:border-l max-[1279px]:rounded-none max-[1279px]:transition-transform max-[1279px]:duration-200
          ${visible ? "max-[1279px]:translate-x-0" : "max-[1279px]:translate-x-full"}
          min-[1280px]:top-1/2 min-[1280px]:left-1/2 min-[1280px]:-translate-x-1/2 min-[1280px]:-translate-y-1/2
          min-[1280px]:w-full min-[1280px]:max-w-md min-[1280px]:max-h-[85vh] min-[1280px]:rounded-lg min-[1280px]:border`}
      >
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-[var(--border-soft)]">
          <h2 className="font-serif text-xl">Add channel</h2>
          <button
            onClick={requestClose}
            title="Close"
            className="rounded p-1.5 text-[var(--text-dim)] hover:bg-[var(--surface-hover)] max-[767px]:p-2"
          >
            <X size={16} strokeWidth={2} className="max-[767px]:size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
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
            onMergeTagRequest={onMergeTagRequest}
          />
        </div>

        <div className="shrink-0 flex gap-2 justify-end p-4 border-t border-[var(--border-soft)]">
          <button onClick={requestClose} className="text-xs font-mono text-[var(--text-dim)] px-3 py-1.5">
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
    </>
  );
}
