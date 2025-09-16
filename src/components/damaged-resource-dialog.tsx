
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Resource } from '@/domain/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Megaphone, Wrench, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type DamagedResourceDialogProps = {
  resource: Resource | null;
  onConfirm: (resourceId: string, notes: string) => Promise<void>;
  onOpenChange: (isOpen: boolean) => void;
};

export function DamagedResourceDialog({
  resource,
  onConfirm,
  onOpenChange,
}: DamagedResourceDialogProps) {
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const isOpen = !!resource;
  const { toast } = useToast();

  useEffect(() => {
    if (resource?.damageNotes) {
      setNotes(resource.damageNotes);
    } else {
      setNotes('');
    }
  }, [resource]);
  
  const handleConfirm = async () => {
    if (!notes.trim()) {
        toast({
            title: "Notas requeridas",
            description: "Debes describir el daño antes de enviar a mantenimiento.",
            variant: "destructive",
        });
        return;
    }
    
    if (resource && !isProcessing) {
        setIsProcessing(true);
        try {
            await onConfirm(resource.id, notes);
            
            toast({
                title: "Enviado a Mantenimiento",
                description: "El recurso ha sido enviado a mantenimiento correctamente.",
                variant: 'default',
            });
            
            // Cerrar modal automáticamente después de acción exitosa
            handleClose();
        } catch (error: any) {
            toast({
                title: "Error al Enviar",
                description: error.message || "No se pudo enviar el recurso a mantenimiento.",
                variant: 'destructive',
            });
        } finally {
            setIsProcessing(false);
        }
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
        onOpenChange(false);
        setNotes('');
    }
  };

  if (!resource) {
    return null;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Enviar a Mantenimiento</DialogTitle>
                <DialogDescription>
                   El recurso <strong>{resource.name}</strong> está dañado. Describe el problema para enviarlo a revisión.
                </DialogDescription>
            </DialogHeader>

            {resource.damageNotes && (
                 <Alert variant="destructive">
                    <Megaphone className="h-4 w-4" />
                    <AlertTitle>Reporte de Daño Previo</AlertTitle>
                    <AlertDescription>
                        {resource.damageNotes}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid w-full gap-2 py-2">
                <Label htmlFor="damage-notes">
                    Descripción del Daño
                </Label>
                <Textarea 
                    id="damage-notes"
                    placeholder="Ej: La pantalla está rota, el lente no enfoca, no enciende..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            <DialogFooter>
                <Button type="button" variant="ghost" onClick={handleClose} disabled={isProcessing}>Cancelar</Button>
                <Button onClick={handleConfirm} disabled={isProcessing}>
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Wrench className="mr-2 h-4 w-4" />
                            Confirmar Envío
                        </>
                    )}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
