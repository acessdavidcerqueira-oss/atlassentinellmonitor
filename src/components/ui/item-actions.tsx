"use client";

import Link from "next/link";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ItemActionsProps {
  isEditing?: boolean;
  editHref?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  saveLabel?: string;
  cancelLabel?: string;
  className?: string;
  deleteDisabled?: boolean;
}

export function ItemActions({
  isEditing = false,
  editHref,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  editLabel = "Editar",
  deleteLabel = "Excluir",
  saveLabel = "Salvar",
  cancelLabel = "Cancelar",
  className,
  deleteDisabled = false
}: ItemActionsProps) {
  if (isEditing) {
    return (
      <div className={cn("flex items-center justify-end gap-2 print:hidden", className)}>
        <Button type="button" size="icon" variant="secondary" onClick={onSave} aria-label={saveLabel}>
          <Save className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" onClick={onCancel} aria-label={cancelLabel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-end gap-2 print:hidden", className)}>
      {editHref ? (
        <Button asChild type="button" size="icon" variant="ghost" aria-label={editLabel}>
          <Link href={editHref}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button type="button" size="icon" variant="ghost" onClick={onEdit} aria-label={editLabel}>
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="text-red-300 hover:text-red-200"
        onClick={onDelete}
        aria-label={deleteLabel}
        disabled={deleteDisabled}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
