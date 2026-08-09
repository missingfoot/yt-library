import { Menu, Plus, Star } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";

export type ViewMode = "all" | "starred";

interface TopBarProps {
  onOpenSidebar: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  onAddChannel: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function TopBar({ onOpenSidebar, search, onSearchChange, onAddChannel, viewMode, onViewModeChange }: TopBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[var(--border-soft)] shrink-0">
      <button
        onClick={onOpenSidebar}
        title="Open filters"
        className="min-[1440px]:hidden shrink-0 h-10 flex items-center justify-center rounded border border-[var(--border)] px-2.5 text-[var(--text-dim)] hover:bg-[var(--surface-hover)]"
      >
        <Menu size={16} strokeWidth={2} />
      </button>
      <div className="flex items-center h-10 rounded border border-[var(--border)] overflow-hidden shrink-0 max-[679px]:flex-1">
        <button
          onClick={() => onViewModeChange("all")}
          className={`h-full flex items-center justify-center px-3 text-sm leading-4 font-mono max-[679px]:flex-1 ${
            viewMode === "all"
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "bg-[var(--surface)] text-[var(--text-dim)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          all
        </button>
        <button
          onClick={() => onViewModeChange("starred")}
          className={`h-full flex items-center justify-center gap-1.5 px-3 text-sm leading-4 font-mono border-l border-[var(--border)] max-[679px]:flex-1 ${
            viewMode === "starred"
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "bg-[var(--surface)] text-[var(--text-dim)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <Star size={16} strokeWidth={2} fill={viewMode === "starred" ? "currentColor" : "none"} />
          starred
        </button>
      </div>
      <div className="order-last w-full min-[680px]:order-none min-[680px]:w-auto min-[680px]:flex-1">
        <SearchBar value={search} onChange={onSearchChange} />
      </div>
      <button
        onClick={onAddChannel}
        title="Add channel"
        className="h-10 flex items-center justify-center gap-1.5 text-sm leading-4 font-mono text-[var(--accent)] border border-[var(--accent-line)] rounded px-4 shrink-0 max-[679px]:px-2.5"
      >
        <Plus size={16} strokeWidth={2.5} />
        <span className="hidden min-[680px]:inline">add channel</span>
      </button>
    </div>
  );
}
