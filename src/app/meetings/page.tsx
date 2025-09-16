
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Download, PlusCircle, Search, Filter, X } from 'lucide-react';
import { MeetingCard } from '@/components/meeting-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Accordion } from '@/components/ui/accordion';
import type { Meeting, GenericParticipant } from '@/domain/types';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { participantRoles } from '@/domain/constants';
import { cn } from '@/lib/utils';
import { useData } from '@/context/data-provider-refactored';
import { useAuthorization } from '@/hooks/use-authorization';
import { usePageTitle } from '@/hooks/use-page-title';

const ITEMS_PER_PAGE = 5;

export default function MeetingsPage() {
  useAuthorization('Admin');
  usePageTitle('Reuniones y Acuerdos');
  const { meetings, toggleMeetingTaskStatus } = useData();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [participantFilter, setParticipantFilter] = useState<GenericParticipant[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const handleTaskToggle = (meetingId: string, taskId: string) => {
    toggleMeetingTaskStatus(meetingId, taskId);
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setTaskStatusFilter('all');
    setParticipantFilter([]);
    setCurrentPage(1);
  };

  const filteredMeetings = useMemo(() => {
    return meetings
      .filter(meeting => {
        // Search query filter
        if (searchQuery && !meeting.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        // Task status filter
        if (taskStatusFilter !== 'all') {
          const totalTasks = meeting.tasks.length;
          if (totalTasks === 0 && taskStatusFilter === 'pending') return false;

          const completedTasks = meeting.tasks.filter(t => t.status === 'completed').length;
          
          if (taskStatusFilter === 'completed' && completedTasks !== totalTasks) {
            return false;
          }
          if (taskStatusFilter === 'pending' && completedTasks === totalTasks) {
            return false;
          }
        }

        // Participant filter
        if (participantFilter.length > 0) {
            if (!participantFilter.some(p => meeting.genericParticipants.includes(p))) {
                return false;
            }
        }

        return true;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by most recent
  }, [meetings, searchQuery, taskStatusFilter, participantFilter]);
  
  const totalPages = Math.ceil(filteredMeetings.length / ITEMS_PER_PAGE);
  const paginatedMeetings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMeetings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMeetings, currentPage]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, taskStatusFilter, participantFilter]);

  const activeFilterCount = [
    searchQuery,
    taskStatusFilter !== 'all',
    participantFilter.length > 0
  ].filter(Boolean).length;
  
  const toggleParticipantFilter = (role: GenericParticipant) => {
    setParticipantFilter(prev => 
        prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  }

  const FiltersContent = (
    <div className="space-y-4">
        <div className="space-y-3">
             <Label>Filtrar por Estado de Tareas</Label>
             <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="pending-filter" className="flex flex-col gap-1">
                    <span>Con tareas pendientes</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        Mostrar solo reuniones que aún tienen acuerdos por completar.
                    </span>
                </Label>
                <Switch 
                    id="pending-filter" 
                    checked={taskStatusFilter === 'pending'}
                    onCheckedChange={(checked) => setTaskStatusFilter(checked ? 'pending' : 'all')}
                />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="completed-filter" className="flex flex-col gap-1">
                     <span>Todas las tareas completadas</span>
                     <span className="font-normal leading-snug text-muted-foreground">
                        Mostrar solo reuniones donde todos los acuerdos se han cerrado.
                    </span>
                </Label>
                 <Switch 
                    id="completed-filter" 
                    checked={taskStatusFilter === 'completed'}
                    onCheckedChange={(checked) => setTaskStatusFilter(checked ? 'completed' : 'all')}
                />
            </div>
        </div>
        <Separator />
         <div className="space-y-3">
            <Label>Filtrar por Actores Educativos</Label>
            <div className="flex flex-wrap gap-2">
                {participantRoles.map(({ name, label, icon: Icon }) => (
                    <Button 
                        key={name}
                        variant={participantFilter.includes(name) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleParticipantFilter(name)}
                        className="text-xs"
                    >
                       <Icon className="mr-1.5 h-3 w-3" />
                        {label}
                    </Button>
                ))}
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold flex-grow hidden sm:block">Reuniones y Acuerdos</h1>
        <div className="hidden sm:flex w-full sm:w-auto items-center gap-2">
          <Button asChild>
            <Link href="/meetings/new">
              <PlusCircle className="mr-2" />
              Nueva Reunión
            </Link>
          </Button>
        </div>
      </div>

       <Card>
        <CardHeader>
          <div className="flex flex-row items-center gap-2">
            <div className="relative w-full flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por título de reunión..."
                    className="pl-9 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                 <Button variant="outline" className="shrink-0 relative h-10 w-10 p-0 sm:w-auto sm:px-4 sm:py-2">
                  <Filter className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Filtros</span>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className={cn(
                        "absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center sm:relative sm:top-auto sm:right-auto sm:ml-2 sm:h-auto sm:w-auto sm:px-1.5 sm:py-0.5",
                    )}>
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col">
                <SheetHeader>
                  <SheetTitle>Filtros de Reuniones</SheetTitle>
                  <SheetDescription>
                    Aplica filtros para encontrar reuniones específicas.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 py-4">
                  {FiltersContent}
                </div>
                <SheetFooter>
                  <Button variant="outline" className="w-full" onClick={clearFilters}>
                    <X className="mr-2" />
                    Limpiar Filtros
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedMeetings.length > 0 ? (
            <div className="space-y-4">
              <Accordion type="multiple" className="w-full space-y-4">
                {paginatedMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onTaskToggle={handleTaskToggle}
                  />
                ))}
              </Accordion>
               {totalPages > 1 && (
                <Pagination className="pt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        aria-disabled={currentPage === 1}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <PaginationItem key={page}>
                            <PaginationLink 
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                href="#"
                               
                            >
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        aria-disabled={currentPage === totalPages}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : undefined}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center border-dashed border-2 rounded-lg">
              <div className="text-center text-muted-foreground">
                <p>No se encontraron reuniones con los filtros aplicados.</p>
                <p className="text-sm">
                  Intenta ajustar o limpiar los filtros.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
