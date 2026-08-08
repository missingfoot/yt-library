import { X } from "lucide-react";
import { TaxonomyRow, type TaxonomyItem } from "@/components/TaxonomyRow";

interface ManageCategoriesModalProps {
  categories: TaxonomyItem[];
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function ManageCategoriesModal({ categories, onRename, onDelete, onClose }: ManageCategoriesModalProps) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">Manage categories</h2>
          <button onClick={onClose} title="Close" className="text-[var(--text-dim)] hover:text-[var(--text)]">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <section className="flex flex-col gap-2">
          {categories.map((c) => (
            <TaxonomyRow key={c.id} item={c} onRename={onRename} onDelete={onDelete} />
          ))}
        </section>
      </div>
    </div>
  );
}
