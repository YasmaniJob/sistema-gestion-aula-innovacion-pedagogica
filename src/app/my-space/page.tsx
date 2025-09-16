
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Activity,
    ArrowRightLeft,
    BookMarked,
    CalendarCheck2,
    Clock,
    Hourglass,
    PackageSearch,
    TriangleAlert,
    Video,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { es } from 'date-fns/locale';
import { format, isToday, isBefore, startOfDay } from 'date-fns';

const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());
import { cn } from '@/lib/utils';
import type { Loan, Reservation } from '@/domain/types';
import { useAuthorization } from '@/hooks/use-authorization';
import { useData } from '@/context/data-provider-refactored';
import { usePageTitle } from '@/hooks/use-page-title';


export default function MySpacePage() {
    useAuthorization('Docente');
    usePageTitle('Mi Espacio');
    const { currentUser, loans, reservations } = useData();
    const [currentDate, setCurrentDate] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // Set date on client to avoid hydration mismatch
        setIsClient(true);
        setCurrentDate(format(new Date(), "eeee, d 'de' MMMM 'de' yyyy", { locale: es }));
    }, []);
    
    const userLoans = useMemo(() => loans.filter(l => l.user.id === currentUser?.id), [loans, currentUser]);
    const userReservations = useMemo(() => reservations.filter(r => r.user.id === currentUser?.id), [reservations, currentUser]);
    
    const activeLoans = useMemo(() => userLoans.filter(l => l.status === 'active').slice(0, 2), [userLoans]);
    const upcomingReservations = useMemo(() => userReservations.filter(r => r.startTime >= new Date()).sort((a,b) => a.startTime.getTime() - b.startTime.getTime()).slice(0, 2), [userReservations]);


  return (
    <div className="space-y-6">
       <div className="space-y-1">
            <h1 className="text-3xl font-bold hidden sm:block">¡Hola, {currentUser?.name}!</h1>
            <p className="text-muted-foreground capitalize">
                {currentDate || 'Cargando fecha...'}
            </p>
       </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Active Loans */}
         <Link href="/my-loans">
            <Card className="flex flex-col h-full transition-all hover:-translate-y-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                        <ArrowRightLeft className="h-6 w-6"/>
                        Mis Préstamos Activos
                    </CardTitle>
                    <CardDescription className="text-blue-100">Recursos que tienes actualmente en tu poder.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    {activeLoans.length > 0 ? activeLoans.map(loan => (
                        <div key={loan.id} className="p-3 bg-blue-900/30 rounded-lg">
                            <p className="text-xs text-blue-100 font-semibold">
                                {isClient ? (isValidDate(loan.loanDate) ? format(loan.loanDate, "'Prestado el' d 'de' MMMM", { locale: es }) : 'Fecha inválida') : 'Cargando...'}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {loan.resources.map(resource => (
                                    <Badge key={resource.id} variant="secondary" className="font-normal bg-white/90 text-blue-900">
                                        {resource.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-center text-blue-100 py-4">No tienes préstamos activos.</p>
                    )}
                </CardContent>
                 <div className="p-4 pt-0 text-right">
                    <ChevronRight className="h-5 w-5 text-blue-200" />
                </div>
            </Card>
        </Link>

        {/* Upcoming Reservations */}
        <Link href="/my-reservations">
            <Card className="flex flex-col h-full transition-all hover:-translate-y-1 bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                        <BookMarked className="h-6 w-6"/>
                        Mis Próximas Reservas
                    </CardTitle>
                    <CardDescription className="text-green-100">Tus próximos horarios reservados en el aula.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                    {upcomingReservations.length > 0 ? upcomingReservations.map(reservation => (
                        <div key={reservation.id} className="flex items-center justify-between p-3 bg-green-900/30 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div>
                                    <p className="font-semibold text-sm">{reservation.purposeDetails?.activityName}</p>
                                    <p className="text-xs text-green-100">
                                        {isClient ? `${format(reservation.startTime, "eeee", { locale: es })}, ${reservation.purposeDetails?.timeSlot || reservation.purposeDetails?.activityName || format(reservation.startTime, "h:mm a", { locale: es })}` : '...'}
                                    </p>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-white/90 text-green-900 border-transparent">
                                {isClient ? (isToday(reservation.startTime) ? 'Hoy' : format(reservation.startTime, "d MMM", { locale: es })) : '...'}
                            </Badge>
                        </div>
                    )) : (
                        <p className="text-sm text-center text-green-100 py-4">No tienes reservas programadas.</p>
                    )}
                </CardContent>
                 <div className="p-4 pt-0 text-right">
                    <ChevronRight className="h-5 w-5 text-green-200" />
                </div>
            </Card>
        </Link>

        {/* New Reservation */}
        <Link href="/my-reservations/new">
            <Card className="flex flex-col h-full transition-all hover:-translate-y-1 bg-gradient-to-br from-purple-500 to-purple-600 text-white items-center justify-center text-center p-6">
                <div className="p-4 bg-white/20 rounded-full mb-4">
                    <CalendarCheck2 className="h-10 w-10"/>
                </div>
                <CardTitle className="text-2xl">Nueva Reserva</CardTitle>
                <CardDescription className="text-purple-100 mt-1">Agenda un horario en el aula de innovación.</CardDescription>
            </Card>
        </Link>
        
        {/* Explore Inventory */}
        <Link href="/inventory">
            <Card className="flex flex-col h-full transition-all hover:-translate-y-1 bg-gradient-to-br from-orange-500 to-orange-600 text-white items-center justify-center text-center p-6">
                 <div className="p-4 bg-white/20 rounded-full mb-4">
                    <PackageSearch className="h-10 w-10"/>
                </div>
                <CardTitle className="text-2xl">Explorar Inventario</CardTitle>
                <CardDescription className="text-orange-100 mt-1">Consulta los recursos y equipos disponibles.</CardDescription>
            </Card>
        </Link>
      </div>
    </div>
  );
}
