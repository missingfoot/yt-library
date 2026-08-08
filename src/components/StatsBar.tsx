interface StatsBarProps {
  total: number;
  categoryCount: number;
  uncategorizedCount: number;
}

export function StatsBar({ total, categoryCount, uncategorizedCount }: StatsBarProps) {
  const stats = [
    { label: "Channels", value: total },
    { label: "Categories", value: categoryCount },
    { label: "Uncategorized", value: uncategorizedCount },
  ];

  return (
    <div className="flex gap-7 flex-wrap">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col gap-0.5">
          <span className="font-mono text-xl font-semibold text-[var(--text)]">{s.value}</span>
          <span className="font-mono text-[10.5px] tracking-wider uppercase text-[var(--text-faint)]">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
