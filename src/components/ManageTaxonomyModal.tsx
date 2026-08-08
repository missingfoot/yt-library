"use client";

import { useState } from "react";

interface TaxonomyItem {
  id: string;
  name: string;
}

interface ManageTaxonomyModalProps {
  categories: TaxonomyItem[];
  tags: TaxonomyItem[];
  onRenameCategory: (id: string, newName: string) => void;
  onDeleteCategory: (id: string) => void;
  onRenameTag: (id: string, newName: string) => void;
  onDeleteTag: (id: string) => void;
  onClose: () => void;
}

function TaxonomyRow({
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

export function ManageTaxonomyModal({
  categories,
  tags,
  onRenameCategory,
  onDeleteCategory,
  onRenameTag,
  onDeleteTag,
  onClose,
}: ManageTaxonomyModalProps) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">Manage categories & tags</h2>
          <button onClick={onClose} className="text-xs font-mono text-[var(--text-dim)]">
            close
          </button>
        </div>

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-mono uppercase text-[var(--text-faint)]">Categories</h3>
          {categories.map((c) => (
            <TaxonomyRow key={c.id} item={c} onRename={onRenameCategory} onDelete={onDeleteCategory} />
          ))}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-mono uppercase text-[var(--text-faint)]">Tags</h3>
          {tags.map((t) => (
            <TaxonomyRow key={t.id} item={t} onRename={onRenameTag} onDelete={onDeleteTag} />
          ))}
        </section>
      </div>
    </div>
  );
}
