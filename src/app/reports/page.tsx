
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/context/data-provider-refactored';
import { useAuthorization } from '@/hooks/use-authorization';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Users, Package, Clock, CheckCircle, BookOpen } from 'lucide-react';
import { usePageTitle } from '@/hooks/use-page-title';
import { Badge } from '@/components/ui/badge';

export default function ReportsPage() {
    usePageTitle('Reportes');
    const { loans, reservations, meetings, users, resources } = useData();
    const { hasPermission } = useAuthorization();

    // Verificar permisos
    if (!hasPermission('view_reports')) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No tienes permisos para ver los reportes.</p>
            </div>
        );
    }

    // Estadísticas básicas
    const stats = useMemo(() => {
        const totalLoans = loans?.length || 0;
        const activeLoans = loans?.filter(loan => loan.status === 'active')?.length || 0;
        const totalReservations = reservations?.length || 0;
        const totalMeetings = meetings?.length || 0;
        const totalUsers = users?.length || 0;
        const totalResources = resources?.length || 0;
        
        return {
            totalLoans,
            activeLoans,
            totalReservations,
            totalMeetings,
            totalUsers,
            totalResources
        };
    }, [loans, reservations, meetings, users, resources]);

    // Top usuarios por préstamos
    const topUsers = useMemo(() => {
        if (!loans || !users) return [];
        
        const userLoans = users.map(user => {
            const userLoanCount = loans.filter(loan => loan.user && loan.user.id === user.id).length;
            return {
                name: user.name,
                email: user.email,
                role: user.role,
                loanCount: userLoanCount
            };
        }).filter(user => user.loanCount > 0)
          .sort((a, b) => b.loanCount - a.loanCount)
          .slice(0, 10);
        
        return userLoans;
    }, [loans, users]);

    // Recursos más prestados
    const topResources = useMemo(() => {
        if (!loans || !resources) return [];
        
        const resourceLoans = resources.map(resource => {
            const resourceLoanCount = loans.filter(loan => loan.resource && loan.resource.id === resource.id).length;
            return {
                name: resource.name,
                category: resource.category?.name || 'Sin categoría',
                loanCount: resourceLoanCount
            };
        }).filter(resource => resource.loanCount > 0)
          .sort((a, b) => b.loanCount - a.loanCount)
          .slice(0, 10);
        
        return resourceLoans;
    }, [loans, resources]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
                    <p className="text-muted-foreground">Resumen de actividades del sistema</p>
                </div>
            </div>

            {/* Estadísticas generales */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Préstamos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalLoans}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.activeLoans} activos
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalReservations}</div>
                        <p className="text-xs text-muted-foreground">
                            Reservas registradas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reuniones</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalMeetings}</div>
                        <p className="text-xs text-muted-foreground">
                            Reuniones programadas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            Usuarios registrados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Recursos</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalResources}</div>
                        <p className="text-xs text-muted-foreground">
                            Recursos disponibles
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tablas de datos */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Top Usuarios */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Top 10 Usuarios Más Activos
                        </CardTitle>
                        <CardDescription>
                            Usuarios con más préstamos realizados
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead className="text-right">Préstamos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topUsers.length > 0 ? (
                                    topUsers.map((user, index) => (
                                        <TableRow key={user.email}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{user.role}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {user.loanCount}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            No hay datos disponibles
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Top Recursos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Top 10 Recursos Más Prestados
                        </CardTitle>
                        <CardDescription>
                            Recursos con mayor demanda
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Recurso</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead className="text-right">Préstamos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topResources.length > 0 ? (
                                    topResources.map((resource, index) => (
                                        <TableRow key={`${resource.name}-${index}`}>
                                            <TableCell className="font-medium">
                                                {resource.name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{resource.category}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {resource.loanCount}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            No hay datos disponibles
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
