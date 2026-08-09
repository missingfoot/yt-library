"use client";

import { useMemo, useState } from "react";
import { Search, Delete } from "lucide-react";
import { FilterChips, type ChipItem } from "@/components/FilterChips";

interface SidebarProps {
  categoryChips: ChipItem[];
  selectedCategories: Set<string>;
  onToggleCategory: (key: string) => void;
  onClearCategories: () => void;
  categoryMode: "additive" | "toggle";
  onToggleCategoryMode: () => void;
  tagChips: ChipItem[];
  selectedTags: Set<string>;
  onToggleTag: (key: string) => void;
  onClearTags: () => void;
  tagMode: "and" | "or";
  onToggleTagMode: () => void;
  onRenameCategory: (id: string, newName: string) => void;
  onDeleteCategory: (id: string) => void;
  onRenameTag: (id: string, newName: string) => void;
  onDeleteTag: (id: string) => void;
  onMergeTagRequest: (id: string) => void;
}

type SortMode = "count" | "alpha";

function sortChips(chips: ChipItem[], mode: SortMode): ChipItem[] {
  const sorted = [...chips];
  if (mode === "alpha") {
    sorted.sort((a, b) => a.label.localeCompare(b.label));
  } else {
    sorted.sort((a, b) => b.count - a.count);
  }
  return sorted;
}

function HeaderPipe() {
  return <span className="text-[var(--border)]">|</span>;
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
        className="w-full rounded border border-[var(--border)] bg-[var(--surface)] pl-7 pr-7 py-1
                   text-[11px] text-[var(--text)] placeholder:text-[var(--text-faint)]
                   focus:outline-none focus:border-[var(--accent-line)]"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          title="Clear"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text)]"
        >
          <Delete size={15} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

export function Sidebar({
  categoryChips,
  selectedCategories,
  onToggleCategory,
  onClearCategories,
  categoryMode,
  onToggleCategoryMode,
  tagChips,
  selectedTags,
  onToggleTag,
  onClearTags,
  tagMode,
  onToggleTagMode,
  onRenameCategory,
  onDeleteCategory,
  onRenameTag,
  onDeleteTag,
  onMergeTagRequest,
}: SidebarProps) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [categorySort, setCategorySort] = useState<SortMode>("count");
  const [tagSort, setTagSort] = useState<SortMode>("count");

  const filteredCategoryChips = useMemo(() => {
    const q = categoryFilter.trim().toLowerCase();
    const base = q ? categoryChips.filter((c) => c.label.toLowerCase().includes(q)) : categoryChips;
    return sortChips(base, categorySort);
  }, [categoryChips, categoryFilter, categorySort]);

  const filteredTagChips = useMemo(() => {
    const q = tagFilter.trim().toLowerCase();
    const base = q ? tagChips.filter((t) => t.label.toLowerCase().includes(q)) : tagChips;
    return sortChips(base, tagSort);
  }, [tagChips, tagFilter, tagSort]);

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto p-5">
      <h1 className="font-serif text-2xl font-semibold">Channel Library</h1>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">Categories</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCategorySort((m) => (m === "count" ? "alpha" : "count"))}
              className="text-[10.5px] font-mono text-[var(--accent)] uppercase"
            >
              sort: {categorySort}
            </button>
            <HeaderPipe />
            <button
              onClick={onToggleCategoryMode}
              className="text-[10.5px] font-mono text-[var(--accent)] uppercase"
            >
              match: {categoryMode}
            </button>
            {selectedCategories.size > 0 && (
              <>
                <HeaderPipe />
                <button
                  onClick={onClearCategories}
                  className="text-[10.5px] font-mono text-[var(--accent)] uppercase"
                >
                  clear
                </button>
              </>
            )}
          </div>
        </div>
        <ChipFilterInput value={categoryFilter} onChange={setCategoryFilter} placeholder="Filter categories..." />
        <FilterChips
          items={filteredCategoryChips}
          selected={selectedCategories}
          onToggle={onToggleCategory}
          onRename={onRenameCategory}
          onDelete={onDeleteCategory}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">Tags</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTagSort((m) => (m === "count" ? "alpha" : "count"))}
              className="text-[10.5px] font-mono text-[var(--accent)] uppercase"
            >
              sort: {tagSort}
            </button>
            <HeaderPipe />
            <button
              onClick={onToggleTagMode}
              className="text-[10.5px] font-mono text-[var(--accent)] uppercase"
            >
              match: {tagMode}
            </button>
            {selectedTags.size > 0 && (
              <>
                <HeaderPipe />
                <button
                  onClick={onClearTags}
                  className="text-[10.5px] font-mono text-[var(--accent)] uppercase"
                >
                  clear
                </button>
              </>
            )}
          </div>
        </div>
        <ChipFilterInput value={tagFilter} onChange={setTagFilter} placeholder="Filter tags..." />
        <FilterChips
          items={filteredTagChips}
          selected={selectedTags}
          onToggle={onToggleTag}
          onRename={onRenameTag}
          onDelete={onDeleteTag}
          onMergeRequest={onMergeTagRequest}
        />
      </div>
    </div>
  );
}
