"use client";

import { useState } from "react";

export interface TaxonomyItem {
  id: string;
  name: string;
}

export function TaxonomyRow({
  item,
  onRename,
  onDelete,
}: {
  item: TaxonomyItem;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(item.name);
  return (
    <div className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-sm"
      />
      <button
        onClick={() => onRename(item.id, name)}
        disabled={name.trim() === item.name || !name.trim()}
        className="text-xs font-mono text-[var(--accent)] px-2 py-1 disabled:opacity-30"
      >
        rename
      </button>
      <button
        onClick={() => {
          if (confirm(`Delete "${item.name}"?`)) onDelete(item.id);
        }}
        className="text-xs font-mono text-[var(--text-faint)] hover:text-red-400 px-2 py-1"
      >
        delete
      </button>
    </div>
  );
}
