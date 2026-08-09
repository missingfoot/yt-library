import { ManageListModal } from "@/components/ManageListModal";
import type { TaxonomyItem } from "@/components/TaxonomyRow";

interface ManageTagsModalProps {
  tags: TaxonomyItem[];
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function ManageTagsModal({ tags, onRename, onDelete, onClose }: ManageTagsModalProps) {
  return (
    <ManageListModal
      title="Manage tags"
      filterPlaceholder="Filter tags..."
      items={tags}
      onRename={onRename}
      onDelete={onDelete}
      onClose={onClose}
    />
  );
}
