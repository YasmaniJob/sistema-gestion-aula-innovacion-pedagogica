'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar,
  User,
  Package,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Shield,
  Clock,
  Loader2,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { Loan, DamageReport, SuggestionReport } from '@/domain/types';
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
import { useSidebar } from '@/components/layout/sidebar-provider';

export default function ReturnLoanPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { loans, processReturn, isLoadingData } = useData();
  const { setPageTitle } = useSidebar();
  const loanId = params.loanId as string;

  const [loan, setLoan] = useState<Loan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resourcesReceived, setResourcesReceived] = useState<Record<string, boolean>>({});

  // Estados para formularios opcionales
  const [showDamageReport, setShowDamageReport] = useState(false);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [damageReports, setDamageReports] = useState<Record<string, DamageReport>>({});
  const [suggestionReports, setSuggestionReports] = useState<Record<string, SuggestionReport>>({});

  useEffect(() => {
    const foundLoan = loans.find(l => l.id === loanId);
    if (foundLoan) {
      setLoan(foundLoan);
    }
  }, [loanId, loans]);

  // Establecer el título de la página para el header móvil
  useEffect(() => {
    if (loan) {
      setPageTitle(`Registrar Devolución - ${loan.user.name}`);
    } else {
      setPageTitle('Registrar Devolución');
    }
  }, [loan, setPageTitle]);

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
  const receivedCount = Object.values(resourcesReceived).filter(Boolean).length;
  const progressPercentage = loan ? (receivedCount / loan.resources.length) * 100 : 0;

  if (isLoadingData || !loan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">
          {isLoadingData ? 'Cargando datos...' : 'Cargando información del préstamo...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto px-4 sm:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Panel Principal */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Información del Préstamo */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Información del Préstamo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Docente</p>
                      <p className="font-semibold">{loan.user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha del Préstamo</p>
                      <p className="font-semibold">
                        {loan.loanDate instanceof Date
                          ? loan.loanDate.toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : new Date(loan.loanDate).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de Devolución</p>
                      <p className="font-semibold">
                        {new Date().toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Recursos</p>
                      <p className="font-semibold">{loan.resources.length} recursos</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verificación de Recursos */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Verificación de Recursos
              </CardTitle>
              <CardDescription>
                Marca cada recurso conforme lo recibas para confirmar la devolución.
              </CardDescription>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progreso de Verificación</span>
                  <span className="text-sm text-muted-foreground">
                    {receivedCount} de {loan.resources.length} recursos
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {loan.resources.map(resource => {
                  const isReceived = resourcesReceived[resource.id] || false;
                  const isCharger = resource.name.toLowerCase().includes('cargador') ||
                                   resource.name.toLowerCase().includes('charger') ||
                                   resource.name.toLowerCase().includes('adaptador de corriente');

                  return (
                    <Card
                      key={resource.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md",
                        isReceived ? "bg-green-50 border-green-200" : "hover:bg-muted/50"
                      )}
                      onClick={() => handleResourceReceivedChange(resource.id, !isReceived)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-full",
                              isReceived ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
                            )}>
                              {isCharger ? (
                                <Zap className="h-4 w-4" />
                              ) : (
                                <Package className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className={cn(
                                "font-medium",
                                isReceived && "text-green-700"
                              )}>{resource.name}</p>
                              <p className={cn(
                                "text-sm text-muted-foreground",
                                isReceived && "text-green-600"
                              )}>{resource.brand}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isReceived && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                            <div className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                              isReceived
                                ? "bg-green-600 border-green-600"
                                : "border-muted-foreground hover:border-primary"
                            )}>
                              {isReceived && (
                                <CheckCircle className="h-4 w-4 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Acciones Opcionales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              showDamageReport && "ring-2 ring-destructive"
            )}
            onClick={() => setShowDamageReport(prev => !prev)}>
              <CardContent className="p-6 text-center">
                <div className={cn(
                  "w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center",
                  showDamageReport ? "bg-destructive text-destructive-foreground" : "bg-muted"
                )}>
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Reportar Daños</h3>
                <p className="text-sm text-muted-foreground">
                  Registra cualquier daño encontrado en los recursos
                </p>
                <div className="mt-4">
                  <Badge variant={showDamageReport ? "destructive" : "secondary"}>
                    {showDamageReport ? "Ocultar" : "Mostrar"} Formulario
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              showSuggestionForm && "ring-2 ring-amber-500"
            )}
            onClick={() => setShowSuggestionForm(prev => !prev)}>
              <CardContent className="p-6 text-center">
                <div className={cn(
                  "w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center",
                  showSuggestionForm ? "bg-amber-500 text-white" : "bg-muted"
                )}>
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Sugerencias</h3>
                <p className="text-sm text-muted-foreground">
                  Deja comentarios para mejorar el servicio
                </p>
                <div className="mt-4">
                  <Badge variant={showSuggestionForm ? "default" : "secondary"}>
                    {showSuggestionForm ? "Ocultar" : "Mostrar"} Formulario
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formularios Opcionales */}
          {showDamageReport && (
            <Card>
              <CardHeader>
                <CardTitle>Reporte de Daños</CardTitle>
                <CardDescription>
                  Selecciona los recursos dañados y describe los problemas encontrados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {loan.resources.map(resource => (
                    <DamageReportForm
                      key={resource.id}
                      resource={resource}
                      onReportChange={(report: DamageReport) => handleDamageReportChange(resource.id, report)}
                    />
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {showSuggestionForm && (
            <Card>
              <CardHeader>
                <CardTitle>Sugerencias y Comentarios</CardTitle>
                <CardDescription>
                  Comparte tus ideas para mejorar el mantenimiento y uso de los recursos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {loan.resources.map(resource => (
                    <SuggestionReportForm
                      key={resource.id}
                      resource={resource}
                      onReportChange={(report: SuggestionReport) => handleSuggestionReportChange(resource.id, report)}
                    />
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Panel Lateral - Resumen y Confirmación */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Resumen de Devolución</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Estado de Recursos */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Recursos Verificados
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Recibidos</span>
                    <Badge variant={receivedCount === loan.resources.length ? "default" : "secondary"}>
                      {receivedCount} de {loan.resources.length}
                    </Badge>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </div>

              <Separator />

              {/* Resumen de Reportes */}
              <div>
                <h4 className="font-medium mb-3">Reportes Adicionales</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4 text-destructive" />
                      Daños Reportados
                    </span>
                    <Badge variant={totalDamageReports > 0 ? "destructive" : "secondary"}>
                      {totalDamageReports}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-amber-500" />
                      Sugerencias
                    </span>
                    <Badge variant={totalSuggestionReports > 0 ? "default" : "secondary"}>
                      {totalSuggestionReports}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Recursos No Devueltos */}
              {loan.resources.some(resource => !resourcesReceived[resource.id]) && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-800">Recursos Pendientes</span>
                  </div>
                  <p className="text-sm text-amber-700 mb-2">
                    Los siguientes recursos no fueron marcados como recibidos:
                  </p>
                  <ul className="text-xs text-amber-600 space-y-1">
                    {loan.resources
                      .filter(resource => !resourcesReceived[resource.id])
                      .map(resource => (
                        <li key={resource.id}>• {resource.name}</li>
                      ))
                    }
                  </ul>
                  <p className="text-xs text-amber-600 mt-2 italic">
                    Se generará un reporte de incidencia automáticamente.
                  </p>
                </div>
              )}

              {/* Botón de Confirmación */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando Devolución...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirmar Devolución
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar Devolución?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p>Se registrará la devolución del préstamo de <strong>{loan.user.name}</strong>.</p>

                      <div className="bg-muted p-3 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Recursos recibidos:</span>
                          <span className="font-semibold">{receivedCount} de {loan.resources.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Daños reportados:</span>
                          <span className="font-semibold">{totalDamageReports}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Sugerencias:</span>
                          <span className="font-semibold">{totalSuggestionReports}</span>
                        </div>
                      </div>

                      {loan.resources.some(resource => !resourcesReceived[resource.id]) && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                          <p className="text-sm font-medium text-red-800 mb-1">
                            ⚠️ Recursos no recibidos:
                          </p>
                          <ul className="text-xs text-red-600 space-y-1">
                            {loan.resources
                              .filter(resource => !resourcesReceived[resource.id])
                              .map(resource => (
                                <li key={resource.id}>• {resource.name}</li>
                              ))
                            }
                          </ul>
                        </div>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmReturn}>
                      Sí, confirmar devolución
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
