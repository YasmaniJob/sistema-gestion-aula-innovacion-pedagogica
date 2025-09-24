
'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import type { Loan, Resource } from '@/domain/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());
import { Card, CardContent } from './ui/card';
import { GraduationCap, ShieldAlert, User, MessageSquarePlus, CircleDotDashed, PackageX } from 'lucide-react';
import { reportLabels } from '@/domain/constants';

type IncidentsReportDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    loan?: Loan;
    resource?: Pick<Resource, 'id' | 'name' | 'brand'>;
};

export function IncidentsReportDialog({
    isOpen,
    onOpenChange,
    loan,
    resource,
}: IncidentsReportDialogProps) {
    if (!isOpen || !loan || !resource) {
        return null;
    }

    const damageReport = loan.damageReports?.[resource.id];
    const suggestionReport = loan.suggestionReports?.[resource.id];
    const missingResource = loan.missingResources?.find(missing => missing.resourceId === resource.id);

    const damageItems = [
        ...(damageReport?.commonProblems || []),
        ...(damageReport?.otherNotes ? ['other-damage'] : [])
    ];
    const suggestionItems = [
        ...(suggestionReport?.commonSuggestions || []),
        ...(suggestionReport?.otherNotes ? ['other-suggestion'] : [])
    ];
    
    const getReportLabel = (id: string, type: 'damage' | 'suggestion'): {label: string, description: string} => {
        if (id === 'other-damage' && damageReport?.otherNotes) {
            return { label: 'Otro', description: damageReport.otherNotes };
        }
        if (id === 'other-suggestion' && suggestionReport?.otherNotes) {
             return { label: 'Otro', description: suggestionReport.otherNotes };
        }
        
        const labels = reportLabels[type];
        return labels[id] || { label: id, description: 'No hay descripción.' };
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-amber-500" />
                        Incidencias: {resource.name} ({resource.brand})
                    </DialogTitle>
                    <DialogDescription>
                        Resumen de daños y sugerencias reportados para este recurso durante el préstamo.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <Card>
                        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h3 className="font-semibold flex items-center gap-2 text-sm"><User className="h-4 w-4"/> Información del Docente</h3>
                                <div className="text-sm text-muted-foreground">
                                    <p><strong>Nombre:</strong> {loan.user?.name || 'Usuario Desconocido'}</p>
                                    <p><strong>Email:</strong> {loan.user?.email || 'No proporcionado'}</p>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <h3 className="font-semibold flex items-center gap-2 text-sm"><GraduationCap className="h-4 w-4"/> Información Académica</h3>
                                <div className="text-sm text-muted-foreground">
                                    <p><strong>Grado:</strong> {loan.purposeDetails?.grade || 'N/A'}</p>
                                    <p><strong>Sección:</strong> {loan.purposeDetails?.section || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 space-y-4">
                           <div className="flex justify-between items-center">
                             <h3 className="font-semibold text-base">Reporte de Incidencias</h3>
                             {loan.returnDate && (
                                 <p className="text-xs text-muted-foreground">
                                     Fecha del Reporte: {isValidDate(loan.returnDate) ? format(loan.returnDate, "d/M/yyyy, hh:mm a", { locale: es }) : 'Fecha inválida'}
                                </p>
                             )}
                           </div>
                           
                           {damageItems.length > 0 && (
                             <div className="space-y-3">
                                 <h4 className="font-semibold flex items-center gap-2 text-red-600">
                                    <CircleDotDashed/> Daños Reportados ({damageItems.length})
                                 </h4>
                                <div className="pl-4 border-l-2 border-red-500 space-y-3">
                                {damageItems.map((item) => {
                                     const { label, description } = getReportLabel(item, 'damage');
                                     return (
                                        <div key={item} className="p-3 bg-red-500/10 rounded-r-lg">
                                            <p className="font-bold text-sm text-red-700">{label}</p>
                                            <p className="text-xs text-red-700/80">{description}</p>
                                        </div>
                                     )
                                 })}
                                </div>
                             </div>
                           )}

                           {suggestionItems.length > 0 && (
                             <div className="space-y-3">
                                 <h4 className="font-semibold flex items-center gap-2 text-amber-600">
                                    <CircleDotDashed/> Sugerencias de Mejora ({suggestionItems.length})
                                 </h4>
                                <div className="pl-4 border-l-2 border-amber-500 space-y-3">
                                {suggestionItems.map((item) => {
                                      const { label, description } = getReportLabel(item, 'suggestion');
                                     return (
                                        <div key={item} className="p-3 bg-amber-500/10 rounded-r-lg">
                                            <p className="font-bold text-sm text-amber-700">{label}</p>
                                            <p className="text-xs text-amber-700/80">{description}</p>
                                        </div>
                                     )
                                 })}
                                </div>
                             </div>
                           )}

                           {missingResource && (
                             <div className="space-y-3">
                                 <h4 className="font-semibold flex items-center gap-2 text-orange-600">
                                    <PackageX/> Recurso No Devuelto
                                 </h4>
                                <div className="pl-4 border-l-2 border-orange-500 space-y-3">
                                    <div className="p-3 bg-orange-500/10 rounded-r-lg">
                                        <p className="font-bold text-sm text-orange-700">Recurso Faltante</p>
                                        <p className="text-xs text-orange-700/80 mb-2">
                                            Este recurso no fue devuelto durante el proceso de devolución del préstamo.
                                        </p>
                                        <div className="text-xs text-orange-700/80 space-y-1">
                                            <p><strong>Fecha de reporte:</strong> {format(new Date(missingResource.reportDate), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                                            {missingResource.notes && (
                                                <p><strong>Notas:</strong> {missingResource.notes}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                             </div>
                           )}

                           {damageItems.length === 0 && suggestionItems.length === 0 && !missingResource && (
                                <p className="text-sm text-muted-foreground text-center py-4">No se reportaron incidencias para este recurso.</p>
                           )}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
