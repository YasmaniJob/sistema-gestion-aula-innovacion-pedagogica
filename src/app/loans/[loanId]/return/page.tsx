
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar,
  User,
  Package,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Shield,
  Loader2,
  Zap,
  Info,
  TrendingUp,
  Timer,
  CheckSquare,
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
      setPageTitle('Registrar Devolución');
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

  // Calcular estadísticas adicionales para enriquecer la información
  const loanDuration = loan ? Math.ceil((new Date().getTime() - new Date(loan.loanDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const overdueDays = loan?.returnDate && new Date() > new Date(loan.returnDate)
    ? Math.ceil((new Date().getTime() - new Date(loan.returnDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

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
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-0">
      {/* Título principal */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">
          <span className="sm:hidden">Devolución</span>
          <span className="hidden sm:inline">Registrar Devolución de:</span>
          <br className="sm:hidden" />
          <span className="text-primary block sm:inline"> {loan.user.name}</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Proceso de devolución de recursos educativos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* Panel Principal - Izquierda */}
        <div className="lg:col-span-3 space-y-6">

          {/* Información del Préstamo - Más compacta y visual */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 order-1">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-blue-900 text-lg sm:text-xl">
                <Info className="h-5 w-5" />
                Información del Préstamo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground">Docente</p>
                      <p className="font-semibold text-blue-900 text-sm sm:text-base truncate">{loan.user.name}</p>
                      <p className="text-xs text-muted-foreground">{loan.user.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Propósito</p>
                      <p className="font-semibold capitalize text-sm sm:text-base">
                        {loan.purpose === 'aprendizaje' ? 'Actividad de Aprendizaje' : 'Uso Institucional'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground">Fecha del Préstamo</p>
                      <p className="font-semibold text-sm sm:text-base">
                        {loan.loanDate instanceof Date
                          ? loan.loanDate.toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                          : new Date(loan.loanDate).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <Timer className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Duración</p>
                      <p className="font-semibold text-sm sm:text-base">{loanDuration} días</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-full">
                      <Package className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Total de Recursos</p>
                      <p className="font-semibold text-lg sm:text-xl">{loan.resources.length} recursos</p>
                    </div>
                  </div>
                  {loan.purposeDetails && (
                    <div className="mt-2 p-2 bg-white/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Detalles:</p>
                      <div className="text-sm font-medium">
                        {/* Lógica simplificada: mostrar información más completa disponible */}
                        {loan.purposeDetails.area && loan.purposeDetails.grade && loan.purposeDetails.section ? (
                          <div className="text-primary font-semibold">{loan.purposeDetails.area}</div>
                        ) : loan.purposeDetails.area ? (
                          <div>{loan.purposeDetails.area}</div>
                        ) : loan.purposeDetails.grade && loan.purposeDetails.section ? (
                          <div className="text-primary font-semibold">
                            {loan.purposeDetails.grade}{loan.purposeDetails.section}
                          </div>
                        ) : null}

                        {loan.purposeDetails.activityName && (
                          <div className="text-muted-foreground">{loan.purposeDetails.activityName}</div>
                        )}

                        {!loan.purposeDetails.area && !loan.purposeDetails.grade && !loan.purposeDetails.activityName && (
                          <div className="text-muted-foreground">Sin detalles específicos</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas rápidas - Eliminadas por ser gasto hormiga */}

          {/* Verificación de Recursos - Mejorada */}
          <Card className="order-2">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CheckCircle className="h-5 w-5" />
                Verificación de Recursos
              </CardTitle>
              <CardDescription className="text-sm">
                Marca cada recurso conforme lo recibas para confirmar la devolución.
              </CardDescription>
              <div className="mt-3 sm:mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progreso de Verificación</span>
                  <Badge variant={progressPercentage === 100 ? "default" : "secondary"} className="text-xs">
                    {Math.round(progressPercentage)}% completado
                  </Badge>
                </div>
                <Progress value={progressPercentage} className="h-2 sm:h-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  {receivedCount} de {loan.resources.length} recursos verificados
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {loan.resources.map(resource => {
                  const isReceived = resourcesReceived[resource.id] || false;
                  const isCharger = resource.name.toLowerCase().includes('cargador') ||
                                   resource.name.toLowerCase().includes('charger') ||
                                   resource.name.toLowerCase().includes('adaptador de corriente');

                  return (
                    <Card
                      key={resource.id}
                      className={cn(
                        "cursor-pointer transition-all duration-300 hover:shadow-lg border-2 active:scale-95",
                        isReceived
                          ? "bg-green-50 border-green-200 shadow-green-100"
                          : "hover:bg-muted/50 hover:border-primary/50"
                      )}
                      onClick={() => handleResourceReceivedChange(resource.id, !isReceived)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={cn(
                              "p-2 sm:p-3 rounded-full transition-colors flex-shrink-0",
                              isReceived ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
                            )}>
                              {isCharger ? (
                                <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                              ) : (
                                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={cn(
                                "font-medium transition-colors truncate",
                                isReceived && "text-green-700"
                              )}>{resource.name}</p>
                              <p className={cn(
                                "text-xs sm:text-sm text-muted-foreground transition-colors",
                                isReceived && "text-green-600"
                              )}>{resource.brand}</p>
                              {isReceived && (
                                <div className="flex items-center gap-1 mt-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span className="text-xs text-green-600 font-medium">Verificado</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className={cn(
                              "w-8 h-8 sm:w-10 sm:h-10 rounded-full border-3 flex items-center justify-center transition-all",
                              isReceived
                                ? "bg-green-600 border-green-600 shadow-lg scale-110"
                                : "border-muted-foreground hover:border-primary hover:scale-105"
                            )}>
                              {isReceived && (
                                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
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

          {/* Acciones Opcionales - Más atractivas */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 order-3">
            <Card className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-sm border hover:border-gray-200",
              showDamageReport && "bg-gray-25 border-gray-200"
            )}
            onClick={() => setShowDamageReport(prev => !prev)}>
              <CardContent className="p-3 sm:p-4 text-center">
                <div className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-full mx-auto mb-2 flex items-center justify-center",
                  showDamageReport ? "bg-gray-100 text-gray-600" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                )}>
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="font-medium mb-1 text-xs sm:text-sm text-gray-700">Reportar Daños</h3>
                <p className="text-xs text-gray-500 mb-2">
                  Registra problemas
                </p>
                <Badge variant={showDamageReport ? "default" : "secondary"} className="px-1.5 py-0.5 text-xs">
                  {showDamageReport ? "Ocultar" : "Mostrar"}
                </Badge>
                {totalDamageReports > 0 && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {totalDamageReports}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-sm border hover:border-gray-200",
              showSuggestionForm && "bg-gray-25 border-gray-200"
            )}
            onClick={() => setShowSuggestionForm(prev => !prev)}>
              <CardContent className="p-3 sm:p-4 text-center">
                <div className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-full mx-auto mb-2 flex items-center justify-center",
                  showSuggestionForm ? "bg-gray-100 text-gray-600" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                )}>
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="font-medium mb-1 text-xs sm:text-sm text-gray-700">Sugerencias</h3>
                <p className="text-xs text-gray-500 mb-2">
                  Deja comentarios
                </p>
                <Badge variant={showSuggestionForm ? "default" : "secondary"} className="px-1.5 py-0.5 text-xs">
                  {showSuggestionForm ? "Ocultar" : "Mostrar"}
                </Badge>
                {totalSuggestionReports > 0 && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {totalSuggestionReports}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Formularios Opcionales */}
          {showDamageReport && (
            <Card className="order-4">
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
            <Card className="order-5">
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
        <div className="order-6 lg:order-last">
          <Card className="sticky top-4 lg:top-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CheckCircle className="h-5 w-5" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Estado de Recursos */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Package className="h-4 w-4" />
                  Recursos Verificados
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm">Recibidos</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm sm:text-base">{receivedCount}</span>
                      <Badge variant={receivedCount === loan.resources.length ? "default" : "secondary"} className="text-xs">
                        {Math.round(progressPercentage)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </div>

              <Separator />

              {/* Resumen de Reportes */}
              <div>
                <h4 className="font-medium mb-3 text-sm sm:text-base">Reportes Adicionales</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm flex items-center gap-2">
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                      Daños Reportados
                    </span>
                    <Badge variant={totalDamageReports > 0 ? "destructive" : "secondary"} className="text-xs">
                      {totalDamageReports}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm flex items-center gap-2">
                      <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                      Sugerencias
                    </span>
                    <Badge variant={totalSuggestionReports > 0 ? "default" : "secondary"} className="text-xs">
                      {totalSuggestionReports}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Recursos No Devueltos */}
              {loan.resources.some(resource => !resourcesReceived[resource.id]) && (
                <div className="p-3 sm:p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-800 text-sm">Pendientes</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-700 mb-2">
                    Recursos no marcados como recibidos:
                  </p>
                  <ul className="text-xs text-amber-600 space-y-1">
                    {loan.resources
                      .filter(resource => !resourcesReceived[resource.id])
                      .map(resource => (
                        <li key={resource.id}>• {resource.name}</li>
                      ))
                    }
                  </ul>
                </div>
              )}

              {/* Información adicional - Más compacta */}
              <div className="p-3 sm:p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2 text-sm">
                  <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                  Información
                </h4>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Estado:</span>
                    <Badge variant="outline" className="text-xs">
                      {loan.status === 'active' ? 'Activo' : loan.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">ID:</span>
                    <span className="font-mono text-xs text-blue-600">{loan.id.slice(-8)}</span>
                  </div>
                  {overdueDays > 0 && (
                    <div className="flex justify-between">
                      <span className="text-red-700">Vencido:</span>
                      <span className="font-semibold text-red-600 text-xs sm:text-sm">{overdueDays} días</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de Confirmación */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="lg"
                    className="w-full text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirmar Devolución
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-sm sm:max-w-md mx-4">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg sm:text-xl">¿Confirmar Devolución?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3 text-sm sm:text-base">
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
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmReturn} className="w-full sm:w-auto">
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
