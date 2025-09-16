
'use client';

import type { Reservation } from '@/domain/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Clock,
    User,
    BookOpen,
    GraduationCap,
    Building,
    Hash,
    CheckCircle,
    XCircle,
    CircleSlash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReservationStatus } from '@/domain/types';

const statusConfig: Record<
  ReservationStatus,
  { icon: React.ElementType; label: string; className: string }
> = {
  Confirmada: {
    icon: Clock,
    label: 'Confirmada',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  Realizada: {
    icon: CheckCircle,
    label: 'Realizada',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  'No asistió': {
    icon: CircleSlash,
    label: 'No Asistió',
    className: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  Cancelada: {
    icon: XCircle,
    label: 'Cancelada',
    className: 'bg-red-100 text-red-800 border-red-300',
  },
};

type SearchResultItemProps = {
  reservation: Reservation;
};

export function SearchResultItem({ reservation }: SearchResultItemProps) {
  const { status, startTime, user, purpose, purposeDetails } = reservation;
  const config = statusConfig[status];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
            <div>
                <CardTitle className="text-lg">
                    {purposeDetails?.activityName || 'Actividad sin nombre'}
                </CardTitle>
                <CardDescription className="capitalize">
                    {format(startTime, "eeee, d 'de' MMMM 'del' yyyy", { locale: es })}
                </CardDescription>
            </div>
            <Badge className={cn('text-xs', config.className)}>
                <config.icon className="mr-1.5 h-3 w-3" />
                {config.label}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <Clock className="h-4 w-4 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">Horario</p>
            <p>{purposeDetails?.timeSlot || purposeDetails?.activityName || format(startTime, 'hh:mm a', { locale: es })}</p>
          </div>
        </div>
         <div className="flex items-start gap-3">
          {purpose === 'aprendizaje' ? <GraduationCap className="h-4 w-4 mt-0.5" /> : <Building className="h-4 w-4 mt-0.5" />}
          <div>
            <p className="font-semibold text-foreground">Propósito</p>
            <p>{purpose === 'aprendizaje' ? 'Actividad de Aprendizaje' : 'Uso Institucional'}</p>
          </div>
        </div>
        {purpose === 'aprendizaje' && purposeDetails?.grade && (
            <div className="flex items-start gap-3">
                <Hash className="h-4 w-4 mt-0.5" />
                <div>
                <p className="font-semibold text-foreground">Detalles Académicos</p>
                <p>{purposeDetails.grade}, {purposeDetails.section}</p>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
