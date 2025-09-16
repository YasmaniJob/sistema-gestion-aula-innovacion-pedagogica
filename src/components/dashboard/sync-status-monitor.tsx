'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle, Wifi } from 'lucide-react';

interface SyncStatusMonitorProps {
  isLoadingData: boolean;
}

interface APIEndpoint {
  name: string;
  url: string;
  status: 'success' | 'error' | 'loading' | 'unknown';
  lastChecked?: Date;
  responseTime?: number;
  errorMessage?: string;
}

export default function SyncStatusMonitor({ isLoadingData }: SyncStatusMonitorProps) {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([
    { name: 'Usuarios', url: '/api/users', status: 'unknown' },
    { name: 'Recursos', url: '/api/resources', status: 'unknown' },
    { name: 'Préstamos', url: '/api/loans', status: 'unknown' },
    { name: 'Reservas', url: '/api/reservations', status: 'unknown' },
    { name: 'Reuniones', url: '/api/meetings', status: 'unknown' },
    { name: 'Categorías', url: '/api/categories', status: 'unknown' },
    { name: 'Áreas', url: '/api/areas', status: 'unknown' },
    { name: 'Grados', url: '/api/grades', status: 'unknown' }
  ]);
  
  const [isChecking, setIsChecking] = useState(false);
  const [lastFullCheck, setLastFullCheck] = useState<Date | null>(null);

  const checkEndpoint = async (endpoint: APIEndpoint): Promise<APIEndpoint> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        return {
          ...endpoint,
          status: 'success',
          lastChecked: new Date(),
          responseTime,
          errorMessage: undefined
        };
      } else {
        return {
          ...endpoint,
          status: 'error',
          lastChecked: new Date(),
          responseTime,
          errorMessage: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        ...endpoint,
        status: 'error',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  const checkAllEndpoints = async () => {
    setIsChecking(true);
    
    try {
      const updatedEndpoints = await Promise.all(
        endpoints.map(endpoint => checkEndpoint(endpoint))
      );
      
      setEndpoints(updatedEndpoints);
      setLastFullCheck(new Date());
    } catch (error) {
      console.error('Error checking endpoints:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Verificación automática al montar y cada 2 minutos
  useEffect(() => {
    checkAllEndpoints();
    const interval = setInterval(checkAllEndpoints, 120000); // 2 minutos
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: APIEndpoint['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'loading':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: APIEndpoint['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'loading':
        return <Badge variant="secondary">Verificando...</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const successCount = endpoints.filter(e => e.status === 'success').length;
  const errorCount = endpoints.filter(e => e.status === 'error').length;
  const avgResponseTime = endpoints
    .filter(e => e.responseTime)
    .reduce((acc, e) => acc + (e.responseTime || 0), 0) / endpoints.filter(e => e.responseTime).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Monitor de Sincronización
            </CardTitle>
            <CardDescription>
              Estado en tiempo real de las APIs del sistema
            </CardDescription>
          </div>
          <Button
            onClick={checkAllEndpoints}
            disabled={isChecking || isLoadingData}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Verificando...' : 'Verificar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <div className="text-sm text-gray-600">APIs Activas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-sm text-gray-600">Con Errores</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {avgResponseTime ? Math.round(avgResponseTime) : '-'}ms
            </div>
            <div className="text-sm text-gray-600">Tiempo Promedio</div>
          </div>
        </div>

        {/* Lista de endpoints */}
        <div className="space-y-2">
          {endpoints.map((endpoint) => (
            <div
              key={endpoint.url}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(endpoint.status)}
                <div>
                  <div className="font-medium">{endpoint.name}</div>
                  <div className="text-sm text-gray-500">{endpoint.url}</div>
                  {endpoint.errorMessage && (
                    <div className="text-xs text-red-600 mt-1">
                      {endpoint.errorMessage}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {endpoint.responseTime && (
                  <span className="text-xs text-gray-500">
                    {endpoint.responseTime}ms
                  </span>
                )}
                {getStatusBadge(endpoint.status)}
              </div>
            </div>
          ))}
        </div>

        {/* Información adicional */}
        {lastFullCheck && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Última verificación: {lastFullCheck.toLocaleString()}
          </div>
        )}

        {/* Alertas */}
        {errorCount > 0 && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">
              {errorCount} API{errorCount > 1 ? 's' : ''} con problemas. 
              Esto puede afectar la sincronización de datos.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}