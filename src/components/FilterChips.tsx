import type { LucideIcon } from "lucide-react";

export interface ChipItem {
  key: string;
  label: string;
  count: number;
  color?: string;
  icon?: LucideIcon;
}

interface FilterChipsProps {
  items: ChipItem[];
  selected: Set<string>;
  onToggle: (key: string) => void;
}

export function FilterChips({ items, selected, onToggle }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = selected.has(item.key);
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            onClick={() => onToggle(item.key)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
              ${isActive
                ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] hover:bg-[var(--surface-hover)]"
              }`}
          >
            {Icon ? (
              <Icon size={13} strokeWidth={2} color={item.color} />
            ) : (
              item.color && <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            )}
            {item.label}
            <span className="text-[var(--text-faint)]">{item.count}</span>
          </button>
        );
      })}
    </div>
  );
}
