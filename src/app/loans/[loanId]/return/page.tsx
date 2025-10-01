
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  ShieldAlert,
  MessageSquarePlus,
  User,
  Hash,
  Camera,
  Check,
  CheckCircle,
  XCircle,
  ChevronDown,
  Loader2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { Loan, DamageReport, SuggestionReport, Resource } from '@/domain/types';
import { cn } from '@/lib/utils';
import { Accordion } from '@/components/ui/accordion';
import { DamageReportForm } from '@/components/damage-report-form';
import { SuggestionReportForm } from '@/components/suggestion-report-form';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-provider-refactored';

export default function ReturnLoanPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { loans, processReturn, isLoadingData } = useData();
  const loanId = params.loanId as string;
  
  const [loan, setLoan] = useState<Loan | null>(null);
  const [formattedLoanDate, setFormattedLoanDate] = useState<string | null>(null);
  const [formattedReturnDate, setFormattedReturnDate] = useState<string | null>(null);
  const [damageReports, setDamageReports] = useState<Record<string, DamageReport>>({});
  
  const [showDamageReport, setShowDamageReport] = useState(false);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [suggestionReports, setSuggestionReports] = useState<Record<string, SuggestionReport>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resourcesReceived, setResourcesReceived] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    const foundLoan = loans.find(l => l.id === loanId);
    if (foundLoan) {
      setLoan(foundLoan);
    }
  }, [loanId, loans]);

  useEffect(() => {
    if (loan) {
      const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
      const loanDate = loan.loanDate instanceof Date ? loan.loanDate : new Date(loan.loanDate);
      if (loanDate instanceof Date && !isNaN(loanDate.getTime())) {
        setFormattedLoanDate(loanDate.toLocaleDateString('es-ES', options));
      } else {
        setFormattedLoanDate('Fecha inválida');
      }
      setFormattedReturnDate(new Date().toLocaleDateString('es-ES', options));
    }
  }, [loan]);

  const handleDamageReportChange = useCallback((resourceId: string, report: DamageReport) => {
    setDamageReports(prev => ({ ...prev, [resourceId]: report }));
  }, []);

  const handleSuggestionReportChange = useCallback((resourceId: string, report: SuggestionReport) => {
    setSuggestionReports(prev => ({ ...prev, [resourceId]: report }));
  }, []);

  const handleResourceReceivedChange = useCallback((resourceId: string, received: boolean) => {
    setResourcesReceived(prev => ({ ...prev, [resourceId]: received }));
  }, []);
  
  const handleConfirmReturn = () => {
    if (!loan) return;
    setIsSubmitting(true);
    
    // Generar reportes de recursos no devueltos
    const missingResources = loan.resources
      .filter(resource => !resourcesReceived[resource.id])
      .map(resource => ({
        resourceId: resource.id,
        resourceName: resource.name,
        resourceBrand: resource.brand,
        reportDate: new Date(),
        notes: `Recurso no devuelto durante el proceso de devolución del préstamo ${loan.id}`
      }));
    
    processReturn(loan.id, damageReports, suggestionReports, missingResources);

    setTimeout(() => {
      setIsSubmitting(false);
      const missingCount = missingResources.length;
      const receivedCount = Object.values(resourcesReceived).filter(Boolean).length;
      
      toast({
        title: '¡Devolución Procesada!',
        description: missingCount > 0 
          ? `${receivedCount} recursos recibidos, ${missingCount} recursos reportados como no devueltos.`
          : `La devolución para ${loan?.user.name} ha sido registrada correctamente.`,
        variant: missingCount > 0 ? 'destructive' : 'default',
      });
      router.push('/loans');
    }, 1000);
  };
  
  const totalDamageReports = Object.values(damageReports).filter(r => r.commonProblems.length > 0 || r.otherNotes.trim() !== '').length;
  const totalSuggestionReports = Object.values(suggestionReports).filter(r => r.commonSuggestions.length > 0 || r.otherNotes.trim() !== '').length;

  if (isLoadingData || !loan) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-4">{isLoadingData ? 'Cargando datos...' : 'Cargando préstamo...'}</p>
        </div>
    );
  }
  
  const showIncompleteMessage = validationStatus === 'incomplete' && dni.length > 0;
  
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Link href="/loans" className="hover:text-primary">
              Préstamos
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-primary">Devolver Préstamo</span>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold hidden sm:block">
        Registrar Devolución de: <span className="text-primary">{loan.user.name}</span>
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  variant={showDamageReport ? 'destructive' : 'outline'}
                  size="lg" 
                  onClick={() => setShowDamageReport(prev => !prev)}
                  disabled={isSubmitting}
                >
                    <ShieldAlert className="mr-2" />
                    Reportar Daños
                    <ChevronDown className={cn("ml-auto h-5 w-5 transition-transform", showDamageReport && "rotate-180")} />
                </Button>
                <Button
                  variant={showSuggestionForm ? 'secondary' : 'outline'}
                  size="lg"
                  onClick={() => setShowSuggestionForm(prev => !prev)}
                  className={cn(showSuggestionForm && 'bg-amber-500 text-white hover:bg-amber-500/90')}
                  disabled={isSubmitting}
                >
                  <MessageSquarePlus className="mr-2" />
                  Añadir Sugerencias
                  <ChevronDown className={cn("ml-auto h-5 w-5 transition-transform", showSuggestionForm && "rotate-180")} />
                </Button>
            </div>
            
            {showDamageReport && (
              <Card>
                <CardHeader>
                  <CardTitle>Seleccionar Recursos Dañados</CardTitle>
                  <CardDescription>
                    Expande cada recurso para añadir un reporte de daños.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {loan.resources.map(resource => (
                      <DamageReportForm 
                        key={resource.id}
                        resource={resource}
                        onReportChange={(report) => handleDamageReportChange(resource.id, report)}
                      />
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {showSuggestionForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Añadir Sugerencias por Recurso</CardTitle>
                  <CardDescription>
                    Deja sugerencias para el mantenimiento o mejora de cada recurso.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {loan.resources.map(resource => (
                      <SuggestionReportForm
                        key={resource.id}
                        resource={resource}
                        onReportChange={(report) => handleSuggestionReportChange(resource.id, report)}
                      />
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}

        </div>

        <div className="sticky top-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Préstamo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(isLoadingData || !loan) ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">{isLoadingData ? 'Cargando datos...' : 'Cargando información del préstamo...'}</span>
                </div>
              ) : (
                <>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Docente:</span>
                        <span className="font-semibold">{loan.user.name}</span>
                      </div>
                    </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Fecha Préstamo:</span>
                    <span className="font-semibold">
                      {formattedLoanDate || 'Cargando...'}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Fecha de Devolución:</span>
                    <span className="font-semibold">
                      {formattedReturnDate || 'Cargando...'}
                    </span>
                  </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        Verificación de Recursos ({loan.resources.length})
                    </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Marca cada recurso conforme lo recibas para confirmar la devolución.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {loan.resources.map(resource => {
                    const isReceived = resourcesReceived[resource.id] || false;
                    // Determinar el icono según el tipo de recurso
                    const isCharger = resource.name.toLowerCase().includes('cargador') || 
                                     resource.name.toLowerCase().includes('charger') ||
                                     resource.name.toLowerCase().includes('adaptador de corriente');
                    const ResourceIcon = isCharger ? Zap : Camera;
                    
                    return (
                      <div 
                        key={resource.id} 
                        className={cn(
                          "flex items-center justify-between p-2 rounded-md transition-colors cursor-pointer",
                          isReceived ? "bg-green-50 border border-green-200" : "bg-muted/50 hover:bg-muted/70"
                        )}
                        onClick={() => handleResourceReceivedChange(resource.id, !isReceived)}
                      >
                        <div className="flex items-center gap-2">
                          <ResourceIcon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className={cn(
                              "text-sm font-medium",
                              isReceived && "text-green-700"
                            )}>{resource.name}</p>
                            <p className={cn(
                              "text-xs text-muted-foreground",
                              isReceived && "text-green-600"
                            )}>{resource.brand}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isReceived && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          <Checkbox
                            checked={isReceived}
                            onCheckedChange={(checked) => 
                              handleResourceReceivedChange(resource.id, checked as boolean)
                            }
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {loan.resources.length > 0 && (
                  <div className="mt-3 p-2 rounded-md bg-blue-50 border border-blue-200">
                    <p className="text-xs text-blue-700 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {Object.values(resourcesReceived).filter(Boolean).length} de {loan.resources.length} recursos verificados
                    </p>
                    </div>
                  )}
                  </div>
                  <Separator />
                  <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button size="lg" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2"/>
                                Confirmar Devolución
                            </>
                        )}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar Devolución?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se registrará la devolución para <strong>{loan.user.name}</strong>. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="text-sm text-muted-foreground">
                        <ul className='list-disc pl-5 mt-2 space-y-1'>
                            <li><strong>{Object.values(resourcesReceived).filter(Boolean).length}</strong> de <strong>{loan.resources.length}</strong> recursos verificados como recibidos.</li>
                            <li><strong>{totalDamageReports}</strong> {totalDamageReports === 1 ? 'recurso reportado' : 'recursos reportados'} con daños.</li>
                            <li><strong>{totalSuggestionReports}</strong> {totalSuggestionReports === 1 ? 'recurso con' : 'recursos con'} sugerencias.</li>
                        </ul>
                        {loan.resources.some(resource => !resourcesReceived[resource.id]) && (
                            <div className="mt-3 p-2 rounded-md bg-red-50 border border-red-200">
                                <p className="text-sm text-red-700 font-medium mb-1">⚠️ Recursos no recibidos:</p>
                                <ul className="text-xs text-red-600 space-y-1">
                                    {loan.resources
                                        .filter(resource => !resourcesReceived[resource.id])
                                        .map(resource => (
                                            <li key={resource.id}>• {resource.name} ({resource.brand})</li>
                                        ))
                                    }
                                </ul>
                                <p className="text-xs text-red-600 mt-2 italic">
                                    Estos recursos se registrarán como no devueltos y se generará un reporte de incidencia.
                                </p>
                            </div>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmReturn}>
                            Sí, confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
