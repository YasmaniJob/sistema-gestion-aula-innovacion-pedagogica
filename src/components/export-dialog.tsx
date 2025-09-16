
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileDown, FileText } from 'lucide-react';

type ExportDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  itemCount: number;
  itemName: string;
};

export function ExportDialog({
  isOpen,
  onOpenChange,
  onExportExcel,
  onExportPDF,
  itemCount,
  itemName,
}: ExportDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle>Exportar {itemName}</DialogTitle>
          <DialogDescription>
            Se exportarán {itemCount} registros. Elige el formato de descarga.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
            <Button variant="outline" size="lg" className="h-auto hover:bg-accent/50" onClick={onExportExcel}>
                <div className="flex flex-col items-center gap-2 p-4">
                    <FileDown className="h-8 w-8 text-green-600" />
                    <span className="font-semibold text-base text-foreground">Excel</span>
                    <span className="text-xs text-muted-foreground">.xlsx</span>
                </div>
            </Button>
            <Button variant="outline" size="lg" className="h-auto hover:bg-accent/50" onClick={onExportPDF}>
                <div className="flex flex-col items-center gap-2 p-4">
                    <FileText className="h-8 w-8 text-red-600" />
                    <span className="font-semibold text-base text-foreground">PDF</span>
                    <span className="text-xs text-muted-foreground">.pdf</span>
                </div>
            </Button>
        </div>
        <DialogFooter className="sm:justify-center">
            <DialogClose asChild>
                <Button variant="ghost" className="w-full sm:w-auto">Cancelar</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
