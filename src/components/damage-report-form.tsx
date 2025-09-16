
'use client';

import { useState } from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Resource, DamageReport } from '@/domain/types';
import { cn } from '@/lib/utils';
import { Camera, CameraOff, PowerOff, Unplug, ZapOff, Pencil } from 'lucide-react';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

type DamageReportFormProps = {
  resource: Pick<Resource, 'id' | 'name' | 'brand'>;
  onReportChange: (report: DamageReport) => void;
};

const commonProblems = [
  { id: 'no-power', label: 'No enciende', icon: PowerOff },
  { id: 'no-focus', label: 'No enfoca', icon: CameraOff },
  { id: 'bad-battery', label: 'Batería falla', icon: ZapOff },
  { id: 'bad-cable', label: 'Cable dañado', icon: Unplug },
];

export function DamageReportForm({ resource, onReportChange }: DamageReportFormProps) {
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [otherNotes, setOtherNotes] = useState('');
  const [showOtherField, setShowOtherField] = useState(false);

  const createReport = (problems: string[], notes: string): DamageReport => ({
    commonProblems: problems,
    otherNotes: notes,
  });

  const toggleProblem = (problemId: string) => {
    const newSelectedProblems = selectedProblems.includes(problemId)
        ? selectedProblems.filter(p => p !== problemId)
        : [...selectedProblems, problemId];
    
    setSelectedProblems(newSelectedProblems);
    onReportChange(createReport(newSelectedProblems, otherNotes));
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setOtherNotes(newNotes);
    onReportChange(createReport(selectedProblems, newNotes));
  }

  const handleOtherClick = () => {
    const newShowOtherField = !showOtherField;
    setShowOtherField(newShowOtherField);
    if (!newShowOtherField) {
      setOtherNotes('');
      onReportChange(createReport(selectedProblems, ''));
    }
  };

  const reportCount = selectedProblems.length + (otherNotes.trim() ? 1 : 0);

  return (
    <AccordionItem value={resource.id}>
      <AccordionTrigger className={cn("hover:no-underline p-3 rounded-md", reportCount > 0 && 'bg-destructive/10 hover:bg-destructive/20')}>
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-sm font-medium text-left">{resource.name}</p>
                    <p className="text-xs text-muted-foreground text-left">{resource.brand}</p>
                </div>
            </div>
            {reportCount > 0 && (
                 <Badge variant="destructive" className="rounded-full">{reportCount}</Badge>
            )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-4 px-2">
        <div className="space-y-4">
            <div>
                <Label>Problemas comunes</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {commonProblems.map(problem => (
                        <Button
                            key={problem.id}
                            variant={selectedProblems.includes(problem.id) ? 'destructive' : 'outline'}
                            onClick={() => toggleProblem(problem.id)}
                            className="h-auto flex flex-col gap-1.5 p-2"
                        >
                           <problem.icon className="h-5 w-5" />
                           <span className="text-xs whitespace-normal text-center">{problem.label}</span>
                        </Button>
                    ))}
                </div>
            </div>
          <div>
            <Button
                variant={showOtherField ? 'destructive' : 'outline'}
                onClick={handleOtherClick}
            >
                <Pencil className="h-4 w-4 mr-2" />
                Otro (especificar)
            </Button>
          </div>
          {showOtherField && (
            <div>
              <Label htmlFor={`damage-notes-${resource.id}`}>Otros detalles</Label>
              <Textarea
                id={`damage-notes-${resource.id}`}
                placeholder="Ej: La pantalla del visor está rota, hace un ruido extraño al encender..."
                value={otherNotes}
                onChange={handleNotesChange}
                className="min-h-[80px] mt-2"
              />
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
