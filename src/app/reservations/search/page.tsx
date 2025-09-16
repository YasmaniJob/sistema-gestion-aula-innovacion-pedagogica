
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  Search,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserSelector } from '@/components/user-selector';
import type { LoanUser, Reservation } from '@/domain/types';
import { SearchResultItem } from '@/components/search-result-item';
import { useData } from '@/context/data-provider-refactored';
import { useAuthorization } from '@/hooks/use-authorization';


export default function ReservationSearchPage() {
    useAuthorization('Admin');
    const { reservations } = useData();
    const [selectedUser, setSelectedUser] = useState<LoanUser | null>(null);
    const [results, setResults] = useState<Reservation[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);


    const handleSearch = () => {
        if (!selectedUser) {
            return;
        }
        setHasSearched(true);
        setIsSearching(true);
        setResults([]);
        
        // Simulate API call
        setTimeout(() => {
            const userReservations = reservations
                .filter(
                    (reservation) => reservation.user.id === selectedUser.id
                )
                .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

            setResults(userReservations);
            setIsSearching(false);
        }, 1500);
    };

  return (
    <div className="space-y-6">
      <div className="hidden sm:flex items-center gap-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <Link href="/reservations" className="hover:text-primary">
            Reservas
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-primary">Búsqueda Avanzada</span>
        </div>
      </div>
      <h1 className="text-3xl font-bold hidden sm:block">Búsqueda Avanzada de Reservas</h1>
      
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Filtros de Búsqueda</CardTitle>
                <CardDescription>
                    Selecciona al docente para ver su historial completo de reservas.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-end gap-4">
               <div className="flex-grow w-full">
                 <UserSelector 
                    selectedUser={selectedUser}
                    onUserSelect={setSelectedUser}
                 />
               </div>
                <Button onClick={handleSearch} disabled={!selectedUser || isSearching} className="w-full sm:w-auto">
                    {isSearching ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Buscando...
                        </>
                    ) : (
                        <>
                            <Search className="mr-2 h-4 w-4" />
                            Buscar Reservas
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>
                    {hasSearched && !isSearching
                        ? `Mostrando ${results.length} resultado(s) para ${selectedUser?.name}.`
                        : 'Selecciona un docente para iniciar la búsqueda.'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="min-h-[300px] max-h-screen overflow-y-auto">
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="text-muted-foreground mt-4">
                                Buscando reservas...
                            </p>
                        </div>
                    ) : hasSearched ? (
                         results.length > 0 ? (
                            <div className="space-y-4">
                                {results.map(reservation => (
                                    <SearchResultItem key={reservation.id} reservation={reservation} />
                                ))}
                            </div>
                         ) : (
                            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                                <BookOpen className="h-8 w-8 text-muted-foreground" />
                                <p className="text-muted-foreground mt-4 font-semibold">
                                    No se encontraron reservas
                                </p>
                                <p className="text-muted-foreground text-sm">El docente {selectedUser?.name} no tiene reservas en el historial.</p>
                            </div>
                         )
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">
                                Los resultados de la búsqueda aparecerán aquí.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
