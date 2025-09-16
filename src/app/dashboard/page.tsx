
'use client';

import React, { useMemo, useEffect } from 'react';
import { usePageTitle } from '@/hooks/use-page-title';
import { useData } from '@/context/data-provider-refactored';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Users, BookOpen, Clock, Package, ArrowRight, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { logDashboardDiagnostics } from '@/utils/dashboard-diagnostics';
import DataSyncDiagnostics from '@/components/dashboard/data-sync-diagnostics';
import SyncStatusMonitor from '@/components/dashboard/sync-status-monitor';

export default function DashboardPage() {
  usePageTitle('Dashboard');
  const { users, resources, loans, reservations, meetings, isLoadingData, refreshAllData, refreshResources, refreshLoans, refreshReservations } = useData();

  // Diagnóstico de datos para debugging
  useEffect(() => {
    if (!isLoadingData) {
      logDashboardDiagnostics({
        users,
        resources,
        loans,
        reservations,
        meetings,
        isLoadingData
      });
    }
  }, [users, resources, loans, reservations, meetings, isLoadingData]);

  const stats = useMemo(() => {
    const availableResources = resources.filter(r => r.status === 'available').length;
    const activeLoans = loans.filter(l => l.status === 'active').length;
    const expiredLoans = loans.filter(l => l.status === 'expired').length;
    const maintenanceResources = resources.filter(r => r.status === 'maintenance').length;
    const today = new Date().toDateString();
    const todayReservations = 3; // Placeholder - ajustar según datos reales
    const pendingTasks = meetings.reduce((acc, meeting) => {
      return acc + meeting.tasks.filter(task => task.status === 'pending').length;
    }, 0);

    return {
      totalUsers: users.length,
      availableResources,
      totalResources: resources.length,
      activeLoans,
      expiredLoans,
      maintenanceResources,
      todayReservations,
      pendingTasks
    };
  }, [users, resources, loans, meetings]);

  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }



  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900">Dashboard del Administrador</h1>
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
      
      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Inventario Card */}
        <Card 
          className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
          onClick={() => window.location.href = '/inventory'}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Package className="h-8 w-8 text-white/80" />
              <ArrowRight className="h-5 w-5 text-white/60" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Inventario</h3>
            <p className="text-sm text-white/80 mb-6">Resumen del estado de los recursos.</p>
            
            <div className="flex items-center justify-between mb-4">
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(stats.availableResources / stats.totalResources) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{stats.availableResources}</div>
                <div className="text-xs text-white/70">Disponible</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.activeLoans}</div>
                <div className="text-xs text-white/70">En préstamo</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.maintenanceResources}</div>
                <div className="text-xs text-white/70">Mantenimiento</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Préstamos Card */}
        <Card 
          className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white cursor-pointer hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          onClick={() => window.location.href = '/loans'}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-white/80" />
              <ArrowRight className="h-5 w-5 text-white/60" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Préstamos</h3>
            <p className="text-sm text-white/80 mb-6">Seguimiento de préstamos activos y vencidos.</p>
            
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-1">{stats.activeLoans}</div>
                <div className="text-sm text-white/70">Activos</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-1">{stats.expiredLoans}</div>
                <div className="text-sm text-white/70">Vencidos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reservas Card */}
        <Card 
          className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 border-0 text-white cursor-pointer hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
          onClick={() => window.location.href = '/reservations'}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CalendarDays className="h-8 w-8 text-white/80" />
              <ArrowRight className="h-5 w-5 text-white/60" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Reservas</h3>
            <p className="text-sm text-white/80 mb-6">Reservas de aulas confirmadas para hoy.</p>
            
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">{stats.todayReservations}</div>
              <div className="text-sm text-white/70">Reservas Hoy</div>
            </div>
          </CardContent>
        </Card>

        {/* Reuniones y Acuerdos Card */}
        <Card 
          className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 border-0 text-white cursor-pointer hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
          onClick={() => window.location.href = '/meetings'}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-white/80" />
              <ArrowRight className="h-5 w-5 text-white/60" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Reuniones y Acuerdos</h3>
            <p className="text-sm text-white/80 mb-6">Seguimiento de reuniones y tareas pendientes.</p>
            
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-1">{meetings.length}</div>
                <div className="text-sm text-white/70">Reuniones</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-1">{stats.pendingTasks}</div>
                <div className="text-sm text-white/70">Tareas Pendientes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
