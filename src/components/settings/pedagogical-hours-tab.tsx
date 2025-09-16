

'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useData } from '@/context/data-provider-refactored';
import type { PedagogicalHour } from '@/domain/types';

const getOrdinalSuffix = (n: number) => {
    const s = ['ta', 'ra', 'da', 'ra', 'ta', 'ta', 'ta', 'va', 'na', 'ma'];
    if (n % 100 >= 11 && n % 100 <= 13) {
      return 'va';
    }
    const lastDigit = n % 10;
    if (lastDigit === 1) return 'ra';
    if (lastDigit === 2) return 'da';
    if (lastDigit === 3) return 'ra';
    if (lastDigit === 7) return 'ma';
    return 'ta';
  };

export function PedagogicalHoursTab() {
  const { pedagogicalHours, addPedagogicalHour, deletePedagogicalHour } = useData();
  const [hourToDelete, setHourToDelete] = useState<PedagogicalHour | null>(null);
  const { toast } = useToast();

  const handleAddNew = async () => {
    const nextNumber = (pedagogicalHours.length > 0 ? Math.max(...pedagogicalHours.map(h => parseInt(h.name) || 0)) : 0) + 1;
    const suffix = getOrdinalSuffix(nextNumber);
    const newName = `${nextNumber}${suffix} Hora`;
    
    try {
        await addPedagogicalHour(newName);
        toast({ title: 'Bloque Añadido', description: `Se ha añadido el bloque "${newName}".`});
    } catch(error: any) {
        toast({ title: 'Error al Añadir', description: error.message, variant: 'destructive'});
    }
  };

  const handleDeleteClick = (hour: PedagogicalHour) => {
    setHourToDelete(hour);
  };

  const confirmDelete = async () => {
    if (!hourToDelete) return;

    try {
        await deletePedagogicalHour(hourToDelete.id);
        toast({
            title: 'Bloque Eliminado',
            description: `El bloque "${hourToDelete.name}" ha sido eliminado.`,
            variant: 'destructive',
        });
    } catch (error: any) {
        toast({ title: 'Error al Eliminar', description: error.message, variant: 'destructive'});
    } finally {
        setHourToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Horas Pedagógicas</CardTitle>
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleAddNew}>
                <PlusCircle className="mr-2" />
                Añadir Bloque
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg mt-4">
            <div className="space-y-0">
              {pedagogicalHours.map((hour) => (
                <div key={hour.id} className="flex items-center gap-2 p-2 border-b last:border-b-0 hover:bg-muted/50">
                  <p className="flex-grow px-3 font-medium text-sm sm:text-base">{hour.name}</p>
                  <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0" onClick={() => handleDeleteClick(hour)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {pedagogicalHours.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  No hay bloques definidos. Haz clic en "Añadir Bloque" para empezar.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!hourToDelete} onOpenChange={(isOpen) => !isOpen && setHourToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el bloque 
              <strong> {hourToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setHourToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
