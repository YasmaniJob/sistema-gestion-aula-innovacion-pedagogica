

'use client';

import type { Meeting } from '@/domain/types';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Calendar,
  CheckSquare,
  Users,
  User,
  ClipboardList,
  Book,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { useData } from '@/context/data-provider-refactored';
import { participantRoles } from '@/domain/constants';

type MeetingCardProps = {
  meeting: Meeting;
  onTaskToggle: (meetingId: string, taskId: string) => void;
};

export function MeetingCard({ meeting, onTaskToggle }: MeetingCardProps) {
  const { id, title, date, participants, tasks, genericParticipants, colegiadoAreas, otherParticipants } = meeting;
  const { findUserById } = useData();

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  
  const getParticipantLabel = (roleName: string) => {
    return participantRoles.find(r => r.name === roleName)?.label || roleName;
  }

  return (
    <AccordionItem value={id} className="border rounded-lg">
      <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:border-b">
        <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="grid gap-1 text-left">
                <p className="font-bold text-base">{title}</p>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4"/>
                    <span>{format(date, "d 'de' MMMM, yyyy", { locale: es })}</span>
                </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                <div className="flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4"/>
                    <span>{completedTasks}/{totalTasks} Tareas</span>
                </div>
                 <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4"/>
                    <span>{genericParticipants.length} Grupos</span>
                </div>
            </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-4 pt-4">
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
                <h4 className="font-semibold flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4"/>Actores Educativos</h4>
                <div className="grid grid-cols-2 gap-2">
                    {genericParticipants.map(p => (
                        <div key={p} className="flex items-center justify-start p-2 rounded-md bg-muted/50">
                             <span className="text-sm font-medium">{getParticipantLabel(p)}</span>
                        </div>
                    ))}
                    {colegiadoAreas && colegiadoAreas.length > 0 && (
                      <div className="p-2 rounded-md bg-muted/50 col-span-2">
                        <p className="text-sm font-medium flex items-center gap-2"><Book className="h-4 w-4" /> Trabajo Colegiado</p>
                        <div className="flex flex-wrap gap-1 pt-2">
                           {colegiadoAreas.map(area => (
                            <Badge key={area} variant="secondary" className="font-normal">{area}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {otherParticipants && (
                        <div className="p-2 rounded-md bg-muted/50 col-span-2">
                             <p className="text-sm font-medium">{getParticipantLabel('otros')}</p>
                             <p className="text-xs text-muted-foreground pt-1">{otherParticipants}</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="md:col-span-2 space-y-4">
                 <h4 className="font-semibold flex items-center gap-2 text-muted-foreground"><ClipboardList className="h-4 w-4"/>Acuerdos y Tareas</h4>
                 <div className="space-y-3">
                    {tasks.length > 0 ? tasks.map(task => (
                        <div 
                            key={task.id} 
                            className="flex items-start gap-3 p-3 rounded-lg border bg-background has-[:checked]:bg-green-500/10 has-[:checked]:border-green-500/30 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => onTaskToggle(meeting.id, task.id)}
                        >
                            <Checkbox 
                                id={`task-${task.id}`} 
                                checked={task.status === 'completed'}
                                onCheckedChange={() => onTaskToggle(meeting.id, task.id)}
                                className="mt-1 pointer-events-none"
                            />
                            <div className="grid gap-1.5 leading-none w-full">
                                <Label 
                                    htmlFor={`task-${task.id}`} 
                                    className="text-sm font-medium data-[checked=true]:line-through"
                                >
                                    {task.description}
                                </Label>
                                {task.responsibleId && (
                                    <p className="text-xs text-muted-foreground">
                                        Responsable: {findUserById(task.responsibleId)?.name || 'No asignado'}
                                    </p>
                                )}
                                {task.notes && (
                                     <p className="text-xs text-muted-foreground">
                                        Notas: {task.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-center text-muted-foreground py-4">No hay tareas para esta reunión.</p>
                    )}
                 </div>
            </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
