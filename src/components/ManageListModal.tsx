"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { TaxonomyRow, type TaxonomyItem } from "@/components/TaxonomyRow";

interface ManageListModalProps {
  title: string;
  filterPlaceholder: string;
  items: TaxonomyItem[];
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function ManageListModal({ title, filterPlaceholder, items, onRename, onDelete, onClose }: ManageListModalProps) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, filter]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg max-h-[80vh] rounded-lg border border-[var(--border)] bg-[var(--surface)] flex flex-col">
        <div className="sticky top-0 flex flex-col gap-3 px-5 py-4 border-b border-[var(--border-soft)] bg-[var(--surface)] rounded-t-lg shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl">{title}</h2>
            <button onClick={onClose} title="Close" className="text-[var(--text-dim)] hover:text-[var(--text)]">
              <X size={16} strokeWidth={2} />
            </button>
          </div>
          <div className="relative">
            <Search size={14} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={filterPlaceholder}
              className="w-full rounded border border-[var(--border)] bg-[var(--bg)] pl-8 pr-2 py-1.5
                         text-sm text-[var(--text)] placeholder:text-[var(--text-faint)]
                         focus:outline-none focus:border-[var(--accent-line)]"
            />
          </div>
        </div>

        <section className="flex flex-col gap-2 px-5 py-4 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-sm text-[var(--text-faint)]">No matches</p>
          )}
          {filtered.map((item) => (
            <TaxonomyRow key={item.id} item={item} onRename={onRename} onDelete={onDelete} />
          ))}
        </section>
      </div>
    </div>
  );
}
