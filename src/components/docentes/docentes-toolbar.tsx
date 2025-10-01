
'use client';

import { Button } from '@/components/ui/button';
import { Download, FileUp, PlusCircle } from 'lucide-react';

type DocentesToolbarProps = {
  onAdd: () => void;
  onImport: () => void;
  onExport: () => void;
};

export function DocentesToolbar({
  onAdd,
  onImport,
  onExport,
}: DocentesToolbarProps) {
  return (
    <>
      {/* Desktop Toolbar */}
      <div className="hidden sm:flex items-center gap-2">
        <Button variant="outline" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button variant="outline" onClick={onImport}>
          <FileUp className="mr-2 h-4 w-4" />
          Importar
        </Button>
        <Button onClick={onAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Personal
        </Button>
      </div>

      {/* Mobile Add Button */}
      <div className="sm:hidden">
        <Button onClick={onAdd} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Personal
        </Button>
      </div>
    </>
  );
}
