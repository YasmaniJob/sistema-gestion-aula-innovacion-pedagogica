'use client';

import { AdaptiveDialog } from '@/components/adaptive-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type DeleteConfirmationDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
  confirmText?: string;
};

export function DeleteConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  description,
  isLoading = false,
  confirmText = 'Sí, eliminar'
}: DeleteConfirmationDialogProps) {
  return (
    <AdaptiveDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <div className="flex flex-col gap-4 pt-4">
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </AdaptiveDialog>
  );
}