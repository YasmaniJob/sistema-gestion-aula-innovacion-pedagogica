
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { useData } from '@/context/data-provider-refactored';
import { useAuthorization } from '@/hooks/use-authorization';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Users, Package, Clock, CheckCircle, LineChart, BookOpen, XIcon, ArrowUpDown } from 'lucide-react';
import { ExportDialog } from '@/components/export-dialog';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());

// Helper function to safely extract the name from pedagogical hour data
const getPedagogicalHourName = (hour: any): string => {
  if (typeof hour.name === 'string') {
    // Check if it's a JSON string
    if (hour.name.startsWith('{') && hour.name.endsWith('}')) {
      try {
        // Parse the JSON string
        const obj = JSON.parse(hour.name) as Record<string, string>;
        const keys = Object.keys(obj).sort((a, b) => parseInt(a) - parseInt(b));
        return keys.map(key => obj[key]).join('');
      } catch (error) {
        console.warn('Error parsing JSON string:', error);
        return hour.name; // Return original string if parsing fails
      }
    }
    // If it's a regular string, return it
    return hour.name;
  }
  
  if (typeof hour.name === 'object' && hour.name !== null) {
    try {
      const obj = hour.name as Record<string, string>;
      const keys = Object.keys(obj).sort((a, b) => parseInt(a) - parseInt(b));
      return keys.map(key => obj[key]).join('');
    } catch (error) {
      console.warn('Error processing pedagogical hour name:', error);
      return 'Hora Pedagógica';
    }
  }
  
  return 'Hora Pedagógica';
};

import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { usePageTitle } from '@/hooks/use-page-title';


type ExportDataType = 'loans' | 'reservations' | 'meetings' | 'activity';
type CrossFilter = { type: 'user'; value: string; label: string } | null;
type Timeframe = 'this_month' | 'last_30_days' | 'last_3_months' | 'this_year' | 'all_time';
type SortKey = 'user' | 'loans' | 'reservations' | 'tasksCompleted';
type SortDirection = 'asc' | 'desc';

const timeframes: { value: Timeframe; label: string }[] = [
    { value: 'this_month', label: 'Este Mes' },
    { value: 'last_30_days', label: 'Últimos 30 días' },
    { value: 'last_3_months', label: 'Últimos 3 meses' },
    { value: 'this_year', label: 'Este Año' },
    { value: 'all_time', label: 'Desde el inicio' },
];

const ITEMS_PER_PAGE = 10;


