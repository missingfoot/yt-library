interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search channels..."
      className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5
                 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)]
                 focus:outline-none focus:border-[var(--accent-line)]"
    />
  );
}
