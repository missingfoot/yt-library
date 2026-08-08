"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FilterChips, type ChipItem } from "@/components/FilterChips";

interface SidebarProps {
  categoryChips: ChipItem[];
  selectedCategories: Set<string>;
  onToggleCategory: (key: string) => void;
  tagChips: ChipItem[];
  selectedTags: Set<string>;
  onToggleTag: (key: string) => void;
  tagMode: "and" | "or";
  onToggleTagMode: () => void;
  onManageTaxonomy: () => void;
}

function ChipFilterInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search size={12} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-[var(--border)] bg-[var(--surface)] pl-7 pr-2 py-1
                   text-[11px] text-[var(--text)] placeholder:text-[var(--text-faint)]
                   focus:outline-none focus:border-[var(--accent-line)]"
      />
    </div>
  );
}

export function Sidebar({
  categoryChips,
  selectedCategories,
  onToggleCategory,
  tagChips,
  selectedTags,
  onToggleTag,
  tagMode,
  onToggleTagMode,
  onManageTaxonomy,
}: SidebarProps) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const filteredCategoryChips = useMemo(() => {
    const q = categoryFilter.trim().toLowerCase();
    if (!q) return categoryChips;
    return categoryChips.filter((c) => c.label.toLowerCase().includes(q));
  }, [categoryChips, categoryFilter]);

  const filteredTagChips = useMemo(() => {
    const q = tagFilter.trim().toLowerCase();
    if (!q) return tagChips;
    return tagChips.filter((t) => t.label.toLowerCase().includes(q));
  }, [tagChips, tagFilter]);

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto p-5">
      <h1 className="font-serif text-2xl font-semibold">Channel Library</h1>

      <div className="flex flex-col gap-2">
        <h3 className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">Categories</h3>
        <ChipFilterInput value={categoryFilter} onChange={setCategoryFilter} placeholder="Filter categories..." />
        <FilterChips items={filteredCategoryChips} selected={selectedCategories} onToggle={onToggleCategory} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">Tags</h3>
          <div className="flex items-center gap-3">
            {selectedTags.size > 1 && (
              <button
                onClick={onToggleTagMode}
                className="text-[10.5px] font-mono text-[var(--accent)] uppercase"
              >
                match: {tagMode}
              </button>
            )}
            <button
              onClick={onManageTaxonomy}
              className="text-[10.5px] font-mono text-[var(--text-dim)] uppercase underline underline-offset-2 hover:text-[var(--text)]"
            >
              manage tags
            </button>
          </div>
        </div>
        <ChipFilterInput value={tagFilter} onChange={setTagFilter} placeholder="Filter tags..." />
        <FilterChips items={filteredTagChips} selected={selectedTags} onToggle={onToggleTag} />
      </div>
    </div>
  );
}
