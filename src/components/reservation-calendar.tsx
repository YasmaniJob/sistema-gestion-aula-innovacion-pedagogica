

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isToday,
  isSameDay,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  User,
  BookOpen,
  CircleCheck,
  CircleSlash,
  CircleX,
  Clock,
  GraduationCap,
  Building,
  Hash,
  PlusCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Reservation, ReservationStatus, LoanUser } from '@/domain/types';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from './ui/dialog';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-provider-refactored';
import { useStableDataModal } from '@/hooks/use-stable-modal';
import type { PedagogicalHour } from '@/domain/types';

// Helper function to safely extract the name from pedagogical hour data
const getPedagogicalHourName = (hour: PedagogicalHour): string => {
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
  
  // If it's an object (JSON), try to reconstruct the text
  if (typeof hour.name === 'object' && hour.name !== null) {
    try {
      // Convert object with numeric keys to string
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

// Helper function to safely extract activity name from reservation data
const getActivityName = (activityName: any, pedagogicalHours: PedagogicalHour[]): string => {
  if (!activityName) return 'No especificado';
  
  // Find the pedagogical hour that matches this activity name
  const matchingHour = pedagogicalHours.find(hour => {
    const hourName = getPedagogicalHourName(hour);
    return hourName === activityName || hour.name === activityName;
  });
  
  if (matchingHour) {
    return getPedagogicalHourName(matchingHour);
  }
  
  // If no match found, try to parse as JSON if it looks like one
  if (typeof activityName === 'string') {
    if (activityName.startsWith('{') && activityName.endsWith('}')) {
      try {
        const obj = JSON.parse(activityName) as Record<string, string>;
        const keys = Object.keys(obj).sort((a, b) => parseInt(a) - parseInt(b));
        return keys.map(key => obj[key]).join('');
      } catch (error) {
        console.warn('Error parsing activity name JSON:', error);
      }
    }
    return activityName;
  }
  
  if (typeof activityName === 'object' && activityName !== null) {
    try {
      const obj = activityName as Record<string, string>;
      const keys = Object.keys(obj).sort((a, b) => parseInt(a) - parseInt(b));
      return keys.map(key => obj[key]).join('');
    } catch (error) {
      console.warn('Error processing activity name object:', error);
    }
  }
  
  return 'No especificado';
};


const statusConfig: Record<ReservationStatus, { icon: React.ElementType; bgClass: string; borderClass: string; textClass: string; }> = {
    'Confirmada': { icon: Clock, bgClass: 'bg-blue-100/60', borderClass: 'border-blue-300', textClass: 'text-blue-800' },
    'Realizada': { icon: CircleCheck, bgClass: 'bg-green-100/60', borderClass: 'border-green-300', textClass: 'text-green-800' },
    'No asistió': { icon: CircleSlash, bgClass: 'bg-orange-100/60', borderClass: 'border-orange-300', textClass: 'text-orange-800' },
    'Cancelada': { icon: CircleX, bgClass: 'bg-red-100/60', borderClass: 'border-red-300', textClass: 'text-red-800' },
};


type ReservationCalendarProps = {
    mode: 'view' | 'new';
    reservations?: Reservation[];
    selectedSlots?: string[];
    onSlotToggle?: (slotId: string) => void;
    onUpdateReservationStatus?: (id: string, status: ReservationStatus) => Promise<void>;
    currentUserId?: string | null;
    currentDate?: Date;
    onDateChange?: (date: Date) => void;
};

export function ReservationCalendar({
    mode,
    reservations: initialReservations = [],
    selectedSlots = [],
    onSlotToggle = () => {},
    onUpdateReservationStatus = () => {},
    currentUserId,
    currentDate: externalCurrentDate,
    onDateChange: externalOnDateChange,
}: ReservationCalendarProps) {
  const { currentUser, pedagogicalHours, isLoadingData } = useData();
  const timeSlots = useMemo(() => pedagogicalHours.map(h => getPedagogicalHourName(h)), [pedagogicalHours]);
  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date());

  const currentDate = externalCurrentDate ?? internalCurrentDate;
  const onDateChange = externalOnDateChange ?? setInternalCurrentDate;

  const [selectedDay, setSelectedDay] = useState(currentDate);
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  
  // Use stable modal hook for reservation dialog
  const reservationModal = useStableDataModal<Reservation>({
    preventMultipleOpens: true
  });
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use reservations directly from props instead of local state
  const reservations = initialReservations;

  // Optimize selectedDay update to prevent unnecessary re-renders
  useEffect(() => {
    if (!isSameDay(selectedDay, currentDate)) {
      setSelectedDay(currentDate);
    }
  }, [currentDate, selectedDay]);


  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start from Monday for the 5-day view
    return Array.from({ length: 5 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const handlePreviousWeek = () => onDateChange(subWeeks(currentDate, 1));
  const handleNextWeek = () => onDateChange(addWeeks(currentDate, 1));
  const handleToday = () => {
    const today = new Date();
    onDateChange(today);
    setSelectedDay(today);
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
        onDateChange(date);
        setSelectedDay(date);
        setCalendarOpen(false);
    }
  }

  const getReservationForSlot = (date: Date, time: string): Reservation | undefined => {
    return reservations.find(res => {
      if (!isSameDay(res.startTime, date)) return false;
      
      // Check if the reservation has the new timeSlot field (for new reservations)
      if (res.purposeDetails?.timeSlot) {
        return res.purposeDetails.timeSlot === time;
      }
      
      // Fallback for existing reservations without timeSlot field
      // For learning purpose, activityName contains the time slot
      if (res.purpose === 'aprendizaje') {
        return res.purposeDetails?.activityName === time;
      }
      
      // For institutional reservations without timeSlot, we can't determine the exact slot
      // This is a limitation for existing data, but new reservations will work correctly
      return false;
    });
  }

  const handleSlotClick = useCallback((date: Date, time: string) => {
    const reservation = getReservationForSlot(date, time);
    const slotId = `${date.toISOString().split('T')[0]}T${time}`;
    
    if (reservation) {
        if (mode === 'view') {
            reservationModal.openWithData(reservation);
        }
        return;
    }

    if (mode === 'view') {
        const backUrl = currentUser?.role === 'Admin' ? '/reservations' : '/my-reservations';
        router.push(`${backUrl}/new?slot=${encodeURIComponent(slotId)}`);
        return;
    }
    
    if (mode === 'new') {
        onSlotToggle(slotId);
    }
  }, [mode, reservationModal, currentUser?.role, router, onSlotToggle]);

  const handleUpdateStatus = useCallback(async (reservationId: string, status: ReservationStatus) => {
    if (!onUpdateReservationStatus) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await onUpdateReservationStatus(reservationId, status);
      reservationModal.closeModal();
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al actualizar el estado de la reserva';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      // Keep modal open on error
    } finally {
      setIsLoading(false);
    }
  }, [onUpdateReservationStatus, reservationModal, toast]);
  
  const weekRangeText = `Semana del ${format(weekStart, 'd')} al ${format(weekEnd, "d 'de' MMMM, yyyy", { locale: es })}`;
  
  if (!isClient) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  function ReservationCellContent({ reservation, pedagogicalHours }: { reservation: Reservation; pedagogicalHours: PedagogicalHour[] }) {
    const config = statusConfig[reservation.status];

    return (
        <div
            className={cn(
                'h-full w-full p-2 flex flex-col text-left text-xs',
                config.bgClass,
                `border-l-4 ${config.borderClass}`
            )}
        >
            <div className="flex-grow space-y-1 overflow-hidden">
                <p className={cn("font-bold", config.textClass)}>{reservation.user?.name || 'Usuario Desconocido'}</p>
                <p className={cn("truncate", config.textClass, "opacity-80")}>
                    {getActivityName(reservation.purposeDetails?.activityName, pedagogicalHours) || 'Actividad'}
                </p>
            </div>
            <div className="mt-auto">
                <Badge variant="secondary" className={cn("w-full justify-center font-semibold", config.bgClass, config.textClass, `border ${config.borderClass}`)}>
                    <config.icon className="h-3 w-3 mr-1.5" />
                    {reservation.status}
                </Badge>
            </div>
        </div>
    );
  }

  function DesktopView() {
    return (
      <div className="mt-4 border rounded-lg overflow-hidden">
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead className="w-1/6 font-bold">Hora</TableHead>
                      {weekDays.map((day) => (
                          <TableHead
                          key={day.toISOString()}
                          className={cn(
                              'text-center font-bold',
                              isToday(day) && 'bg-primary/10'
                          )}
                          >
                          <div className="capitalize">{format(day, 'eeee', { locale: es })}</div>
                          <div className="text-sm font-normal text-muted-foreground">
                              {format(day, 'dd/MM')}
                          </div>
                          </TableHead>
                      ))}
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {timeSlots.map((slot) => (
                      <TableRow key={slot}>
                          <TableCell className="font-medium text-muted-foreground">{slot}</TableCell>
                          {weekDays.map((day) => {
                              const reservation = getReservationForSlot(day, slot);
                              const slotId = `${day.toISOString().split('T')[0]}T${slot}`;
                              const isSelected = selectedSlots.includes(slotId);
                              
                              return (
                                  <TableCell
                                      key={day.toISOString()}
                                      className={cn(
                                          'h-24 align-top p-0 transition-all duration-200 relative group',
                                          isToday(day) && !reservation && 'bg-primary/3',
                                          !reservation && 'cursor-pointer hover:bg-primary/5',
                                          mode === 'view' && reservation && 'cursor-pointer',
                                          isSelected && 'bg-primary/8 border border-primary/20'
                                      )}
                                      onClick={() => handleSlotClick(day, slot)}
                                  >
                                      {reservation ? (
                                          <ReservationCellContent reservation={reservation} pedagogicalHours={pedagogicalHours} />
                                      ) : (
                                        <div className="h-full w-full relative">
                                          {isSelected && (
                                            <div className="absolute inset-0 flex items-center justify-center text-primary font-medium bg-primary/5">
                                                <div className="flex items-center space-x-1">
                                                  <CircleCheck className="h-4 w-4 text-primary" />
                                                  <span className="text-sm">Seleccionado</span>
                                                </div>
                                            </div>
                                          )}
                                          
                                          {!isSelected && mode === 'view' && (
                                             <div className="absolute inset-0 items-center justify-center text-primary/50 font-medium bg-transparent transition-opacity duration-200 opacity-0 group-hover:opacity-100 hidden sm:flex">
                                                <div className="flex items-center space-x-1">
                                                  <PlusCircle className="h-4 w-4"/>
                                                  <span className="text-sm">Reservar</span>
                                                </div>
                                            </div>
                                          )}
                                          
                                          {!isSelected && mode === 'new' && (
                                             <div className="absolute inset-0 items-center justify-center text-primary/40 font-medium bg-transparent transition-opacity duration-200 opacity-0 group-hover:opacity-100 hidden sm:flex">
                                                <span className="text-sm">Disponible</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                  </TableCell>
                              )
                          })}
                      </TableRow>
                  ))}
              </TableBody>
          </Table>
      </div>
    );
  }

  function MobileView() {
    return (
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-5 gap-3">
            {weekDays.map(day => {
                const isSelectedDay = isSameDay(day, selectedDay);
                const isDayToday = isToday(day);
                
                return (
                    <Button 
                        key={day.toISOString()}
                        variant={isSelectedDay ? "default" : "outline"}
                        className={cn(
                            "flex flex-col h-auto p-2 transition-all duration-200",
                            isSelectedDay && "bg-primary text-primary-foreground",
                            !isSelectedDay && "hover:bg-primary/5",
                            isDayToday && !isSelectedDay && "border-primary/30 bg-primary/3"
                        )}
                        onClick={() => setSelectedDay(day)}
                    >
                        <span className={cn(
                            "text-xs capitalize",
                            isDayToday && !isSelectedDay && "text-primary font-medium"
                        )}>
                            {format(day, 'eee', {locale: es})}
                        </span>
                        <span className={cn(
                            "font-bold text-lg",
                            isDayToday && !isSelectedDay && "text-primary"
                        )}>
                            {format(day, 'dd')}
                        </span>
                    </Button>
                );
            })}
        </div>
        <div className="border rounded-lg p-2 space-y-2">
            {timeSlots.map(slot => {
                const reservation = getReservationForSlot(selectedDay, slot);
                const config = reservation ? statusConfig[reservation.status] : null;
                const slotId = `${selectedDay.toISOString().split('T')[0]}T${slot}`;
                const isSelected = selectedSlots.includes(slotId);

                return(
                    <div 
                        key={slot}
                        className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-all duration-200 relative group",
                             reservation && config?.bgClass && `${config.bgClass} ${config.borderClass}`,
                             !reservation && !isSelected && 'cursor-pointer hover:bg-primary/5 hover:border-primary/20 border-gray-200',
                             !reservation && isSelected && 'bg-primary/8 border-primary/30',
                             mode === 'view' && reservation && 'cursor-pointer'
                        )}
                        onClick={() => handleSlotClick(selectedDay, slot)}
                    >
                       <div className="flex flex-col gap-1 items-start">
                         <span className="font-semibold text-sm">{slot}</span>
                         {reservation && (
                            <p className={cn("text-xs font-medium flex items-center gap-1", config?.textClass)}>
                              <User className="h-3 w-3" />
                              {reservation.user?.name || 'Usuario Desconocido'}
                            </p>
                         )}
                       </div>
                       
                       <div>
                         {reservation && config ? (
                            <Badge className={cn("font-medium", config.bgClass, config.textClass, `border ${config.borderClass}`)}>
                                <config.icon className="h-4 w-4 mr-1" />
                                {reservation.status}
                            </Badge>
                         ) : (
                            isSelected ? (
                              <Badge variant="default">
                                  <CircleCheck className="h-4 w-4 mr-1"/>
                                  Seleccionado
                              </Badge>
                            ) : (
                              <span className='text-sm text-muted-foreground'>Disponible</span>
                            )
                         )}
                       </div>
                    </div>
                )
            })}
        </div>
      </div>
    );
  }
  
  function WeekNavigator() {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePreviousWeek}>
                <ChevronLeft />
            </Button>
            <div className="flex-1 text-center font-semibold text-primary p-2 rounded-md">
              Sem {format(weekStart, 'd')} al {format(weekEnd, "d MMM", { locale: es })}
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextWeek}>
                <ChevronRight />
            </Button>
        </div>
        <div className='flex items-center gap-2'>
            <Popover open={isCalendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                        <CalendarDays className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={currentDate}
                        onSelect={handleDateSelect}
                        initialFocus
                        locale={es}
                    />
                </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={handleToday}>Hoy</Button>
        </div>
      </div>
    );
  }

  return (
    <>
        <WeekNavigator />
        {isMobile ? <MobileView /> : <DesktopView />}
        <ReservationDialog 
            reservation={reservationModal.data}
            isOpen={reservationModal.isOpen}
            onOpenChange={reservationModal.closeModal}
            onUpdateStatus={handleUpdateStatus}
            currentUserId={currentUser?.id}
        />
    </>
  );
}

// Dialog Content Component
type ReservationDialogProps = {
    reservation: Reservation | null;
    isOpen: boolean;
    onUpdateStatus?: (id: string, status: ReservationStatus) => Promise<void>;
    onOpenChange: () => void;
    currentUserId?: string | null; 
};

function ReservationDialog({ reservation, isOpen, onUpdateStatus, onOpenChange, currentUserId }: ReservationDialogProps) {
    const [processingStatus, setProcessingStatus] = useState<ReservationStatus | null>(null);
    const { toast } = useToast();
    
    const handleStatusUpdate = useCallback(async (status: ReservationStatus) => {
        if (!onUpdateStatus || !reservation || processingStatus) return;
        
        setProcessingStatus(status);
        try {
            await onUpdateStatus(reservation.id, status);
            
            // Mostrar toast de éxito
            const statusMessages = {
                'Realizada': 'La reserva ha sido marcada como realizada',
                'No asistió': 'La reserva ha sido marcada como no asistió',
                'Cancelada': 'La reserva ha sido cancelada'
            };
            
            toast({
                title: "Estado Actualizado",
                description: statusMessages[status] || `Estado cambiado a ${status}`,
                variant: 'default',
            });
            
            // Cerrar modal automáticamente después de acción exitosa
            onOpenChange();
        } catch (error: any) {
            toast({
                title: "Error al Actualizar",
                description: error.message || "No se pudo actualizar el estado de la reserva.",
                variant: 'destructive',
            });
        } finally {
            setProcessingStatus(null);
        }
    }, [onUpdateStatus, reservation, processingStatus, toast, onOpenChange]);

    const { currentUser, pedagogicalHours } = useData();
    const canManage = currentUser?.role === 'Admin' || (currentUser?.id === reservation?.user?.id && currentUser?.role === 'Docente');


    if (!reservation || !reservation.user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        <CalendarDays className="h-5 w-5" />
                        {canManage ? "Gestionar Reserva" : "Detalles de la Reserva"}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600 mt-1">
                        {format(reservation.startTime, "eeee, d 'de' MMMM", { locale: es })} - {reservation.purposeDetails?.timeSlot || getActivityName(reservation.purposeDetails?.activityName, pedagogicalHours) || 'Hora no especificada'}
                    </DialogDescription>
                </DialogHeader>
                <div className="px-6 py-6 space-y-6">
                    <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-700 mb-1">Docente</p>
                                <p className="text-base text-gray-900">{reservation.user?.name || 'Usuario Desconocido'}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                                {reservation.purpose === 'aprendizaje' ? <GraduationCap className="h-5 w-5 text-green-600"/> : <Building className="h-5 w-5 text-green-600" />}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-700 mb-1">Propósito</p>
                                <p className="text-base text-gray-900 capitalize">{reservation.purpose === 'aprendizaje' ? 'Actividad de Aprendizaje' : 'Uso Institucional'}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <BookOpen className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-700 mb-1">Actividad</p>
                                <p className="text-base text-gray-900">{getActivityName(reservation.purposeDetails?.activityName, pedagogicalHours)}</p>
                            </div>
                        </div>
                        
                        {reservation.purpose === 'aprendizaje' && (
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Hash className="h-5 w-5 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Detalles Académicos</p>
                                    <p className="text-base text-gray-900">
                                        {reservation.purposeDetails?.grade}, {reservation.purposeDetails?.section}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex gap-3 justify-end overflow-x-auto">
                    {canManage && (
                        <>
                            <Button
                                variant="outline"
                                className="min-w-[140px] text-red-800 border-red-300 bg-red-100/60 hover:bg-red-100 hover:text-red-900 hover:border-red-400 whitespace-nowrap"
                                onClick={() => handleStatusUpdate('Cancelada')}
                                disabled={!!processingStatus}
                            >
                                {processingStatus === 'Cancelada' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Cancelando...
                                    </>
                                ) : (
                                    <>
                                        <CircleX className="mr-2 h-4 w-4" />
                                        Cancelar
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className="min-w-[140px] text-orange-800 border-orange-300 bg-orange-100/60 hover:bg-orange-100 hover:text-orange-900 hover:border-orange-400 whitespace-nowrap"
                                onClick={() => handleStatusUpdate('No asistió')}
                                disabled={!!processingStatus}
                            >
                                {processingStatus === 'No asistió' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <CircleSlash className="mr-2 h-4 w-4" />
                                        No asistió
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className="min-w-[140px] text-green-800 border-green-300 bg-green-100/60 hover:bg-green-100 hover:text-green-900 hover:border-green-400 whitespace-nowrap"
                                onClick={() => handleStatusUpdate('Realizada')}
                                disabled={!!processingStatus}
                            >
                                {processingStatus === 'Realizada' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <CircleCheck className="mr-2 h-4 w-4" />
                                        Realizada
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
