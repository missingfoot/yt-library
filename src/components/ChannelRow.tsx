import { catColor } from "@/lib/categoryColors";
import type { ChannelView } from "@/lib/filterChannels";

interface ChannelRowProps {
  channel: ChannelView;
  isSelected: boolean;
  onSelect: () => void;
}

export function ChannelRow({ channel, isSelected, onSelect }: ChannelRowProps) {
  const categoryLabel = channel.category ?? "Uncategorized";

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-soft)] text-left transition-colors
        ${isSelected ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--surface-hover)]"}`}
    >
      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: catColor(channel.category) }} />
      <span className={`font-medium truncate ${isSelected ? "text-[var(--accent)]" : "text-[var(--text)]"}`} style={{ minWidth: 180, maxWidth: 280 }}>
        {channel.title}
      </span>
      <span className="text-xs text-[var(--text-dim)] shrink-0 w-44 truncate">{categoryLabel}</span>
      <span className="flex flex-wrap gap-1.5 flex-1 min-w-0">
        {channel.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[var(--surface-active)] px-2 py-0.5 text-[11px] text-[var(--text-dim)] shrink-0"
          >
            {tag}
          </span>
        ))}
      </span>
    </button>
  );
}
