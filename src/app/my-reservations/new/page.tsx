
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ChevronRight,
  GraduationCap,
  Building,
  User,
  Clock,
  CheckCircle,
  BookOpen,
  Hash,
  Loader2,
  X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { UserSelector } from '@/components/user-selector';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { LoanUser } from '@/domain/types';
import { ReservationCalendar } from '@/components/reservation-calendar';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/context/data-provider-refactored';
import { useAuthorization } from '@/hooks/use-authorization';
import { usePageTitle } from '@/hooks/use-page-title';

export default function NewReservationPage() {
    useAuthorization('Docente');
    usePageTitle('Nueva Reserva');
    const { currentUser, reservations, addReservation, areas, grades } = useData();
    const [selectedUser, setSelectedUser] = useState<LoanUser | null>(null);
    const [loanPurpose, setLoanPurpose] = useState<'aprendizaje' | 'institucional'>('aprendizaje');
    const [internalUsageDetails, setInternalUsageDetails] = useState('');
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    useEffect(() => {
        const initialSlot = searchParams.get('slot');
        if (initialSlot) {
            setSelectedSlots([initialSlot]);
        }
    }, [searchParams]);

    useEffect(() => {
        if (currentUser?.role === 'Docente') {
            setSelectedUser(currentUser);
        }
    }, [currentUser]);


    const handleSlotToggle = (slotId: string) => {
        setSelectedSlots(prev => 
            prev.includes(slotId) 
                ? prev.filter(s => s !== slotId)
                : [...prev, slotId]
        );
    };

    const isFormValid = () => {
        if (!selectedUser || selectedSlots.length === 0) {
            return false;
        }
        if (loanPurpose === 'aprendizaje') {
            return selectedArea !== '' && selectedGrade !== '' && selectedSection !== '';
        }
        if (loanPurpose === 'institucional') {
            return internalUsageDetails.trim() !== '';
        }
        return false;
    }

    const handleConfirmReservation = async () => {
        if (!isFormValid() || !selectedUser) return;

        setIsSubmitting(true);
        
        const newReservationsData = selectedSlots.map(slot => {
            const [dateStr, time] = slot.split('T');
            const startTime = parseISO(`${dateStr}T00:00:00`); // Time part is handled by purposeDetails
            
            return {
                user: selectedUser,
                purpose: loanPurpose,
                purposeDetails: {
                    activityName: loanPurpose === 'institucional' ? internalUsageDetails : time,
                    timeSlot: time, // Always store the time slot for proper calendar display
                    ...(loanPurpose === 'aprendizaje' && {
                        area: selectedArea,
                        grade: selectedGrade,
                        section: selectedSection,
                    })
                },
                startTime,
                endTime: startTime, // Simplified for this app
                status: 'Confirmada' as const,
            };
        });

        await Promise.all(newReservationsData.map(addReservation));

        setIsSubmitting(false);
        toast({
            title: '¡Reserva Registrada!',
            description: `La reserva para ${selectedUser?.name} ha sido creada exitosamente.`,
            variant: 'default',
        });
        router.push('/my-reservations');
    };

    const groupedSlots = useMemo(() => {
        const groups: Record<string, string[]> = {};
        selectedSlots.forEach(slotId => {
            const [dateStr, time] = slotId.split('T');
            if (!groups[dateStr]) {
                groups[dateStr] = [];
            }
            groups[dateStr].push(time);
        });
        return Object.entries(groups).sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
    }, [selectedSlots]);
    
    const backUrl = '/my-reservations';

    const sectionsForSelectedGrade = useMemo(() => {
        if (!selectedGrade) return [];
        const grade = grades.find(g => g.name === selectedGrade);
        return grade?.sections || [];
    }, [selectedGrade, grades]);

    // Reset section when grade changes
    useEffect(() => {
        setSelectedSection('');
    }, [selectedGrade]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="hidden sm:flex items-center gap-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Link href={backUrl} className="hover:text-primary">
                           Mis Reservas
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-medium text-primary">Nueva Reserva</span>
                    </div>
                </div>
            </div>
            <h1 className="text-3xl font-bold hidden sm:block">Crear Nueva Reserva</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Detalles de la Reserva</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    size="lg"
                                    className={cn("h-auto py-3", loanPurpose === 'aprendizaje' ? 'bg-green-600 text-white hover:bg-green-600/90' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
                                    onClick={() => setLoanPurpose('aprendizaje')}
                                >
                                    <GraduationCap className="mr-2" />
                                    <div className="flex flex-col items-center text-center flex-grow">
                                        <span className="font-bold whitespace-normal">Actividad de aprendizaje</span>
                                    </div>
                                </Button>
                                <Button
                                    size="lg"
                                    className={cn("h-auto py-3", loanPurpose === 'institucional' ? 'bg-green-600 text-white hover:bg-green-600/90' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
                                    onClick={() => setLoanPurpose('institucional')}
                                >
                                    <Building className="mr-2" />
                                    <div className="flex flex-col items-center text-center flex-grow">
                                        <span className="font-bold whitespace-normal">Uso institucional</span>
                                    </div>
                                </Button>
                            </div>
                            <Separator />

                            <UserSelector
                                selectedUser={selectedUser}
                                onUserSelect={setSelectedUser}
                                disabled={currentUser?.role === 'Docente'}
                            />

                            {loanPurpose === 'aprendizaje' && (
                                <div className="space-y-4 border-t pt-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <Label>Área Curricular</Label>
                                            <Select value={selectedArea} onValueChange={setSelectedArea}>
                                                <SelectTrigger className="mt-2">
                                                    <SelectValue placeholder="Selecciona un área" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {areas.map(area => <SelectItem key={area.id} value={area.name}>{area.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Grado</Label>
                                            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                                                <SelectTrigger className="mt-2">
                                                    <SelectValue placeholder="Selecciona un grado" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {grades.map(grade => <SelectItem key={grade.id} value={grade.name}>{grade.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Sección</Label>
                                            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedGrade}>
                                                <SelectTrigger className="mt-2">
                                                    <SelectValue placeholder="Selecciona una sección" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {sectionsForSelectedGrade.map(section => <SelectItem key={section.id} value={section.name}>{section.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {loanPurpose === 'institucional' && (
                                <div className="space-y-2 border-t pt-6">
                                    <Label htmlFor="internal-usage-details" className="text-sm font-medium">Nombre del Taller, Curso o Colegiado</Label>
                                    <Input
                                        id="internal-usage-details"
                                        placeholder="Ej: Taller de Robótica Avanzada"
                                        value={internalUsageDetails}
                                        onChange={(e) => setInternalUsageDetails(e.target.value)}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>2. Selecciona los Horarios</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ReservationCalendar
                                mode="new"
                                reservations={reservations}
                                selectedSlots={selectedSlots}
                                onSlotToggle={handleSlotToggle}
                             />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (Summary) */}
                <div className="lg:sticky top-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen de la Reserva</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4 text-sm">
                                <div className="flex items-start gap-3">
                                    <User className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold">Docente:</span>
                                        <span className="text-muted-foreground">{selectedUser?.name || 'No seleccionado'}</span>
                                    </div>
                                </div>
                                 <div className="flex items-start gap-3">
                                    {loanPurpose === 'aprendizaje' ? <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0"/> : <Building className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />}
                                    <div className="flex flex-col">
                                        <span className="font-semibold">Propósito:</span>
                                        <span className="text-muted-foreground capitalize">{loanPurpose === 'aprendizaje' ? 'Actividad de Aprendizaje' : 'Uso Institucional'}</span>
                                    </div>
                                </div>
                                 <div className="flex items-start gap-3">
                                    <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold">Actividad:</span>
                                        <span className="text-muted-foreground">
                                             {loanPurpose === 'institucional'
                                                ? (internalUsageDetails || 'N/A')
                                                : (selectedArea ? [selectedArea, selectedGrade, selectedSection].filter(Boolean).join(' - ') : 'N/A')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                    Horarios Seleccionados ({selectedSlots.length})
                                </h4>
                                <div className="space-y-3 text-sm max-h-60 overflow-y-auto pr-2">
                                    {groupedSlots.map(([dateStr, times]) => (
                                        <div key={dateStr}>
                                            <p className="font-medium capitalize text-muted-foreground">
                                                {format(parseISO(dateStr), "eeee, d 'de' MMMM", { locale: es })}
                                            </p>
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {times.sort().map(time => (
                                                    <Badge key={time} variant="secondary" className="font-normal gap-1.5 pr-1.5">
                                                        {time}
                                                        <button 
                                                            onClick={() => handleSlotToggle(`${dateStr}T${time}`)}
                                                            className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                                                            aria-label={`Quitar ${time}`}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {selectedSlots.length === 0 && (
                                        <p className="text-center text-muted-foreground py-4">
                                            Selecciona uno o más horarios del calendario.
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Separator />
                            <Button
                                size="lg"
                                className="w-full"
                                disabled={!isFormValid() || isSubmitting}
                                onClick={handleConfirmReservation}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Confirmando...
                                    </>
                                ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Confirmar Reserva
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
