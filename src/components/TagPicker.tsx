"use client";

import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";

interface TagOption {
  id: string;
  name: string;
}

interface TagPickerProps {
  allTags: TagOption[];
  selectedTags: string[];
  onToggle: (name: string) => void;
}

export function TagPicker({ allTags, selectedTags, onToggle }: TagPickerProps) {
  const [filter, setFilter] = useState("");

  const combined = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of allTags) seen.set(t.name, t.id);
    for (const name of selectedTags) if (!seen.has(name)) seen.set(name, name);
    return [...seen.entries()].map(([name, id]) => ({ id, name }));
  }, [allTags, selectedTags]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return combined;
    return combined.filter((t) => t.name.toLowerCase().includes(q));
  }, [combined, filter]);

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
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onToggle(t.name)}
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
    </div>
  );
}
