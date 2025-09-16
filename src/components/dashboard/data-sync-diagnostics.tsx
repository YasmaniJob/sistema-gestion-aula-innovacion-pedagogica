'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, RefreshCw, Info, Users, Package, BookOpen, Calendar, Clock, Wifi, WifiOff } from 'lucide-react';
import { diagnoseDashboardData } from '@/utils/dashboard-diagnostics';
import { LoanUser, Resource, Loan, Reservation, Meeting } from '@/domain/types';

interface DataSyncDiagnosticsProps {
  users: LoanUser[];
  resources: Resource[];
  loans: Loan[];
  reservations: Reservation[];
  meetings: Meeting[];
  isLoadingData: boolean;
  onRefresh?: () => Promise<void>;
  refreshResources?: () => Promise<void>;
  refreshLoans?: () => Promise<void>;
  refreshReservations?: () => Promise<void>;
}

export function DataSyncDiagnostics({
  users,
  resources,
  loans,
  reservations,
  meetings,
  isLoadingData,
  onRefresh,
  refreshResources,
  refreshLoans,
  refreshReservations
}: DataSyncDiagnosticsProps) {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [apiStatus, setApiStatus] = useState<Record<string, boolean>>({});
  const [isCheckingAPIs, setIsCheckingAPIs] = useState(false);
  
  const diagnostics = diagnoseDashboardData({
    users,
    resources,
    loans,
    reservations,
    meetings,
    isLoadingData
  });
  
  // Verificar estado de APIs
  const checkAPIStatus = async () => {
    setIsCheckingAPIs(true);
    const endpoints = [
      { name: 'users', url: '/api/users' },
      { name: 'resources', url: '/api/resources' },
      { name: 'loans', url: '/api/loans' },
      { name: 'reservations', url: '/api/reservations' },
      { name: 'meetings', url: '/api/meetings' }
    ];
    
    const status: Record<string, boolean> = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url);
        status[endpoint.name] = response.ok;
      } catch (error) {
        status[endpoint.name] = false;
      }
    }
    
    setApiStatus(status);
    setIsCheckingAPIs(false);
  };
  
  // Verificar APIs al montar el componente
  useEffect(() => {
    checkAPIStatus();
    const interval = setInterval(checkAPIStatus, 60000); // Cada minuto
    return () => clearInterval(interval);
  }, []);
  
  const handleRefresh = async (type: 'all' | 'resources' | 'loans' | 'reservations') => {
    try {
      switch (type) {
        case 'all':
          if (onRefresh) await onRefresh();
          break;
        case 'resources':
          if (refreshResources) await refreshResources();
          break;
        case 'loans':
          if (refreshLoans) await refreshLoans();
          break;
        case 'reservations':
          if (refreshReservations) await refreshReservations();
          break;
      }
      setLastRefresh(new Date());
    } catch (error) {
      console.error(`Error al recargar ${type}:`, error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (isLoadingData) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Estado de Sincronización
          </CardTitle>
          <CardDescription>
            Cargando datos del sistema...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (diagnostics.length === 0) {
    return (
      <Card className="mb-6 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            Sincronización Correcta
          </CardTitle>
          <CardDescription className="text-green-600">
            Todos los datos se están sincronizando correctamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-lg">{users.length}</div>
              <div className="text-muted-foreground">Usuarios</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">{resources.length}</div>
              <div className="text-muted-foreground">Recursos</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">{loans.length}</div>
              <div className="text-muted-foreground">Préstamos</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">{reservations.length}</div>
              <div className="text-muted-foreground">Reservas</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">{meetings.length}</div>
              <div className="text-muted-foreground">Reuniones</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const highSeverityIssues = diagnostics.filter(d => d.severity === 'high').length;
  const mediumSeverityIssues = diagnostics.filter(d => d.severity === 'medium').length;
  const lowSeverityIssues = diagnostics.filter(d => d.severity === 'low').length;

  return (
    <Card className="mb-6 border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          Problemas de Sincronización Detectados
        </CardTitle>
        <CardDescription className="text-red-600">
          Se encontraron {diagnostics.length} problemas que pueden afectar la visualización de datos.
        </CardDescription>
        <div className="flex gap-2 mt-2">
          {highSeverityIssues > 0 && (
            <Badge variant="destructive">
              {highSeverityIssues} Críticos
            </Badge>
          )}
          {mediumSeverityIssues > 0 && (
            <Badge variant="secondary">
              {mediumSeverityIssues} Moderados
            </Badge>
          )}
          {lowSeverityIssues > 0 && (
            <Badge variant="outline">
              {lowSeverityIssues} Menores
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {diagnostics.map((diagnostic, index) => (
          <Alert key={index} variant={diagnostic.severity === 'high' ? 'destructive' : 'default'}>
            <div className="flex items-start gap-3">
              {getSeverityIcon(diagnostic.severity)}
              <div className="flex-1">
                <AlertTitle className="text-sm font-medium">
                  [{diagnostic.component}] {diagnostic.issue}
                </AlertTitle>
                <AlertDescription className="text-sm mt-1">
                  💡 {diagnostic.suggestion}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}
        
        <div className="pt-4 border-t space-y-3">
          <div className="flex flex-wrap gap-2">
            {onRefresh && (
              <Button 
                onClick={() => handleRefresh('all')} 
                variant="outline" 
                size="sm"
                disabled={isLoadingData}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingData ? 'animate-spin' : ''}`} />
                {isLoadingData ? 'Recargando...' : 'Recargar Todo'}
              </Button>
            )}
            {refreshResources && (
              <Button 
                onClick={() => handleRefresh('resources')} 
                variant="outline" 
                size="sm"
                disabled={isLoadingData}
              >
                <Package className="h-4 w-4 mr-2" />
                Recursos
              </Button>
            )}
            {refreshLoans && (
              <Button 
                onClick={() => handleRefresh('loans')} 
                variant="outline" 
                size="sm"
                disabled={isLoadingData}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Préstamos
              </Button>
            )}
            {refreshReservations && (
              <Button 
                onClick={() => handleRefresh('reservations')} 
                variant="outline" 
                size="sm"
                disabled={isLoadingData}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Reservas
              </Button>
            )}
          </div>
          
          {/* Estado de APIs */}
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-2 mb-2">
              {isCheckingAPIs ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Wifi className="h-3 w-3" />
              )}
              Estado de APIs:
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(apiStatus).map(([endpoint, status]) => (
                <div key={endpoint} className="flex items-center gap-1">
                  {status ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-red-500" />
                  )}
                  <span className={status ? 'text-green-600' : 'text-red-600'}>
                    {endpoint}
                  </span>
                </div>
              ))}
            </div>
            {lastRefresh && (
              <div className="mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Última actualización: {lastRefresh.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DataSyncDiagnostics;