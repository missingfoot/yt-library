import { X } from "lucide-react";
import { TaxonomyRow, type TaxonomyItem } from "@/components/TaxonomyRow";

interface ManageTagsModalProps {
  tags: TaxonomyItem[];
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function ManageTagsModal({ tags, onRename, onDelete, onClose }: ManageTagsModalProps) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">Manage tags</h2>
          <button onClick={onClose} title="Close" className="text-[var(--text-dim)] hover:text-[var(--text)]">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <section className="flex flex-col gap-2">
          {tags.map((t) => (
            <TaxonomyRow key={t.id} item={t} onRename={onRename} onDelete={onDelete} />
          ))}
        </section>
      </div>
    </div>
  );
}
