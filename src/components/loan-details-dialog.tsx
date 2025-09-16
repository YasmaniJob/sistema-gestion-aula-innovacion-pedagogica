
'use client';

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
import type { Resource, Loan } from '@/domain/types';
import { User, Calendar, Hash } from 'lucide-react';
import { Separator } from './ui/separator';
import { useData } from '@/context/data-provider-refactored';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());

type LoanDetailsDialogProps = {
  resource: Resource | null;
  onOpenChange: (isOpen: boolean) => void;
};


export function LoanDetailsDialog({
  resource,
  onOpenChange,
}: LoanDetailsDialogProps) {
  const { loans, findUserById } = useData();
  const isOpen = !!resource;

  const loanDetails: Loan | undefined = useMemo(() => {
    if (!resource) return undefined;
    return loans.find(l => 
        l.status === 'active' && 
        l.resources.some(r => r.id === resource.id)
    );
  }, [resource, loans]);

  if (!resource || !loanDetails) {
    return null;
  }

  const user = findUserById(loanDetails.user?.id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalles del Préstamo</DialogTitle>
          <DialogDescription>
            Información del recurso <strong>{resource.name}</strong> que se encuentra actualmente en préstamo.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="space-y-4 py-4">
            <div className="flex items-start gap-4">
                <User className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                    <Label htmlFor="borrower">Prestado a:</Label>
                    <p id="borrower" className="font-semibold">{user?.name || 'Desconocido'}</p>
                </div>
            </div>
             {loanDetails.purpose === 'aprendizaje' && loanDetails.purposeDetails?.grade && (
                 <div className="flex items-start gap-4">
                    <Hash className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                        <Label htmlFor="grade">Grado y sección:</Label>
                        <p id="grade" className="font-semibold">{loanDetails.purposeDetails.grade}, {loanDetails.purposeDetails.section}</p>
                    </div>
                </div>
             )}
            <div className="flex items-start gap-4">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                    <Label htmlFor="loanDate">Fecha de préstamo:</Label>
                    <p id="loanDate" className="font-semibold">{isValidDate(loanDetails.loanDate) ? format(loanDetails.loanDate, "dd 'de' MMMM, yyyy, h:mm:ss a", { locale: es }) : 'Fecha inválida'}</p>
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
