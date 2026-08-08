import { SearchBar } from "@/components/SearchBar";

interface TopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAddChannel: () => void;
  onManageTaxonomy: () => void;
}

export function TopBar({ search, onSearchChange, onAddChannel, onManageTaxonomy }: TopBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-soft)] shrink-0">
      <button
        onClick={onAddChannel}
        className="text-xs font-mono text-[var(--accent)] border border-[var(--accent-line)] rounded px-3 py-1.5 shrink-0"
      >
        + add channel
      </button>
      <button
        onClick={onManageTaxonomy}
        className="text-xs font-mono text-[var(--text-dim)] border border-[var(--border)] rounded px-3 py-1.5 shrink-0"
      >
        manage tags
      </button>
      <div className="flex-1 max-w-md">
        <SearchBar value={search} onChange={onSearchChange} />
      </div>
    </div>
  );
}
