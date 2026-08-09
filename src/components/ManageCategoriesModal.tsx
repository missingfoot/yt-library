import { ManageListModal } from "@/components/ManageListModal";
import type { TaxonomyItem } from "@/components/TaxonomyRow";

interface ManageCategoriesModalProps {
  categories: TaxonomyItem[];
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function ManageCategoriesModal({ categories, onRename, onDelete, onClose }: ManageCategoriesModalProps) {
  return (
    <ManageListModal
      title="Manage categories"
      filterPlaceholder="Filter categories..."
      items={categories}
      onRename={onRename}
      onDelete={onDelete}
      onClose={onClose}
    />
  );
}
