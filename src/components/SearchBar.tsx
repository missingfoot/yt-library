import { Search, Delete } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search
        size={16}
        strokeWidth={2}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search channels..."
        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] pl-9 pr-9 py-2.5
                   text-sm text-[var(--text)] placeholder:text-[var(--text-faint)]
                   focus:outline-none focus:border-[var(--accent-line)]"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          title="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text)]"
        >
          <Delete size={20} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
