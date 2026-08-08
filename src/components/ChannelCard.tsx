import { catColor } from "@/lib/categoryColors";
import type { ChannelView } from "@/lib/filterChannels";

interface ChannelCardProps {
  channel: ChannelView;
  onEdit: () => void;
  onDelete: () => void;
}

export function ChannelCard({ channel, onEdit, onDelete }: ChannelCardProps) {
  const categoryLabel = channel.category ?? "Uncategorized";

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-3 hover:bg-[var(--surface-hover)] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <a
          href={channel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--text)] hover:text-[var(--accent)] leading-snug"
        >
          {channel.title}
        </a>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="text-xs font-mono text-[var(--text-faint)] hover:text-[var(--accent)] px-1.5 py-0.5"
          >
            edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs font-mono text-[var(--text-faint)] hover:text-red-400 px-1.5 py-0.5"
          >
            delete
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-[var(--text-dim)]">
        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: catColor(channel.category) }} />
        {categoryLabel}
      </div>

      {channel.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {channel.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--surface-active)] px-2 py-0.5 text-[11px] text-[var(--text-dim)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
