"use client";

import { useEffect, useRef } from "react";

interface ChipContextMenuProps {
  x: number;
  y: number;
  onRename: () => void;
  onDelete: () => void;
  onMerge?: () => void;
  onClose: () => void;
}

export function ChipContextMenu({ x, y, onRename, onDelete, onMerge, onClose }: ChipContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ position: "fixed", left: x, top: y }}
      className="z-50 flex flex-col rounded border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden min-w-[100px]"
    >
      <button
        onClick={onRename}
        className="px-3 py-1.5 text-xs font-mono text-left text-[var(--text)] hover:bg-[var(--surface-hover)]"
      >
        rename
      </button>
      {onMerge && (
        <button
          onClick={onMerge}
          className="px-3 py-1.5 text-xs font-mono text-left text-[var(--text)] hover:bg-[var(--surface-hover)]"
        >
          merge
        </button>
      )}
      <button
        onClick={onDelete}
        className="px-3 py-1.5 text-xs font-mono text-left text-red-400 hover:bg-[var(--surface-hover)]"
      >
        delete
      </button>
    </div>
  );
}
