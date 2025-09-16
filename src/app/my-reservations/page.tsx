
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ReservationCalendar } from '@/components/reservation-calendar';
import type { Reservation, ReservationStatus } from '@/domain/types';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-provider-refactored';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuthorization } from '@/hooks/use-authorization';
import { usePageTitle } from '@/hooks/use-page-title';


export default function MyReservationsPage() {
  useAuthorization('Docente');
  usePageTitle('Mis Reservas');
  const { reservations, updateReservationStatus, currentUser } = useData();
  const { toast } = useToast();
  
  const handleUpdateStatus = (id: string, status: ReservationStatus) => {
     updateReservationStatus(id, status);
     toast({
        title: "Estado de Reserva Actualizado",
        description: `Tu reserva ha sido marcada como "${status}".`,
        variant: "default",
    });
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold flex-grow hidden sm:block">Mis Reservas</h1>
        <Button asChild className="hidden sm:flex">
            <Link href="/my-reservations/new">
                <PlusCircle className="mr-2" />
                Nueva Reserva
            </Link>
        </Button>
      </div>
       <Card>
        <CardHeader>
            <CardTitle className="hidden sm:block">Calendario de Disponibilidad del Aula</CardTitle>
            <CardDescription className="hidden sm:block">
                Consulta los horarios ocupados y haz clic en un espacio libre para crear una nueva reserva. Solo puedes gestionar tus propias reservas.
            </CardDescription>
        </CardHeader>
        <CardContent>
             <ReservationCalendar
                mode="view"
                reservations={reservations}
                onUpdateReservationStatus={handleUpdateStatus}
                currentUserId={currentUser?.id}
             />
        </CardContent>
       </Card>
    </div>
  );
}
