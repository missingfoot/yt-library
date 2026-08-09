"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ChipContextMenu } from "@/components/ChipContextMenu";

export interface ChipItem {
  key: string;
  label: string;
  count: number;
  color?: string;
  icon?: LucideIcon;
  entityId?: string;
}

interface FilterChipsProps {
  items: ChipItem[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onRename?: (entityId: string, newName: string) => void;
  onDelete?: (entityId: string) => void;
  onMergeRequest?: (entityId: string) => void;
}

export function FilterChips({ items, selected, onToggle, onRename, onDelete, onMergeRequest }: FilterChipsProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ key: string; x: number; y: number } | null>(null);

  const canEdit = !!(onRename || onDelete);

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = selected.has(item.key);
        const Icon = item.icon;
        const isEditing = editingKey === item.key;

        if (isEditing) {
          return (
            <input
              key={item.key}
              autoFocus
              defaultValue={item.label}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = e.currentTarget.value.trim();
                  if (val && onRename && item.entityId) onRename(item.entityId, val);
                  setEditingKey(null);
                } else if (e.key === "Escape") {
                  setEditingKey(null);
                }
              }}
              onBlur={() => setEditingKey(null)}
              className="rounded-full border border-[var(--accent-line)] bg-[var(--bg)] px-3 py-1.5 text-xs font-medium text-[var(--text)] focus:outline-none"
              style={{ width: `${Math.max(item.label.length + 4, 8)}ch` }}
            />
          );
        }

        return (
          <button
            key={item.key}
            onClick={() => onToggle(item.key)}
            onContextMenu={(e) => {
              if (!canEdit || !item.entityId) return;
              e.preventDefault();
              setMenu({ key: item.key, x: e.clientX, y: e.clientY });
            }}
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

      {menu && (
        <ChipContextMenu
          x={menu.x}
          y={menu.y}
          onRename={() => {
            setEditingKey(menu.key);
            setMenu(null);
          }}
          onMerge={
            onMergeRequest
              ? () => {
                  const item = items.find((i) => i.key === menu.key);
                  if (item?.entityId) onMergeRequest(item.entityId);
                  setMenu(null);
                }
              : undefined
          }
          onDelete={() => {
            const item = items.find((i) => i.key === menu.key);
            if (item?.entityId && onDelete && confirm(`Delete "${item.label}"?`)) {
              onDelete(item.entityId);
            }
            setMenu(null);
          }}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
