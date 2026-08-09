"use client";

import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { ChipContextMenu } from "@/components/ChipContextMenu";
import type { ChipItem } from "@/components/FilterChips";

interface TagOption {
  id: string;
  name: string;
}

type SortMode = "count" | "alpha";

interface TagPickerProps {
  allTags: TagOption[];
  tagCounts?: ChipItem[];
  selectedTags: string[];
  onToggle: (name: string) => void;
  onRenameTag?: (id: string, newName: string) => void;
  onDeleteTag?: (id: string) => void;
  onMergeTagRequest?: (id: string) => void;
}

export function TagPicker({ allTags, tagCounts, selectedTags, onToggle, onRenameTag, onDeleteTag, onMergeTagRequest }: TagPickerProps) {
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [sort, setSortState] = useState<SortMode>(
    () => (typeof window !== "undefined" && window.localStorage.getItem("editTagSort") === "alpha" ? "alpha" : "count")
  );

  function setSort(update: (prev: SortMode) => SortMode) {
    setSortState((prev) => {
      const next = update(prev);
      window.localStorage.setItem("editTagSort", next);
      return next;
    });
  }

  const realTagIds = useMemo(() => new Set(allTags.map((t) => t.id)), [allTags]);
  const canEdit = !!(onRenameTag || onDeleteTag);
  const countByName = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of tagCounts ?? []) m.set(c.label, c.count);
    return m;
  }, [tagCounts]);

  const combined = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of allTags) seen.set(t.name, t.id);
    for (const name of selectedTags) if (!seen.has(name)) seen.set(name, name);
    return [...seen.entries()].map(([name, id]) => ({ id, name }));
  }, [allTags, selectedTags]);

  const sorted = useMemo(() => {
    const list = [...combined];
    if (sort === "alpha") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort((a, b) => (countByName.get(b.name) ?? 0) - (countByName.get(a.name) ?? 0));
    }
    return list;
  }, [combined, sort, countByName]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((t) => t.name.toLowerCase().includes(q));
  }, [sorted, filter]);

  const trimmedFilter = filter.trim();
  const exactMatch = combined.some((t) => t.name.toLowerCase() === trimmedFilter.toLowerCase());

  function addNewTag() {
    if (!trimmedFilter) return;
    onToggle(trimmedFilter);
    setFilter("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!trimmedFilter) return;
      const existing = combined.find((t) => t.name.toLowerCase() === trimmedFilter.toLowerCase());
      onToggle(existing ? existing.name : trimmedFilter);
      setFilter("");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">Tags</span>
        <button
          onClick={() => setSort((m) => (m === "count" ? "alpha" : "count"))}
          className="text-[10.5px] font-mono text-[var(--accent)] uppercase"
        >
          sort: {sort}
        </button>
      </div>
      <div className="relative">
        <Search size={12} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Filter tags..."
          className="w-full rounded border border-[var(--border)] bg-[var(--surface)] pl-7 pr-2 py-1
                     text-[11px] text-[var(--text)] placeholder:text-[var(--text-faint)]
                     focus:outline-none focus:border-[var(--accent-line)]"
        />
      </div>
      {trimmedFilter && !exactMatch && (
        <button
          type="button"
          onClick={addNewTag}
          className="flex items-center gap-1.5 self-start rounded-full border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-medium text-[var(--accent)]"
        >
          <Plus size={12} strokeWidth={2.5} />
          add &quot;{trimmedFilter}&quot;
        </button>
      )}
      <div className="flex flex-wrap gap-2">
        {filtered.map((t) => {
          const isSelected = selectedTags.includes(t.name);
          const isEditing = editingId === t.id;
          const isRealTag = realTagIds.has(t.id);

          if (isEditing) {
            return (
              <input
                key={t.id}
                autoFocus
                defaultValue={t.name}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = e.currentTarget.value.trim();
                    if (val && onRenameTag) onRenameTag(t.id, val);
                    setEditingId(null);
                  } else if (e.key === "Escape") {
                    setEditingId(null);
                  }
                }}
                onBlur={() => setEditingId(null)}
                className="rounded-full border border-[var(--accent-line)] bg-[var(--bg)] px-3 py-1.5 text-xs font-medium text-[var(--text)] focus:outline-none"
                style={{ width: `${Math.max(t.name.length + 4, 8)}ch` }}
              />
            );
          }

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onToggle(t.name)}
              onContextMenu={(e) => {
                if (!canEdit || !isRealTag) return;
                e.preventDefault();
                setMenu({ id: t.id, x: e.clientX, y: e.clientY });
              }}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
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

      {menu && (
        <ChipContextMenu
          x={menu.x}
          y={menu.y}
          onRename={() => {
            setEditingId(menu.id);
            setMenu(null);
          }}
          onMerge={
            onMergeTagRequest
              ? () => {
                  onMergeTagRequest(menu.id);
                  setMenu(null);
                }
              : undefined
          }
          onDelete={() => {
            const t = combined.find((c) => c.id === menu.id);
            if (t && onDeleteTag && confirm(`Delete "${t.name}"?`)) onDeleteTag(menu.id);
            setMenu(null);
          }}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
