import { SearchBar } from "@/components/SearchBar";

interface TopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAddChannel: () => void;
}

export function TopBar({ search, onSearchChange, onAddChannel }: TopBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-soft)] shrink-0">
      <div className="flex-1 max-w-md">
        <SearchBar value={search} onChange={onSearchChange} />
      </div>
      <button
        onClick={onAddChannel}
        className="text-xs font-mono text-[var(--accent)] border border-[var(--accent-line)] rounded px-4 py-2.5 shrink-0"
      >
        + add channel
      </button>
    </div>
  );
}
