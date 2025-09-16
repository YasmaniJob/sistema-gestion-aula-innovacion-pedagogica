'use client';

import React from 'react';
import { usePageTitle } from '@/hooks/use-page-title';
import { useData } from '@/context/data-provider-refactored';
import DataSyncDiagnostics from '@/components/dashboard/data-sync-diagnostics';
import SyncStatusMonitor from '@/components/dashboard/sync-status-monitor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export default function SyncMonitorPage() {
  usePageTitle('Monitor de Sincronización');
  
  const {
    users,
    resources,
    loans,
    reservations,
    meetings,
    isLoadingData,
    refreshAllData,
    refreshResources,
    refreshLoans,
    refreshReservations
  } = useData();

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-600" />
            Monitor de Sincronización
          </h1>
          <p className="text-gray-600 mt-2">
            Monitoreo en tiempo real del estado de sincronización y diagnóstico de problemas del sistema
          </p>
        </div>
      </div>

      {/* Monitor de Estado de Sincronización */}
      <SyncStatusMonitor isLoadingData={isLoadingData} />
      
      {/* Diagnóstico de Sincronización */}
      <DataSyncDiagnostics
        users={users}
        resources={resources}
        loans={loans}
        reservations={reservations}
        meetings={meetings}
        isLoadingData={isLoadingData}
        onRefresh={refreshAllData}
        refreshResources={refreshResources}
        refreshLoans={refreshLoans}
        refreshReservations={refreshReservations}
      />

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Información del Sistema
          </CardTitle>
          <CardDescription>
            Detalles técnicos sobre el estado del sistema de sincronización
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Sincronización Automática</span>
              </div>
              <p className="text-sm text-blue-700">
                Los datos se actualizan automáticamente cada 60 segundos
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Monitoreo en Tiempo Real</span>
              </div>
              <p className="text-sm text-green-700">
                Estado de APIs verificado continuamente
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-900">Diagnóstico Inteligente</span>
              </div>
              <p className="text-sm text-yellow-700">
                Detección automática de problemas y sugerencias de solución
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}