
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Resource } from '@/domain/types';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Megaphone, Trash2, Loader2, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import { Separator } from './ui/separator';

type MaintenanceDialogProps = {
  resource: Resource | null;
  onConfirm: (resourceId: string, resolution: 'disponible' | 'dañado', notes: string) => void;
  onDelete: () => void;
  onOpenChange: (isOpen: boolean) => void;
};

export function MaintenanceDialog({
  resource,
  onConfirm,
  onDelete,
  onOpenChange,
}: MaintenanceDialogProps) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isDeleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState<'disponible' | 'dañado' | 'delete' | null>(null);
  const { toast } = useToast();
  const isOpen = !!resource;

  const handleConfirm = async (resolution: 'disponible' | 'dañado') => {
    if (resolution === 'dañado' && !resolutionNotes.trim()) {
      toast({
        title: 'Error de Validación',
        description: 'Debes añadir una nota si marcas el recurso como no reparable.',
        variant: 'destructive',
      });
      return;
    }

    if (resource && !processingAction) {
      setProcessingAction(resolution);
      try {
        await onConfirm(resource.id, resolution, resolutionNotes);
        
        // Mostrar toast de éxito
        const successMessages = {
          'disponible': 'El recurso ha sido marcado como reparado y disponible',
          'dañado': 'El recurso ha sido marcado como no reparable'
        };
        
        toast({
          title: "Mantenimiento Resuelto",
          description: successMessages[resolution],
          variant: 'default',
        });
        
        // Cerrar modal automáticamente después de acción exitosa
        handleClose();
      } catch (error: any) {
        toast({
          title: "Error al Resolver",
          description: error.message || "No se pudo resolver el mantenimiento.",
          variant: 'destructive',
        });
      } finally {
        setProcessingAction(null);
      }
    }
  };
  
  const handleClose = () => {
    if (!processingAction) {
      onOpenChange(false);
      setResolutionNotes(''); // Reset notes
    }
  }

  const handleDelete = async () => {
    if (!processingAction) {
      setProcessingAction('delete');
      try {
        await onDelete();
        
        toast({
          title: "Recurso Eliminado",
          description: "El recurso ha sido dado de baja permanentemente",
          variant: 'default',
        });
        
        setDeleteConfirmationOpen(false);
        handleClose();
      } catch (error: any) {
        toast({
          title: "Error al Eliminar",
          description: error.message || "No se pudo eliminar el recurso.",
          variant: 'destructive',
        });
      } finally {
        setProcessingAction(null);
      }
    }
  }

  useEffect(() => {
    // When the resource changes, pre-fill notes if they exist, otherwise clear.
    setResolutionNotes(resource?.damageNotes || '');
  }, [resource]);

  if (!resource) {
    return null;
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolver Mantenimiento</DialogTitle>
          <DialogDescription>
             El recurso "{resource.name}" está en mantenimiento. Define el resultado.
          </DialogDescription>
        </DialogHeader>

        {resource.damageNotes && (
             <Alert variant="destructive">
                <Megaphone className="h-4 w-4" />
                <AlertTitle>Reporte de Daño Inicial</AlertTitle>
                <AlertDescription>
                    {resource.damageNotes}
                </AlertDescription>
            </Alert>
        )}

        <div className="grid w-full gap-2 py-2">
          <Label htmlFor="resolution-notes">
            Notas de Resolución (Opcional si se reparó, obligatorio si no es reparable)
          </Label>
          <Textarea 
            id="resolution-notes"
            placeholder="Ej: Se reemplazó la batería. / La pantalla no tiene reparación, dar de baja." 
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
          />
        </div>
        
        <DialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4">
            <Button 
              variant="destructive" 
              onClick={() => handleConfirm('dañado')}
              disabled={!!processingAction}
            >
              {processingAction === 'dañado' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  No Reparable (Dañado)
                </>
              )}
            </Button>
            <Button 
              onClick={() => handleConfirm('disponible')}
              disabled={!!processingAction}
            >
              {processingAction === 'disponible' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Reparado (Disponible)
                </>
              )}
            </Button>
        </DialogFooter>
        <Separator className="my-4" />
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!!processingAction}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setDeleteConfirmationOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Dar de Baja Permanente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
      </DialogContent>
    </Dialog>
     <DeleteConfirmationDialog
        isOpen={isDeleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
        onConfirm={handleDelete}
        title="¿Confirmar Dar de Baja?"
        description={`Esta acción es irreversible. El recurso ${resource?.name} será eliminado permanentemente del inventario.`}
        isLoading={processingAction === 'delete'}
        confirmText="Sí, dar de baja"
      />
    </>
  );
}
