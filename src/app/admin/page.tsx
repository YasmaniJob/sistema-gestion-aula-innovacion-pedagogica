'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [inconsistencies, setInconsistencies] = useState<any>(null);
  const [lastFixResult, setLastFixResult] = useState<any>(null);
  const { toast } = useToast();

  const diagnose = async () => {
    setIsLoading(true);
    try {
      // Importar dinámicamente para evitar problemas de tipos
      const { diagnoseInconsistencies } = await import('@/services/loan.service');
      const result = await diagnoseInconsistencies();
      setInconsistencies(result);
      setLastFixResult(null);

      toast({
        title: "Diagnóstico completado",
        description: `Encontradas ${result.totalInconsistencies} inconsistencias.`,
      });
    } catch (error: any) {
      console.error('Error en diagnóstico:', error);
      toast({
        title: "Error en diagnóstico",
        description: error.message || "Error desconocido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fixInconsistencies = async () => {
    if (!inconsistencies || inconsistencies.totalInconsistencies === 0) {
      toast({
        title: "No hay inconsistencias",
        description: "Ejecuta primero el diagnóstico para encontrar inconsistencias.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Importar dinámicamente para evitar problemas de tipos
      const { fixInconsistencies: fixFn } = await import('@/services/loan.service');
      const result = await fixFn();
      setLastFixResult(result);

      toast({
        title: "Corrección completada",
        description: `Corregidas ${result.totalFixed} inconsistencias.`,
      });

      // Volver a ejecutar diagnóstico para verificar
      await diagnose();
    } catch (error: any) {
      console.error('Error en corrección:', error);
      toast({
        title: "Error en corrección",
        description: error.message || "Error desconocido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Administración del Sistema</h1>
        <p className="text-muted-foreground">
          Herramientas para diagnosticar y corregir inconsistencias en la base de datos
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Diagnóstico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Diagnóstico de Inconsistencias
            </CardTitle>
            <CardDescription>
              Analiza la base de datos en busca de inconsistencias entre préstamos y recursos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={diagnose}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                'Ejecutar Diagnóstico'
              )}
            </Button>

            {inconsistencies && (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">
                        Total de inconsistencias encontradas: {inconsistencies.totalInconsistencies}
                      </p>

                      {inconsistencies.prestamosActivosSinRecursosPrestados.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-orange-600">
                            Préstamos activos con recursos no marcados como prestados:
                          </p>
                          <div className="space-y-1 mt-1">
                            {inconsistencies.prestamosActivosSinRecursosPrestados.map((issue: any, idx: number) => (
                              <div key={idx} className="text-xs bg-orange-50 p-2 rounded">
                                <p><strong>Préstamo:</strong> {issue.loanId}</p>
                                <p><strong>Usuario:</strong> {issue.loanUser?.name || 'Usuario desconocido'}</p>
                                <p><strong>Recursos afectados:</strong> {issue.recursosNoPrestados.length}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {inconsistencies.recursosPrestadosSinPrestamosActivos.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-red-600">
                            Recursos marcados como prestados sin préstamos activos:
                          </p>
                          <div className="space-y-1 mt-1">
                            {inconsistencies.recursosPrestadosSinPrestamosActivos.map((issue: any, idx: number) => (
                              <div key={idx} className="text-xs bg-red-50 p-2 rounded">
                                <p><strong>Recurso:</strong> {issue.resourceName}</p>
                                <p><strong>Categoría:</strong> {issue.category || 'Sin categoría'}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Corrección */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Corrección de Inconsistencias
            </CardTitle>
            <CardDescription>
              Corrige automáticamente las inconsistencias encontradas en la base de datos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={fixInconsistencies}
              disabled={isLoading || !inconsistencies || inconsistencies.totalInconsistencies === 0}
              variant="destructive"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Corrigiendo...
                </>
              ) : (
                'Corregir Inconsistencias'
              )}
            </Button>

            {lastFixResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-green-600">
                      Corrección completada exitosamente
                    </p>
                    <div className="text-sm space-y-1">
                      <p><strong>Recursos corregidos:</strong> {lastFixResult.recursosCorregidos}</p>
                      {lastFixResult.errors.length > 0 && (
                        <div>
                          <p className="font-medium text-red-600">Errores encontrados:</p>
                          <div className="space-y-1 mt-1">
                            {lastFixResult.errors.map((error: string, idx: number) => (
                              <p key={idx} className="text-xs bg-red-50 p-1 rounded">{error}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {inconsistencies?.totalInconsistencies === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold text-green-600">
              ¡Excelente! No se encontraron inconsistencias en la base de datos.
            </p>
            <p className="text-sm">
              Todos los préstamos y recursos están correctamente sincronizados.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
