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
  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto p-5">
      <h1 className="font-serif text-2xl font-semibold">Channel Library</h1>

      <div className="flex flex-col gap-2">
        <h3 className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">Categories</h3>
        <FilterChips items={categoryChips} selected={selectedCategories} onToggle={onToggleCategory} />
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
        <FilterChips items={tagChips} selected={selectedTags} onToggle={onToggleTag} />
      </div>
    </div>
  );
}
