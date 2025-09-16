
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronRight,
  Users,
  ClipboardList,
  Plus,
  Trash2,
  Loader2,
  Check,
  Book,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { LoanUser, AgreementTask, GenericParticipant, Meeting } from '@/domain/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { participantRoles } from '@/domain/constants';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useAuthorization } from '@/hooks/use-authorization';
import { useData } from '@/context/data-provider-refactored';
import { usePageTitle } from '@/hooks/use-page-title';

const colegiadoAreas = ['Comunicación', 'Matemática', 'Ciencias', 'Sociales', 'Inglés', 'Arte'];

export default function NewMeetingPage() {
  useAuthorization('Admin');
  usePageTitle('Nueva Reunión');
  const { users, addMeeting, currentUser } = useData();
  const [title, setTitle] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<GenericParticipant[]>([]);
  const [selectedColegiadoAreas, setSelectedColegiadoAreas] = useState<string[]>([]);
  const [otherParticipants, setOtherParticipants] = useState('');
  const [tasks, setTasks] = useState<Omit<AgreementTask, 'status' | 'responsibleId'> & { responsibleId?: string }>([])
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const toggleParticipant = (participant: GenericParticipant) => {
    const isSelected = selectedParticipants.includes(participant);
    
    // If we are deselecting 'docentes', also clear the colegiado areas
    if (participant === 'docentes' && isSelected) {
      setSelectedColegiadoAreas([]);
    }

    // If we are deselecting 'otros', clear the text field
    if (participant === 'otros' && isSelected) {
        setOtherParticipants('');
    }

    setSelectedParticipants(prev =>
      isSelected
        ? prev.filter(p => p !== participant)
        : [...prev, participant]
    );
  };
  
  const toggleColegiadoArea = (area: string) => {
    setSelectedColegiadoAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  }

  const handleAddTask = () => {
    setTasks(prev => [...prev, { id: `task-${Date.now()}`, description: '', notes: '' }]);
  }
  
  const handleTaskChange = (taskId: string, field: 'description' | 'notes', value: string) => {
    setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, [field]: value } : task
    ));
  }

  const removeTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }

  const handleSaveMeeting = async () => {
    if (!currentUser) {
        toast({
            title: "Usuario no encontrado",
            description: "No se pudo identificar al usuario que crea la reunión.",
            variant: "destructive",
        });
        return;
    }
    
    setIsSubmitting(true);
    
    const newMeetingData: Omit<Meeting, 'id' | 'date'> = {
      title,
      participants: [], // Participants are derived from roles, not individual users for now
      genericParticipants: selectedParticipants,
      colegiadoAreas: selectedColegiadoAreas,
      otherParticipants: otherParticipants,
      tasks: tasks.map(t => ({
          ...t, 
          status: 'pending',
          responsibleId: currentUser.id,
      })),
    };

    try {
        await addMeeting(newMeetingData);
        toast({
            title: "Reunión Guardada Exitosamente",
            description: `La reunión "${title}" ha sido registrada.`,
        });
        router.push('/meetings');
    } catch(e: any) {
        toast({ title: 'Error al Guardar', description: e.message, variant: 'destructive'});
    } finally {
        setIsSubmitting(false);
    }
  }

  const isFormValid = title.trim() !== '' && selectedParticipants.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Link href="/meetings" className="hover:text-primary">
              Reuniones
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-primary">Nueva Reunión</span>
          </div>
        </div>
      </div>
      <h1 className="text-3xl font-bold hidden sm:block">Crear Nueva Reunión</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>
                Define el tema principal de la reunión y quiénes participarán.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="meeting-title">Título de la Reunión</Label>
                <Input
                  id="meeting-title"
                  placeholder="Ej: Planificación de la Semana de la Ciencia"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <Separator />
              <div className="space-y-4">
                <Label>Actores Educativos Involucrados</Label>
                 <p className="text-sm text-muted-foreground">
                    Selecciona todos los grupos que participan en esta reunión.
                </p>
                <div className="flex flex-wrap gap-2">
                    {participantRoles.map(({name, label, icon: Icon}) => (
                        <Button 
                            key={name} 
                            variant={selectedParticipants.includes(name) ? 'default' : 'outline'}
                            onClick={() => toggleParticipant(name)}
                        >
                            <Icon className="mr-2 h-4 w-4"/> {label}
                        </Button>
                    ))}
                </div>
              </div>
              
              {selectedParticipants.includes('docentes') && (
                <div className="space-y-4 pt-6 border-t">
                    <Label>Áreas de Trabajo Colegiado</Label>
                    <p className="text-sm text-muted-foreground">
                        Selecciona las áreas que participan en el trabajo colegiado.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {colegiadoAreas.map(area => (
                            <Button 
                                key={area} 
                                variant={selectedColegiadoAreas.includes(area) ? 'default' : 'outline'}
                                onClick={() => toggleColegiadoArea(area)}
                            >
                                {area}
                            </Button>
                        ))}
                    </div>
                </div>
              )}

              {selectedParticipants.includes('otros') && (
                <div className="space-y-2 pt-6 border-t">
                    <Label htmlFor="other-participants">Especificar "Otros"</Label>
                    <Textarea 
                        id="other-participants"
                        placeholder="Ej: Padres de Familia, etc."
                        value={otherParticipants}
                        onChange={(e) => setOtherParticipants(e.target.value)}
                    />
                </div>
              )}

            </CardContent>
          </Card>

          {/* Agreements and Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Acuerdos y Tareas</CardTitle>
              <CardDescription>
                El responsable de los acuerdos será asignado automáticamente. Registra las tareas que surjan de la reunión.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.length > 0 && (
                <div className="space-y-4">
                    {tasks.map((task, index) => (
                        <div key={task.id} className="p-4 border rounded-lg space-y-4 relative">
                            <div className="flex items-center justify-between">
                                <Label htmlFor={`task-desc-${task.id}`} className="font-semibold">Tarea {index + 1}</Label>
                                <Button variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => removeTask(task.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                    <span className="sr-only">Eliminar tarea</span>
                                </Button>
                            </div>
                            <div className="grid gap-2">
                                <Input
                                    id={`task-desc-${task.id}`}
                                    placeholder="Descripción breve del acuerdo o tarea"
                                    value={task.description}
                                    onChange={(e) => handleTaskChange(task.id, 'description', e.target.value)}
                                />
                           </div>
                           <div className="grid grid-cols-1 gap-4">
                                 <div className="grid gap-2">
                                    <Label htmlFor={`task-notes-${task.id}`}>Notas (Opcional)</Label>
                                    <Input
                                        id={`task-notes-${task.id}`}
                                        placeholder="Detalles adicionales"
                                        value={task.notes || ''}
                                        onChange={(e) => handleTaskChange(task.id, 'notes', e.target.value)}
                                    />
                                </div>
                           </div>
                        </div>
                    ))}
                </div>
              )}
               <div className="text-center pt-2">
                    <Button variant="outline" onClick={handleAddTask}>
                        <Plus className="mr-2 h-4 w-4" /> Añadir Tarea
                    </Button>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Summary) */}
        <div className="lg:sticky top-6">
          <Card>
            <CardHeader>
              <CardTitle>Nueva Reunión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Título</Label>
                    <p className="text-sm font-semibold">{title || 'No definido'}</p>
                </div>
                <Separator />
                <div className="space-y-4">
                    <div className="font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground"/>
                        Participantes ({selectedParticipants.length})
                    </div>
                     <div className="flex flex-wrap gap-1 text-sm text-muted-foreground">
                        {selectedParticipants.length > 0 ? selectedParticipants.map(p => (
                            <span key={p} className="p-1.5 bg-muted/50 rounded-md text-xs">{participantRoles.find(role => role.name === p)?.label}</span>
                        )) : (
                            <p className="text-xs">No hay grupos seleccionados.</p>
                        )}
                     </div>
                </div>

                {selectedParticipants.includes('docentes') && selectedColegiadoAreas.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                        <div className="font-medium flex items-center gap-2">
                            <Book className="h-4 w-4 text-muted-foreground"/>
                            Áreas Colegiadas ({selectedColegiadoAreas.length})
                        </div>
                        <div className="flex flex-wrap gap-1 text-sm text-muted-foreground">
                            {selectedColegiadoAreas.map(area => (
                                <span key={area} className="p-1.5 bg-muted/50 rounded-md text-xs">{area}</span>
                            ))}
                        </div>
                    </div>
                  </>
                )}

                <Separator />
                <div className="space-y-2">
                    <div className="font-medium flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-muted-foreground"/>
                        Acuerdos / Tareas ({tasks.length})
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground max-h-48 overflow-y-auto pr-2">
                        {tasks.length > 0 ? tasks.map(task => (
                            <div key={task.id} className="p-2 bg-muted/50 rounded-md truncate">
                                {task.description || "Nueva tarea..."}
                            </div>
                        )) : (
                            <p className="text-xs">No hay tareas añadidas.</p>
                        )}
                    </div>
                </div>
              <Button 
                size="lg" 
                className="w-full mt-4"
                disabled={!isFormValid || isSubmitting}
                onClick={handleSaveMeeting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Guardar Reunión
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
