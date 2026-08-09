import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { resolveIcon } from "@/lib/categoryIcons";
import type { ChannelView } from "@/lib/filterChannels";

interface ChannelRowProps {
  channel: ChannelView;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

export function ChannelRow({ channel, isSelected, onSelect, onToggleFavorite }: ChannelRowProps) {
  const [avatarBroken, setAvatarBroken] = useState(false);
  useEffect(() => setAvatarBroken(false), [channel.avatarUrl]);
  const categoryLabel = channel.category ?? "Uncategorized";
  const Icon = resolveIcon(channel.categoryIcon);
  const iconColor = channel.categoryColor || "#5C6274";
  const videosUrl = `${channel.url.replace(/\/+$/, "")}/videos`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onDoubleClick={() => window.open(videosUrl, "_blank", "noopener,noreferrer")}
      onAuxClick={(e) => {
        if (e.button === 1) {
          e.preventDefault();
          window.open(videosUrl, "_blank", "noopener,noreferrer");
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
      className={`group w-max min-w-full flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-soft)] text-left transition-colors cursor-pointer
        ${isSelected ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--surface-hover)]"}`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        title={channel.isFavorite ? "Unfavorite" : "Favorite"}
        className="shrink-0 text-[var(--text-faint)] hover:text-[var(--accent)]"
      >
        <Star
          size={16}
          strokeWidth={2}
          className={channel.isFavorite ? "text-[var(--accent)]" : ""}
          fill={channel.isFavorite ? "currentColor" : "none"}
        />
      </button>
      <Icon size={24} strokeWidth={2} className="shrink-0 ml-3" color={iconColor} />
      {channel.avatarUrl && !avatarBroken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={channel.avatarUrl}
          alt=""
          className="h-6 w-6 rounded object-cover shrink-0 ml-3"
          onError={() => setAvatarBroken(true)}
        />
      ) : (
        <div className="h-6 w-6 rounded border border-[var(--border)] shrink-0 ml-3" />
      )}
      <span
        className={`shrink-0 whitespace-nowrap text-sm font-medium ${isSelected ? "text-[var(--accent)]" : "text-[var(--text)]"}`}
        style={{ minWidth: 240 }}
      >
        {channel.title}
      </span>
      <div className="flex items-center gap-6 shrink-0">
        <span className="text-xs text-[var(--text-dim)] shrink-0 w-40 whitespace-nowrap text-left">{categoryLabel}</span>
        <span className="flex flex-nowrap gap-1.5 shrink-0 text-left">
          {channel.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--surface-active)] px-2 py-0.5 text-[11px] text-[var(--text-dim)] shrink-0 whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
