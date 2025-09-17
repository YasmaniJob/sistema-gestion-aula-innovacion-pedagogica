
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenSquare, PlusCircle, Trash2, BookCopy, MoreHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmationDialog } from '../delete-confirmation-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AreaForm } from './area-form';
import { useData } from '@/context/data-provider-refactored';
import type { Area } from '@/domain/types';

export function AreasTab() {
  const { areas, addAreas, updateArea, deleteArea } = useData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);
  const { toast } = useToast();

  const handleAddClick = () => {
    setEditingArea(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (area: Area) => {
    setEditingArea(area);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (area: Area) => {
    setAreaToDelete(area);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!areaToDelete) return;
    await deleteArea(areaToDelete.id);
    toast({
      title: "Área Eliminada",
      description: `El área "${areaToDelete.name}" ha sido eliminada.`,
      variant: 'destructive'
    });
    setIsDeleteDialogOpen(false);
    setAreaToDelete(null);
  };

  const onSubmit = async (data: { names: string[] }) => {
    try {
        if (editingArea) {
            const newName = data.names[0]; 
            if (newName) {
                await updateArea(editingArea.id, newName);
                toast({ title: "Área Actualizada", description: `El área se ha actualizado a "${newName}".` });
            }
        } else {
            const existingNames = new Set(areas.map(area => area.name));
            const newNames = data.names.filter(name => !existingNames.has(name));

            if(newNames.length > 0) {
                await addAreas(newNames);
                toast({ title: "Áreas Añadidas", description: `${newNames.length} nueva(s) área(s) ha(n) sido añadida(s).` });
            } else if (data.names.length > 0) {
                toast({ title: "Sin cambios", description: 'Las áreas seleccionadas ya existen.', variant: 'default' });
            }
        }
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsFormOpen(false);
        setEditingArea(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Áreas Académicas</CardTitle>
                <CardDescription>
                  Gestiona las áreas de estudio que se imparten en la institución.
                </CardDescription>
              </div>
              <div className="flex w-full sm:w-auto items-center gap-2">
                <Button className="w-full sm:w-auto" onClick={handleAddClick}>
                  <PlusCircle className="mr-2" />
                  Añadir Área(s)
                </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {areas.map((area) => (
              <Card key={area.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-muted rounded-full">
                      <BookCopy className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-sm">{area.name}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditClick(area)}>
                      <PenSquare className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteClick(area)} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Card>
            ))}
             {areas.length === 0 && (
                <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  No hay áreas definidas. Haz clic en "Añadir Área(s)" para empezar.
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingArea ? 'Editar' : 'Añadir'} Área(s)</DialogTitle>
            <DialogDescription>
              {editingArea ? 'Modifica el nombre del área académica.' : 'Selecciona o escribe una o más áreas para añadir al sistema.'}
            </DialogDescription>
          </DialogHeader>
          <AreaForm
            key={editingArea?.id || 'add-mode'}
            onSubmit={onSubmit}
            onCancel={() => setIsFormOpen(false)}
            editingArea={editingArea}
            existingAreas={areas}
          />
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="¿Estás seguro?"
        description={`Esta acción no se puede deshacer. Se eliminará permanentemente el área ${areaToDelete?.name} del sistema.`}
      />
    </>
  );
}
