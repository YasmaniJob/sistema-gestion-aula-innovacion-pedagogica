'use client';

import { useState, useEffect } from 'react';
import { AdaptiveDialog } from '@/components/adaptive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { Resource } from '@/domain/types';

type EditResourceNumberDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  resource: Resource | null;
  onSave: (resourceId: string, newName: string) => Promise<void>;
};

export function EditResourceNumberDialog({
  isOpen,
  onOpenChange,
  resource,
  onSave
}: EditResourceNumberDialogProps) {
  const [number, setNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Update number when resource changes
  useEffect(() => {
    if (resource) {
      // Extract number from resource name (e.g., "Laptop 1" -> "1")
      const match = resource.name.match(/(\d+)$/);
      setNumber(match ? match[1] : '');
    }
  }, [resource]);

  const handleSave = async () => {
    if (!resource || !number.trim()) return;

    setIsLoading(true);
    try {
      // Generate new name by replacing the number part
      const baseName = resource.name.replace(/\s+\d+$/, '');
      const newName = `${baseName} ${number.trim()}`;
      await onSave(resource.id, newName);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating resource number:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNumber(resource?.number || '');
    onOpenChange(false);
  };

  return (
    <AdaptiveDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Editar Numeración"
      description={`Editar la numeración del recurso ${resource?.name || ''}`}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="resource-number">Número del recurso</Label>
          <Input
            id="resource-number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Ingrese el número del recurso"
            disabled={isLoading}
          />
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !number.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </Button>
        </div>
      </div>
    </AdaptiveDialog>
  );
}