"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { catColor } from "@/lib/categoryColors";
import { catIcon } from "@/lib/categoryIcons";

interface CategoryOption {
  id: string;
  name: string;
}

interface CategorySelectProps {
  value: string | undefined;
  categories: CategoryOption[];
  onChange: (name: string | undefined) => void;
}

export function CategorySelect({ value, categories, onChange }: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFilter("");
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setFilter("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    inputRef.current?.focus();
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const options = [{ id: "__uncategorized__", name: "Uncategorized" }, ...categories];
    if (!q) return options;
    return options.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, filter]);

  function select(name: string) {
    onChange(name === "Uncategorized" ? undefined : name);
    setOpen(false);
    setFilter("");
  }

  const TriggerIcon = catIcon(value);
  const triggerLabel = value ?? "Uncategorized";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm text-left"
      >
        <TriggerIcon size={15} strokeWidth={2} color={catColor(value)} className="shrink-0" />
        <span className="flex-1 truncate">{triggerLabel}</span>
        <ChevronDown size={14} strokeWidth={2} className="text-[var(--text-faint)] shrink-0" />
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface)] shadow-lg flex flex-col">
          <div className="relative p-2 border-b border-[var(--border-soft)]">
            <Search size={13} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter categories..."
              className="w-full rounded border border-[var(--border)] bg-[var(--bg)] pl-7 pr-2 py-1
                         text-[12px] text-[var(--text)] placeholder:text-[var(--text-faint)]
                         focus:outline-none focus:border-[var(--accent-line)]"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-[var(--text-faint)]">No matches</div>
            )}
            {filtered.map((c) => {
              const isSelected = c.name === triggerLabel;
              const Icon = catIcon(c.name === "Uncategorized" ? undefined : c.name);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => select(c.name)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left
                    ${isSelected ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "hover:bg-[var(--surface-hover)] text-[var(--text)]"}`}
                >
                  <Icon size={14} strokeWidth={2} color={catColor(c.name === "Uncategorized" ? undefined : c.name)} className="shrink-0" />
                  <span className="truncate">{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
