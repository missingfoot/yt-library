"use client";

import { useMemo, useState } from "react";
import { X, Search, GitMerge } from "lucide-react";

interface TagOption {
  id: string;
  name: string;
}

interface MergeTagsModalProps {
  sourceTagId: string;
  allTags: TagOption[];
  onMerge: (tagIds: string[], finalName: string) => void;
  onClose: () => void;
}

export function MergeTagsModal({ sourceTagId, allTags, onMerge, onClose }: MergeTagsModalProps) {
  const sourceTag = allTags.find((t) => t.id === sourceTagId);
  const [selected, setSelected] = useState<Set<string>>(new Set([sourceTagId]));
  const [finalName, setFinalName] = useState(sourceTag?.name ?? "");
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return allTags;
    return allTags.filter((t) => t.name.toLowerCase().includes(q));
  }, [allTags, filter]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const canMerge = selected.size >= 2 && finalName.trim().length > 0;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg max-h-[80vh] rounded-lg border border-[var(--border)] bg-[var(--surface)] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-soft)] shrink-0">
          <h2 className="font-serif text-xl">Merge tags</h2>
          <button onClick={onClose} title="Close" className="text-[var(--text-dim)] hover:text-[var(--text)]">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4 overflow-y-auto">
          <p className="text-xs text-[var(--text-dim)]">
            Select the tags to merge together, then set the name they should share.
          </p>

          <div className="relative">
            <Search size={13} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter tags..."
              className="w-full rounded border border-[var(--border)] bg-[var(--bg)] pl-8 pr-2 py-1.5
                         text-sm text-[var(--text)] placeholder:text-[var(--text-faint)]
                         focus:outline-none focus:border-[var(--accent-line)]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filtered.map((t) => {
              const isSelected = selected.has(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
                    ${isSelected
                      ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] hover:bg-[var(--surface-hover)]"
                    }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>

          <label className="flex flex-col gap-1 mt-2">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
              Merged tag name
            </span>
            <input
              value={finalName}
              onChange={(e) => setFinalName(e.target.value)}
              className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[var(--border-soft)] shrink-0">
          <button onClick={onClose} className="text-xs font-mono text-[var(--text-dim)] px-3 py-1.5">
            cancel
          </button>
          <button
            disabled={!canMerge}
            onClick={() => onMerge([...selected], finalName.trim())}
            className="flex items-center gap-1.5 text-xs font-mono text-[var(--accent)] px-3 py-1.5 border border-[var(--accent-line)] rounded disabled:opacity-40"
          >
            <GitMerge size={13} strokeWidth={2} />
            merge {selected.size} tags
          </button>
        </div>
      </div>
    </div>
  );
}
