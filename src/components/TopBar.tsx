import { Plus, Star } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";

export type ViewMode = "all" | "starred";

interface TopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAddChannel: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function TopBar({ search, onSearchChange, onAddChannel, viewMode, onViewModeChange }: TopBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-soft)] shrink-0">
      <div className="flex items-center rounded border border-[var(--border)] overflow-hidden shrink-0">
        <button
          onClick={() => onViewModeChange("all")}
          className={`px-3 py-2.5 text-sm font-mono ${
            viewMode === "all"
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "bg-[var(--surface)] text-[var(--text-dim)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          all
        </button>
        <button
          onClick={() => onViewModeChange("starred")}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-mono border-l border-[var(--border)] ${
            viewMode === "starred"
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "bg-[var(--surface)] text-[var(--text-dim)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <Star size={13} strokeWidth={2} fill={viewMode === "starred" ? "currentColor" : "none"} />
          starred
        </button>
      </div>
      <div className="flex-1">
        <SearchBar value={search} onChange={onSearchChange} />
      </div>
      <button
        onClick={onAddChannel}
        className="flex items-center gap-1.5 text-sm font-mono text-[var(--accent)] border border-[var(--accent-line)] rounded px-4 py-2.5 shrink-0"
      >
        <Plus size={14} strokeWidth={2.5} />
        add channel
      </button>
    </div>
  );
}
