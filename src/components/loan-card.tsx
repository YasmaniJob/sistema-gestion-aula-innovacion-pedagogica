

'use client';

import type { Loan, Resource } from '@/domain/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  GraduationCap,
  Calendar,
  Camera,
  Building,
  RotateCcw,
  TriangleAlert,
  ShieldAlert,
  MessageSquarePlus,
  CheckCircle,
  Clock,
  XCircle,
  Zap,
  PackageX,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, isBefore, startOfDay, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

type LoanCardProps = {
  loan: Loan;
  isTeacherContext?: boolean;
  onViewIncidents?: (loan: Loan, resource: Pick<Resource, 'id' | 'name' | 'brand'>) => void;
};

const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());

export function LoanCard({ loan, isTeacherContext = false, onViewIncidents }: LoanCardProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { isOverdue, overdueDays, formattedLoanDate, formattedReturnDate } = useMemo(() => {
    // Durante la hidratación del cliente, mostrar un placeholder en lugar de "Fecha inválida"
    if (!isClient) {
      return { isOverdue: false, overdueDays: 0, formattedLoanDate: 'Cargando...', formattedReturnDate: null };
    }
    
    if (!isValidDate(loan.loanDate)) {
      return { isOverdue: false, overdueDays: 0, formattedLoanDate: 'Fecha inválida', formattedReturnDate: null };
    }

    let overdue = false;
    let days = 0;
    if (loan.status === 'active' && loan.returnDate && isValidDate(loan.returnDate)) {
      const today = startOfDay(new Date());
      const returnDay = startOfDay(loan.returnDate);
      overdue = isBefore(returnDay, today);
      if (overdue) {
        days = differenceInDays(today, returnDay);
      }
    }
    
    // Formatear fecha de devolución para todos los préstamos que tengan una fecha válida
    const returnDate = isValidDate(loan.returnDate) ? loan.returnDate : null;

    return {
      isOverdue: overdue,
      overdueDays: days,
      formattedLoanDate: format(loan.loanDate, "dd MMM yyyy, h:mm:ss a", { locale: es }),
      formattedReturnDate: returnDate ? format(returnDate, "dd MMM yyyy, h:mm:ss a", { locale: es }) : null,
    };
  }, [isClient, loan]);

  const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  };
  
  const purposeDetails =
    loan.purpose === 'aprendizaje' && loan.purposeDetails ? (
      <>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span>{loan.purposeDetails.area}</span>
        </div>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          <span>
            {loan.purposeDetails.grade} "{loan.purposeDetails.section}"
          </span>
        </div>
      </>
    ) : (
      <div className="flex items-center gap-2">
        <Building className="h-4 w-4" />
        <span>{loan.purposeDetails?.activityName || 'Uso Institucional'}</span>
      </div>
    );

  const hasDamageReports = (resourceId: string) => {
    const report = loan.damageReports?.[resourceId];
    return report && (report.commonProblems.length > 0 || (report.otherNotes || '').trim() !== '');
  };

  const hasSuggestionReports = (resourceId: string) => {
    const report = loan.suggestionReports?.[resourceId];
    return report && (report.commonSuggestions.length > 0 || (report.otherNotes || '').trim() !== '');
  };

  const hasMissingResources = (resourceId: string) => {
    return loan.missingResources?.some(missing => missing.resourceId === resourceId) || false;
  };

  const statusBadge = () => {
    switch (loan.status) {
      case 'returned':
        return (
          <Badge variant="secondary" className="gap-1.5 bg-green-100 text-green-700 border border-green-200">
            <CheckCircle className="h-3 w-3" />
            Devuelto: {formattedReturnDate || 'Sin fecha'}
          </Badge>
        );
      case 'pending':
        return (
           <Badge variant="secondary" className="gap-1.5 bg-yellow-100 text-yellow-800 border border-yellow-200">
                <Clock className="h-3 w-3" />
                Pendiente de Aprobación
            </Badge>
        );
      case 'rejected':
        return (
            <Badge variant="destructive" className="gap-1.5">
                <XCircle className="h-3 w-3" />
                Solicitud Rechazada
            </Badge>
        );
      case 'active':
        return isTeacherContext ? (
            <Badge variant="secondary" className="gap-1.5 bg-blue-100 text-blue-700 border border-blue-200">
                <CheckCircle className="h-3 w-3" />
                Aprobado
            </Badge>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <Card className={cn(
        "w-full transition-all relative", 
        isOverdue && "border-destructive/50 bg-destructive/5 border-l-4"
    )}>
       {(loan.status !== 'active' || isTeacherContext) && (
            <div className="absolute top-4 right-4">
                {statusBadge()}
            </div>
        )}
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-start">
           {!isTeacherContext && (
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarFallback>{getInitials(loan.user?.name || 'Usuario')}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{loan.user?.name || 'Usuario Desconocido'}</p>
                        <p className="text-sm text-muted-foreground">{loan.user?.role || 'Rol no especificado'}</p>
                    </div>
                </div>
            )}
          {loan.status === 'active' && !isTeacherContext && (
            <Button asChild variant={isOverdue ? 'destructive' : 'default'}>
              <Link href={`/loans/${loan.id}/return`}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {isOverdue ? 'Registrar Devolución (Vencido)' : 'Devolver'}
              </Link>
            </Button>
          )}
        </div>
        <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground", !isTeacherContext && "pt-0")}>
          {purposeDetails}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className={cn(isOverdue && 'font-bold text-destructive')}>
              {formattedLoanDate}
            </span>
          </div>
           {isOverdue && (
            <Badge variant="destructive" className="gap-1.5">
                <TriangleAlert className="h-3 w-3" />
                Vencido ({overdueDays} {overdueDays === 1 ? 'día' : 'días'})
            </Badge>
          )}
        </div>
        <Separator />
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Recursos ({loan.resources.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {(() => {
              // Separar recursos principales de accesorios y opciones inteligentes
              const mainResources = loan.resources.filter(resource => {
                // Excluir opciones inteligentes identificadas por ID sintético
                if (resource.id && resource.id.startsWith('smart-')) {
                  return false;
                }
                
                // Excluir accesorios identificados por nombre
                return resource.name && (
                  !resource.name.toLowerCase().includes('cargador') && 
                  !resource.name.toLowerCase().includes('charger') &&
                  !resource.name.toLowerCase().includes('adaptador de corriente') &&
                  !resource.name.toLowerCase().includes('mouse') &&
                  !resource.name.toLowerCase().includes('mochila') &&
                  !resource.name.toLowerCase().includes('stylus') &&
                  !resource.name.toLowerCase().includes('apple pencil') &&
                  !resource.name.toLowerCase().includes('teclado') &&
                  !resource.name.toLowerCase().includes('keyboard')
                );
              });
              
              // Identificar opciones inteligentes comunes
              const smartAccessories = loan.resources.filter(resource => {
                // Identificar por ID sintético (opciones inteligentes seleccionadas)
                if (resource.id && resource.id.startsWith('smart-')) {
                  return true;
                }
                
                // Identificar por nombre (compatibilidad con recursos existentes)
                if (!resource.name) return false;
                const name = resource.name.toLowerCase();
                return name.includes('cargador') || name.includes('charger') ||
                       name.includes('adaptador de corriente') ||
                       name.includes('mouse') ||
                       name.includes('mochila') ||
                       name.includes('stylus') ||
                       name.includes('apple pencil') ||
                       name.includes('teclado') ||
                       name.includes('keyboard');
              });
              
              const chargers = smartAccessories.filter(resource => {
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
              
              const otherSmartAccessories = smartAccessories.filter(resource => {
                // Para opciones inteligentes por ID sintético
                if (resource.id && resource.id.startsWith('smart-') && resource.name) {
                  const name = resource.name.toLowerCase();
                  return !name.includes('cargador') && !name.includes('charger') && !name.includes('adaptador');
                }
                
                // Para accesorios identificados por nombre
                return resource.name && (
                  !resource.name.toLowerCase().includes('cargador') && 
                  !resource.name.toLowerCase().includes('charger') &&
                  !resource.name.toLowerCase().includes('adaptador de corriente')
                );
              });
              
              const elements = [];
              
              // Mostrar recursos principales
              mainResources.forEach((resource) => {
                const damages = hasDamageReports(resource.id);
                const suggestions = hasSuggestionReports(resource.id);
                const missing = hasMissingResources(resource.id);
                
                // Verificar si hay cargadores para este recurso principal
                const hasCharger = chargers.length > 0 && (
                  resource.category === 'Laptops' || resource.category === 'Tablets' ||
                  (resource.name && (resource.name.toLowerCase().includes('laptop') || resource.name.toLowerCase().includes('tablet')))
                );
                
                elements.push(
                  <Badge key={resource.id} variant="secondary" className="font-normal py-1 pr-3">
                    <Camera className="h-4 w-4 mr-2" />
                    {resource.name}
                    {(damages || suggestions || missing) && onViewIncidents && (
                        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border">
                            {damages && (
                                <button onClick={() => onViewIncidents(loan, resource)} aria-label="Ver reporte de daños">
                                  <ShieldAlert className="h-4 w-4 text-destructive" />
                                </button>
                            )}
                            {suggestions && (
                                 <button onClick={() => onViewIncidents(loan, resource)} aria-label="Ver reporte de sugerencias">
                                  <MessageSquarePlus className="h-4 w-4 text-amber-600" />
                                 </button>
                            )}
                            {missing && (
                                 <button onClick={() => onViewIncidents(loan, resource)} aria-label="Ver recursos faltantes">
                                  <PackageX className="h-4 w-4 text-orange-600" />
                                 </button>
                            )}
                        </div>
                    )}
                  </Badge>
                );
                
                // Agregar badge separado para el cargador si existe
                if (hasCharger) {
                  elements.push(
                    <Badge key={`${resource.id}-charger`} variant="secondary" className="font-normal py-1 pr-3">
                      <Zap className="h-4 w-4 mr-2" />
                      Cargador
                    </Badge>
                  );
                }
              });
              
              // Mostrar otras opciones inteligentes (mouse, mochila, stylus, etc.)
              otherSmartAccessories.forEach((accessory) => {
                const damages = hasDamageReports(accessory.id);
                const suggestions = hasSuggestionReports(accessory.id);
                const missing = hasMissingResources(accessory.id);
                
                elements.push(
                  <Badge key={accessory.id} variant="secondary" className="font-normal py-1 pr-3">
                    <Sparkles className="h-4 w-4 mr-2" />
                    {accessory.name}
                    {(damages || suggestions || missing) && onViewIncidents && (
                        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border">
                            {damages && (
                                <button onClick={() => onViewIncidents(loan, accessory)} aria-label="Ver reporte de daños">
                                  <ShieldAlert className="h-4 w-4 text-destructive" />
                                </button>
                            )}
                            {suggestions && (
                                 <button onClick={() => onViewIncidents(loan, accessory)} aria-label="Ver reporte de sugerencias">
                                  <MessageSquarePlus className="h-4 w-4 text-amber-600" />
                                 </button>
                            )}
                            {missing && (
                                 <button onClick={() => onViewIncidents(loan, accessory)} aria-label="Ver recursos faltantes">
                                  <PackageX className="h-4 w-4 text-orange-600" />
                                 </button>
                            )}
                        </div>
                    )}
                  </Badge>
                );
              });
              
              // Mostrar cargadores independientes (que no están asociados a laptops/tablets)
              chargers.forEach((charger) => {
                const hasMainResource = mainResources.some(resource => 
                  resource.category === 'Laptops' || resource.category === 'Tablets' ||
                  (resource.name && (resource.name.toLowerCase().includes('laptop') || resource.name.toLowerCase().includes('tablet')))
                );
                
                // Solo mostrar cargadores independientes si no hay recursos principales que los incluyan
                if (!hasMainResource) {
                  const damages = hasDamageReports(charger.id);
                  const suggestions = hasSuggestionReports(charger.id);
                  const missing = hasMissingResources(charger.id);
                  
                  elements.push(
                    <Badge key={charger.id} variant="secondary" className="font-normal py-1 pr-3">
                      <Zap className="h-4 w-4 mr-2" />
                      {charger.name}
                      {(damages || suggestions || missing) && onViewIncidents && (
                          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border">
                              {damages && (
                                  <button onClick={() => onViewIncidents(loan, charger)} aria-label="Ver reporte de daños">
                                    <ShieldAlert className="h-4 w-4 text-destructive" />
                                  </button>
                              )}
                              {suggestions && (
                                   <button onClick={() => onViewIncidents(loan, charger)} aria-label="Ver reporte de sugerencias">
                                    <MessageSquarePlus className="h-4 w-4 text-amber-600" />
                                   </button>
                              )}
                              {missing && (
                                   <button onClick={() => onViewIncidents(loan, charger)} aria-label="Ver recursos faltantes">
                                    <PackageX className="h-4 w-4 text-orange-600" />
                                   </button>
                              )}
                          </div>
                      )}
                    </Badge>
                  );
                }
              });
              
              return elements;
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

