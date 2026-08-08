import { StatsBar } from "@/components/StatsBar";
import { SearchBar } from "@/components/SearchBar";
import { FilterChips, type ChipItem } from "@/components/FilterChips";

interface SidebarProps {
  total: number;
  categoryCount: number;
  uncategorizedCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  categoryChips: ChipItem[];
  selectedCategories: Set<string>;
  onToggleCategory: (key: string) => void;
  tagChips: ChipItem[];
  selectedTags: Set<string>;
  onToggleTag: (key: string) => void;
  tagMode: "and" | "or";
  onToggleTagMode: () => void;
  onAddChannel: () => void;
  onManageTaxonomy: () => void;
}

export function Sidebar({
  total,
  categoryCount,
  uncategorizedCount,
  search,
  onSearchChange,
  categoryChips,
  selectedCategories,
  onToggleCategory,
  tagChips,
  selectedTags,
  onToggleTag,
  tagMode,
  onToggleTagMode,
  onAddChannel,
  onManageTaxonomy,
}: SidebarProps) {
  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto p-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold mb-1">Channel Library</h1>
        <p className="text-[var(--text-dim)] text-sm">Search, filter, and tag your subscriptions.</p>
      </div>

      <StatsBar total={total} categoryCount={categoryCount} uncategorizedCount={uncategorizedCount} />

      <div className="flex gap-2">
        <button
          onClick={onAddChannel}
          className="flex-1 text-xs font-mono text-[var(--accent)] border border-[var(--accent-line)] rounded px-3 py-1.5"
        >
          + add channel
        </button>
        <button
          onClick={onManageTaxonomy}
          className="flex-1 text-xs font-mono text-[var(--text-dim)] border border-[var(--border)] rounded px-3 py-1.5"
        >
          manage tags
        </button>
      </div>

      <SearchBar value={search} onChange={onSearchChange} />

      <div className="flex flex-col gap-2">
        <h3 className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">Categories</h3>
        <FilterChips items={categoryChips} selected={selectedCategories} onToggle={onToggleCategory} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">Tags</h3>
          {selectedTags.size > 1 && (
            <button
              onClick={onToggleTagMode}
              className="text-[10.5px] font-mono text-[var(--accent)] uppercase"
            >
              match: {tagMode}
            </button>
          )}
        </div>
        <FilterChips items={tagChips} selected={selectedTags} onToggle={onToggleTag} />
      </div>
    </div>
  );
}