export default function ReportsPage() {
    useAuthorization('Admin');
    usePageTitle('Análisis y Reportes');
    const { loans, reservations, meetings, findUserById, pedagogicalHours, users, isLoadingUser } = useData();
    const { toast } = useToast();
    const [crossFilter, setCrossFilter] = useState<CrossFilter>(null);

    const [timeframe, setTimeframe] = useState<Timeframe>('last_30_days');
    
    // Pagination and sorting states for activity table
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'loans', direction: 'desc' });
    
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [exportType, setExportType] = useState<ExportDataType | null>(null);

    const chartConfig = {
      préstamos: {
        label: "Préstamos",
      },
    } as const;

    const chartColors = useMemo(() => {
        if (typeof window === 'undefined') return [];
        const style = getComputedStyle(document.documentElement);
        return [
            `hsl(${style.getPropertyValue('--chart-1').trim()})`,
            `hsl(${style.getPropertyValue('--chart-2').trim()})`,
            `hsl(${style.getPropertyValue('--chart-3').trim()})`,
            `hsl(${style.getPropertyValue('--chart-4').trim()})`,
            `hsl(${style.getPropertyValue('--chart-5').trim()})`,
            `hsl(var(--primary))`,
        ];
    }, [isLoadingUser]);

    const dateRange = useMemo(() => {
        const now = new Date();
        switch (timeframe) {
            case 'this_month':
                return { from: startOfMonth(now), to: endOfMonth(now) };
            case 'last_30_days':
                return { from: subDays(now, 29), to: now };
            case 'last_3_months':
                return { from: subDays(now, 89), to: now };
            case 'this_year':
                return { from: startOfYear(now), to: endOfYear(now) };
            case 'all_time':
                return { from: new Date(0), to: now };
        }
    }, [timeframe]);

    const filteredData = useMemo(() => {
        const from = dateRange.from;
        const to = dateRange.to;

        const baseLoans = loans.filter(l => isWithinInterval(l.loanDate, { start: from, end: to }));
        const baseReservations = reservations.filter(r => isWithinInterval(r.startTime, { start: from, end: to }));
        const baseMeetings = meetings.filter(m => isWithinInterval(m.date, { start: from, end: to }));

        if (crossFilter?.type === 'user') {
            return {
                loans: baseLoans.filter(l => l.user.id === crossFilter.value),
                reservations: baseReservations.filter(r => r.user.id === crossFilter.value),
                meetings: baseMeetings, // Meetings are not filtered by user directly, but their tasks are
            };
        }
        
        return { loans: baseLoans, reservations: baseReservations, meetings: baseMeetings };
    }, [dateRange, loans, reservations, meetings, crossFilter]);

    // Loan Analysis
    const loanAnalysis = useMemo(() => {
        const data = filteredData.loans;
        const resourceCounts: Record<string, number> = {};

        data.forEach(loan => {
            loan.resources.forEach(res => {
                resourceCounts[res.name] = (resourceCounts[res.name] || 0) + 1;
            });
        });

        const topResources = Object.entries(resourceCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count], index) => ({ name, préstamos: count, fill: chartColors[index % chartColors.length] }));

        return {
            totalLoans: data.length,
            topResourcesData: topResources,
        };
    }, [filteredData.loans, chartColors]);

    const userActivityAnalysis = useMemo(() => {
        const teachers = users.filter(u => u.role === 'Docente');
        const activityData = teachers.map(teacher => {
            const userLoans = filteredData.loans.filter(l => l.user.id === teacher.id);
            const userReservations = filteredData.reservations.filter(r => r.user.id === teacher.id);
            const userTasks = filteredData.meetings.flatMap(m => m.tasks).filter(t => t.responsibleId === teacher.id);

            return {
                userId: teacher.id,
                user: teacher.name,
                loans: userLoans.length,
                reservations: userReservations.length,
                tasksCompleted: userTasks.filter(t => t.status === 'completed').length,
            };
        });
        
        return activityData.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];

            let comparison = 0;
            if (typeof valA === 'string' && typeof valB === 'string') {
                comparison = valA.localeCompare(valB);
            } else if (typeof valA === 'number' && typeof valB === 'number') {
                comparison = valA - valB;
            }

            if (comparison === 0) {
                return a.user.localeCompare(b.user);
            }

            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });

    }, [users, filteredData, sortConfig]);
    
    const paginatedUserActivity = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return userActivityAnalysis.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [userActivityAnalysis, currentPage]);

    const totalPages = Math.ceil(userActivityAnalysis.length / ITEMS_PER_PAGE);
    
    // Reservation Analysis
    const reservationAnalysis = useMemo(() => {
        const data = filteredData.reservations;
        const usageByDay: Record<string, Record<string, number>> = { 'Lunes': {}, 'Martes': {}, 'Miércoles': {}, 'Jueves': {}, 'Viernes': {} };
        const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        data.forEach(reservation => {
            const dayName = daysOfWeek[reservation.startTime.getDay()];
            if (usageByDay[dayName]) {
                const hour = pedagogicalHours.find(h => getPedagogicalHourName(h) === reservation.purposeDetails.activityName);
                if (hour) {
                    const hourName = getPedagogicalHourName(hour);
                    if (!usageByDay[dayName][hourName]) {
                        usageByDay[dayName][hourName] = 0;
                    }
                    usageByDay[dayName][hourName]++;
                }
            }
        });

        const chartData = Object.entries(usageByDay).map(([day, hours]) => {
            const entry: { day: string; [key: string]: any } = { day };
            pedagogicalHours.forEach(hour => {
                const hourName = getPedagogicalHourName(hour);
                entry[hourName] = hours[hourName] || 0;
            });
            return entry;
        });
        
        return {
            totalReservations: data.length,
            usageChartData: chartData,
        };
    }, [filteredData.reservations, pedagogicalHours]);

    // Meeting Analysis
    const meetingAnalysis = useMemo(() => {
        const data = filteredData.meetings;
        const allTasks = data.flatMap(m => m.tasks);
        const pendingTasks = allTasks.filter(t => t.status === 'pending').length;
        
        const taskStatusData = [
            { name: 'Completadas', value: allTasks.length - pendingTasks, fill: 'hsl(var(--chart-1))' },
            { name: 'Pendientes', value: pendingTasks, fill: 'hsl(var(--chart-5))' },
        ];

        return {
            totalMeetings: data.length,
            pendingTasks,
            taskStatusData,
        };
    }, [filteredData.meetings]);


    const openExportDialog = (type: ExportDataType) => {
        setExportType(type);
        setIsExportOpen(true);
    };

    const handleExport = (formatType: 'excel' | 'pdf') => {
        if (!exportType) return;
        
        let dataToExport: any[] = [];
        let headers: string[] = [];
        let fileName = `reporte_${exportType}`;
        let title = `Reporte de ${exportType}`;

        switch (exportType) {
            case 'loans':
                headers = ['Docente', 'Fecha', 'Propósito', 'Recursos', 'Estado'];
                dataToExport = filteredData.loans.map(l => ({
                    Docente: l.user.name,
                    Fecha: isValidDate(l.loanDate) ? format(l.loanDate, 'Pp', { locale: es }) : 'Fecha inválida',
                    Propósito: l.purposeDetails?.activityName || 'N/A',
                    Recursos: l.resources.map(r => r.name).join(', '),
                    Estado: l.status,
                }));
                break;
            case 'reservations':
                headers = ['Docente', 'Fecha', 'Hora', 'Actividad', 'Estado'];
                dataToExport = filteredData.reservations.map(r => ({
                    Docente: r.user.name,
                    Fecha: format(r.startTime, 'P', { locale: es }),
                    Hora: r.purposeDetails.activityName,
                    Actividad: r.purposeDetails?.activityName || 'N/A',
                    Estado: r.status,
                }));
                break;
            case 'meetings':
                headers = ['Título', 'Fecha', 'Participantes', 'Tareas Totales', 'Tareas Completadas'];
                dataToExport = filteredData.meetings.map(m => ({
                    Título: m.title,
                    Fecha: format(m.date, 'P', { locale: es }),
                    Participantes: m.genericParticipants.join(', '),
                    'Tareas Totales': m.tasks.length,
                    'Tareas Completadas': m.tasks.filter(t => t.status === 'completed').length,
                }));
                break;
            case 'activity':
                 headers = ['Docente', 'Préstamos', 'Reservas', 'Tareas Completadas'];
                 dataToExport = userActivityAnalysis.map(u => ({
                    'Docente': u.user,
                    'Préstamos': u.loans,
                    'Reservas': u.reservations,
                    'Tareas Completadas': u.tasksCompleted
                 }));
                 fileName = 'reporte_actividad_docente';
                 title = 'Reporte de Actividad Docente';
                 break;
        }

        if (formatType === 'excel') {
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, title);
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        } else {
            const doc = new jsPDF();
            doc.text(title, 14, 16);
            (doc as any).autoTable({
                head: [headers],
                body: dataToExport.map(row => headers.map(h => row[h] || 0)),
                startY: 20,
            });
            doc.save(`${fileName}.pdf`);
        }
        
        toast({ title: 'Exportación Exitosa', description: `Se ha generado tu reporte.` });
        setIsExportOpen(false);
    };

    const handleUserClick = (userId: string, userName: string) => {
        if (crossFilter?.type === 'user' && crossFilter?.value === userId) {
            setCrossFilter(null);
        } else {
            setCrossFilter({ type: 'user', value: userId, label: userName });
        }
    };
    
    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    if (isLoadingUser) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <Skeleton className="h-9 w-64" />
                        <Skeleton className="h-5 w-80 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-full sm:w-64" />
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-80 w-full" />
                </div>
            </div>
        );
    }


  return (
    <>
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold hidden sm:block">Análisis y Reportes</h1>
                <p className="text-muted-foreground">
                    Una vista detallada para entender el uso del Aula de Innovación.
                </p>
            </div>
            <div className="w-full sm:w-auto">
                <Select value={timeframe} onValueChange={(value: Timeframe) => setTimeframe(value)}>
                    <SelectTrigger className="w-full sm:w-[260px]">
                        <SelectValue placeholder="Selecciona un período" />
                    </SelectTrigger>
                    <SelectContent>
                        {timeframes.map((tf) => (
                            <SelectItem key={tf.value} value={tf.value}>
                                {tf.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>

        {crossFilter && (
             <div className="flex items-center justify-center">
                 <Badge variant="secondary" className="text-sm py-2 px-4">
                    Mostrando datos para: <strong className="ml-2">{crossFilter.label}</strong>
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-2" onClick={() => setCrossFilter(null)}>
                        <XIcon className="h-3 w-3" />
                    </Button>
                </Badge>
             </div>
        )}

       {/* KPIs Section */}
        <div className="grid gap-6 md:grid-cols-3">
            <Card className="flex flex-col justify-between">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total de Préstamos</CardTitle>
                    <TrendingUp className="h-5 w-5 text-[hsl(var(--chart-1))]" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-[hsl(var(--chart-1))]">
                         {loanAnalysis.totalLoans}
                    </div>
                </CardContent>
            </Card>
            <Card className="flex flex-col justify-between">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total de Reservas</CardTitle>
                    <Clock className="h-5 w-5 text-[hsl(var(--chart-2))]" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-[hsl(var(--chart-2))]">
                        {reservationAnalysis.totalReservations}
                    </div>
                </CardContent>
            </Card>
            <Card className="flex flex-col justify-between">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
                    <CheckCircle className="h-5 w-5 text-[hsl(var(--chart-5))]"/>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-[hsl(var(--chart-5))]">
                        {meetingAnalysis.pendingTasks}
                    </div>
                </CardContent>
            </Card>
        </div>
      
       {/* Main Charts Section */}
        <div className="grid grid-cols-1 gap-6">
            <Card>
                <CardHeader className="flex items-center justify-between flex-row">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Users/>Análisis de Actividad Docente</CardTitle>
                        <CardDescription>Resumen de actividad por docente. Haz clic en un nombre para filtrar todos los reportes.</CardDescription>
                    </div>
                     <Button variant="outline" size="sm" onClick={() => openExportDialog('activity')}>
                        <Download className="mr-2 h-4 w-4" /> Exportar
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        <Button variant="ghost" onClick={() => requestSort('user')} className="-ml-4">
                                            Docente
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <Button variant="ghost" onClick={() => requestSort('loans')} className="px-0">
                                            Préstamos
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                         <Button variant="ghost" onClick={() => requestSort('reservations')} className="px-0">
                                            Reservas
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                         <Button variant="ghost" onClick={() => requestSort('tasksCompleted')} className="px-0">
                                            Tareas Comp.
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedUserActivity.map(({ userId, user, ...activity }) => (
                                    <TableRow 
                                        key={userId} 
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleUserClick(userId, user)}
                                    >
                                        <TableCell className="font-medium truncate">{user}</TableCell>
                                        <TableCell className="text-right font-semibold text-primary">{activity.loans}</TableCell>
                                        <TableCell className="text-right font-semibold text-primary">{activity.reservations}</TableCell>
                                        <TableCell className="text-right font-semibold text-primary">{activity.tasksCompleted}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {totalPages > 1 && (
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} aria-disabled={currentPage === 1}/>
                                    </PaginationItem>
                                    <PaginationItem>
                                         <span className="text-sm font-medium">
                                            Página {currentPage} de {totalPages}
                                        </span>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} aria-disabled={currentPage === totalPages}/>
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex items-center justify-between flex-row">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Package/>Recursos más Prestados</CardTitle>
                        <CardDescription>Top 5 recursos más solicitados en el período seleccionado.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openExportDialog('loans')}>
                        <Download className="mr-2 h-4 w-4" /> Exportar
                    </Button>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                        <BarChart data={loanAnalysis.topResourcesData} accessibilityLayer>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                stroke="hsl(var(--muted-foreground))"
                                tickFormatter={(value) => value.length > 15 ? value.slice(0, 12) + '...' : value}
                            />
                            <YAxis stroke="hsl(var(--muted-foreground))"/>
                            <ChartTooltip
                                cursor={true}
                                content={<ChartTooltipContent indicator="dot" />}
                            />
                            <Bar dataKey="préstamos" radius={[4, 4, 0, 0]}>
                                {loanAnalysis.topResourcesData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex items-center justify-between flex-row">
                    <div>
                        <CardTitle className="flex items-center gap-2"><LineChart/>Estado de Tareas</CardTitle>
                        <CardDescription>Resumen de todas las tareas de reuniones en el período.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openExportDialog('meetings')}>
                        <Download className="mr-2 h-4 w-4" /> Exportar
                    </Button>
                </CardHeader>
                <CardContent className="pt-6">
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                        <PieChart accessibilityLayer>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie
                                data={meetingAnalysis.taskStatusData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={60}
                                strokeWidth={5}
                                paddingAngle={5}
                            >
                                {meetingAnalysis.taskStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Legend content={({ payload }) => (
                                <ul className="flex justify-center gap-4 mt-4">
                                    {payload?.map((entry, index) => (
                                    <li key={`item-${index}`} className="flex items-center text-sm">
                                        <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                                        <span>{entry.value}</span>
                                    </li>
                                    ))}
                                </ul>
                            )} />
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex items-center justify-between flex-row">
                    <div>
                        <CardTitle className="flex items-center gap-2"><BookOpen />Análisis de Reservas</CardTitle>
                        <CardDescription>Resumen del uso del aula por día y hora en el período seleccionado.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openExportDialog('reservations')}>
                        <Download className="mr-2 h-4 w-4" /> Exportar
                    </Button>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                        <BarChart data={reservationAnalysis.usageChartData} accessibilityLayer>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="day"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                stroke="hsl(var(--muted-foreground))"
                            />
                            <YAxis stroke="hsl(var(--muted-foreground))" />
                            <ChartTooltip
                                cursor={true}
                                content={<ChartTooltipContent indicator="dot" />}
                            />
                            <Legend />
                            {pedagogicalHours.map((hour, index) => (
                                <Bar 
                                    key={hour.id} 
                                    dataKey={getPedagogicalHourName(hour)} 
                                    stackId="a" 
                                    fill={chartColors[index % chartColors.length]} 
                                    radius={[4, 4, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    </div>
    <ExportDialog 
        isOpen={isExportOpen}
        onOpenChange={setIsExportOpen}
        onExportExcel={() => handleExport('excel')}
        onExportPDF={() => handleExport('pdf')}
        itemCount={
             exportType === 'activity' ? userActivityAnalysis.length : 
             (filteredData[exportType as Exclude<ExportDataType, 'activity'>]?.length || 0)
        }
        itemName={
            exportType === 'activity' ? 'Actividad Docente' :
            exportType === 'loans' ? 'Préstamos' :
            exportType === 'reservations' ? 'Reservas' :
            exportType === 'meetings' ? 'Reuniones' : ''
        }
    />
    </>
  );
}
