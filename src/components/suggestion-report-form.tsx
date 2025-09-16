
'use client';

import { useState } from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Resource, SuggestionReport } from '@/domain/types';
import { cn } from '@/lib/utils';
import { Camera, Sparkles, Cog, Crosshair, Plus } from 'lucide-react';
import { Label } from './ui/label';
import { Badge as BadgeComponent } from './ui/badge'; // Alias import to avoid naming conflict

type SuggestionReportFormProps = {
  resource: Pick<Resource, 'id' | 'name' | 'brand'>;
  onReportChange: (report: SuggestionReport) => void;
};

const commonSuggestions = [
  { id: 'limpiar-sensor', label: 'Limpiar sensor', icon: Sparkles },
  { id: 'limpiar-lente', label: 'Limpiar lente', icon: Sparkles },
  { id: 'actualizar-firmware', label: 'Actualizar firmware', icon: Cog },
  { id: 'calibrar-enfoque', label: 'Calibrar enfoque', icon: Crosshair },
];

export function SuggestionReportForm({ resource, onReportChange }: SuggestionReportFormProps) {
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [otherNotes, setOtherNotes] = useState('');
  const [showOtherField, setShowOtherField] = useState(false);

  const createReport = (suggestions: string[], notes: string): SuggestionReport => ({
    commonSuggestions: suggestions,
    otherNotes: notes,
  });

  const toggleSuggestion = (suggestionId: string) => {
    const newSelectedSuggestions = selectedSuggestions.includes(suggestionId)
      ? selectedSuggestions.filter(p => p !== suggestionId)
      : [...selectedSuggestions, suggestionId];
    
    setSelectedSuggestions(newSelectedSuggestions);
    onReportChange(createReport(newSelectedSuggestions, otherNotes));
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setOtherNotes(newNotes);
    onReportChange(createReport(selectedSuggestions, newNotes));
  }

  const handleOtherClick = () => {
    const newShowOtherField = !showOtherField;
    setShowOtherField(newShowOtherField);
    if (!newShowOtherField) {
      setOtherNotes('');
      onReportChange(createReport(selectedSuggestions, ''));
    }
  };

  const reportCount = selectedSuggestions.length + (otherNotes.trim() ? 1 : 0);

  return (
    <AccordionItem value={resource.id}>
      <AccordionTrigger className={cn("hover:no-underline p-3 rounded-md", reportCount > 0 && 'bg-amber-500/10 hover:bg-amber-500/20')}>
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-sm font-medium text-left">{resource.name}</p>
                    <p className="text-xs text-muted-foreground text-left">{resource.brand}</p>
                </div>
            </div>
            {reportCount > 0 && (
                 <BadgeComponent variant="default" className="rounded-full bg-amber-500 hover:bg-amber-500/90">{reportCount}</BadgeComponent>
            )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-4 px-2">
        <div className="space-y-4">
            <div>
                <Label>Sugerencias Rápidas</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {commonSuggestions.map(suggestion => (
                        <Button
                            key={suggestion.id}
                            variant={selectedSuggestions.includes(suggestion.id) ? 'default' : 'outline'}
                            className={cn(selectedSuggestions.includes(suggestion.id) && 'bg-amber-500 text-white hover:bg-amber-500/90')}
                            onClick={() => toggleSuggestion(suggestion.id)}
                        >
                           <suggestion.icon className="h-4 w-4 mr-2" />
                           <span className="text-xs whitespace-normal text-center">{suggestion.label}</span>
                        </Button>
                    ))}
                </div>
            </div>
            <div>
                <Button
                    variant="outline"
                    onClick={handleOtherClick}
                    className={cn(showOtherField && 'bg-amber-500/10 border-amber-500/50')}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Otro (especificar)
                </Button>
            </div>
          {showOtherField && (
            <div>
              <Label htmlFor={`suggestion-notes-${resource.id}`}>Otros detalles</Label>
              <Textarea
                id={`suggestion-notes-${resource.id}`}
                placeholder="Ej: Sería bueno conseguir un nuevo trípode para esta cámara..."
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

    
