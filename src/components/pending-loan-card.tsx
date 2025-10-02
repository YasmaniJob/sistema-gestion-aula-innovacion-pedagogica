'use client';

import { useState } from 'react';
import type { Loan } from '@/domain/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, XCircle, Loader2, Zap, MessageCircle } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type PendingLoanCardProps = {
    loan: Loan;
    onApprove: (loanId: string) => void;
    onReject: (loanId: string) => void;
    isProcessing: boolean;
};

export function PendingLoanCard({ loan, onApprove, onReject, isProcessing }: PendingLoanCardProps) {
    const [showNotesDialog, setShowNotesDialog] = useState(false);

    return (
        <>
            <Card key={loan.id} className="bg-primary/5 border-primary/20 border-l-4">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarFallback>{getInitials(loan.user?.name || 'Usuario')}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{loan.user?.name || 'Usuario Desconocido'}</p>
                                <p className="text-sm text-muted-foreground">{loan.purposeDetails?.activityName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="destructive" onClick={() => onReject(loan.id)} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                Rechazar
                            </Button>
                            <Button size="sm" onClick={() => onApprove(loan.id)} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                Aprobar
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className='space-y-2'>
                    <p className="text-sm font-medium">
                        Recursos Solicitados ({loan.resources.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {(() => {
                            // Separar recursos principales de cargadores
                            const mainResources = loan.resources.filter(resource => {
                                // Excluir opciones inteligentes identificadas por ID sintético
                                if (resource.id && resource.id.startsWith('smart-')) {
                                    return false;
                                }

                                // Excluir accesorios identificados por nombre
                                return resource.name && (
                                    !resource.name.toLowerCase().includes('cargador') &&
                                    !resource.name.toLowerCase().includes('charger') &&
                                    !resource.name.toLowerCase().includes('adaptador de corriente')
                                );
                            });
                            const chargers = loan.resources.filter(resource => {
                                // Incluir opciones inteligentes de cargadores por ID sintético
                                if (resource.id && resource.id.startsWith('smart-') && resource.name) {
                                    const name = resource.name.toLowerCase();
                                    return name.includes('cargador') || name.includes('charger') || name.includes('adaptador');
                                }

                                // Incluir cargadores identificados por nombre
                                return resource.name && (
                                    resource.name.toLowerCase().includes('cargador') ||
                                    resource.name.toLowerCase().includes('charger') ||
                                    resource.name.toLowerCase().includes('adaptador de corriente')
                                );
                            });

                            const elements = [];

                            // Mostrar recursos principales
                            mainResources.forEach((resource) => {
                                // Verificar si hay cargadores para este recurso principal
                                const hasCharger = chargers.length > 0 && (
                                    (resource as any).category === 'Laptops' || (resource as any).category === 'Tablets' ||
                                    (resource.name && (resource.name.toLowerCase().includes('laptop') || resource.name.toLowerCase().includes('tablet')))
                                );

                                elements.push(
                                    <Badge key={resource.id} variant="secondary" className="font-normal py-1 pr-3">
                                        {resource.name} ({resource.brand})
                                        {loan.notes && (
                                            <button
                                                onClick={() => setShowNotesDialog(true)}
                                                className="ml-2 pl-2 border-l border-border hover:bg-muted/50 rounded-r"
                                                aria-label="Ver nota del préstamo"
                                            >
                                                <MessageCircle className="h-4 w-4 text-blue-600" />
                                            </button>
                                        )}
                                    </Badge>
                                );

                                // Agregar badge separado para el cargador si existe
                                 if (hasCharger) {
                                     elements.push(
                                         <Badge key={`${resource.id}-charger`} variant="secondary" className="font-normal py-1 pr-3">
                                             <Zap className="h-4 w-4 mr-2" />
                                             Cargador
                                             {loan.notes && (
                                                 <button
                                                     onClick={() => setShowNotesDialog(true)}
                                                     className="ml-2 pl-2 border-l border-border hover:bg-muted/50 rounded-r"
                                                     aria-label="Ver nota del préstamo"
                                                 >
                                                     <MessageCircle className="h-4 w-4 text-blue-600" />
                                                 </button>
                                             )}
                                         </Badge>
                                     );
                                 }
                            });

                            // Mostrar cargadores independientes (que no están asociados a laptops/tablets)
                            chargers.forEach((charger) => {
                                const hasMainResource = mainResources.some(resource =>
                                    (resource as any).category === 'Laptops' || (resource as any).category === 'Tablets' ||
                                    (resource.name && (resource.name.toLowerCase().includes('laptop') || resource.name.toLowerCase().includes('tablet')))
                                );

                                // Solo mostrar cargadores independientes si no hay recursos principales que los incluyan
                                if (!hasMainResource) {
                                    elements.push(
                                        <Badge key={charger.id} variant="secondary" className="font-normal py-1 pr-3">
                                            <Zap className="h-4 w-4 mr-2" />
                                            {charger.name} ({charger.brand})
                                            {loan.notes && (
                                                <button
                                                    onClick={() => setShowNotesDialog(true)}
                                                    className="ml-2 pl-2 border-l border-border hover:bg-muted/50 rounded-r"
                                                    aria-label="Ver nota del préstamo"
                                                >
                                                    <MessageCircle className="h-4 w-4 text-blue-600" />
                                                </button>
                                            )}
                                        </Badge>
                                    );
                                }
                            });

                            return elements;
                        })()}
                    </div>

                    {/* Botón de respaldo para notas - aparece si hay notas pero no hay recursos visibles */}
                    {loan.notes && loan.resources.length === 0 && (
                        <div className="pt-2 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowNotesDialog(true)}
                                className="gap-2"
                            >
                                <MessageCircle className="h-4 w-4 text-blue-600" />
                                Ver Notas del Préstamo
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal para mostrar las notas del préstamo */}
            <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-blue-600" />
                            Notas del Préstamo
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">Solicitante:</p>
                            <p className="font-semibold">{loan.user?.name || 'Usuario Desconocido'}</p>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700 mb-2">Notas adicionales:</p>
                            <p className="text-sm leading-relaxed">{loan.notes || 'No hay notas adicionales para este préstamo.'}</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}