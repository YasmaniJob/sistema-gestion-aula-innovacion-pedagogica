
'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { useState } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { BookCopy, CheckCircle, Plus } from 'lucide-react';
import type { Area } from '@/domain/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

const commonAreas = [
  'Arte y Cultura',
  'Ciencia y Tecnología',
  'Ciencias Sociales',
  'Comunicación',
  'Desarrollo Personal, Ciudadanía y Cívica',
  'Educación Física',
  'Educación para el Trabajo',
  'Educación Religiosa',
  'Inglés',
  'Matemática',
];

const areaSchema = z.object({
  names: z.array(z.string()).min(1, 'Debes seleccionar o añadir al menos un área.'),
});

export type AreaFormData = z.infer<typeof areaSchema>;

type AreaFormProps = {
  onSubmit: (values: {names: string[]}) => void;
  onCancel: () => void;
  existingAreas: Area[];
  editingArea: Area | null;
};

export function AreaForm({ onSubmit, onCancel, existingAreas, editingArea }: AreaFormProps) {
  const isEditMode = !!editingArea;
  const [customArea, setCustomArea] = useState('');
  const [isCustomAreaOpen, setIsCustomAreaOpen] = useState(false);

  const form = useForm<AreaFormData>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      names: isEditMode ? [editingArea.name] : [],
    },
  });
  
  const selectedNames = form.watch('names') || [];
  const allPossibleAreas = Array.from(new Set([...commonAreas, ...existingAreas.map(a => a.name) ,...selectedNames]));

  const handleToggleArea = (areaName: string) => {
    const isSelected = selectedNames.includes(areaName);
    const newValues = isSelected
      ? selectedNames.filter((name) => name !== areaName)
      : [...selectedNames, areaName];
    form.setValue('names', newValues, { shouldValidate: true });
  };
  
  const handleAddCustom = () => {
    const trimmed = customArea.trim();
    if (trimmed && !selectedNames.includes(trimmed)) {
      form.setValue('names', [...selectedNames, trimmed], { shouldValidate: true });
    }
    setCustomArea('');
  }

  if (isEditMode) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-4">
          <FormField
            control={form.control}
            name="names.0"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Área</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Arte y Cultura" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </Form>
    );
  }

  // Add mode
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <ScrollArea className="h-64 pr-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {allPossibleAreas.map((area) => {
                  const isExisting = existingAreas.some(ea => ea.name === area);
                  const isSelected = selectedNames.includes(area);
                  const isDisabled = isExisting && !isSelected;

                  return (
                      <button
                          type="button"
                          key={area}
                          onClick={() => !isDisabled && handleToggleArea(area)}
                          className={cn(
                              'relative flex h-16 items-center justify-center rounded-lg border p-2 text-center text-sm font-medium transition-all',
                              isSelected && !isDisabled && 'border-2 border-primary shadow-lg',
                              isDisabled && 'cursor-not-allowed bg-muted/50 opacity-60',
                              !isDisabled && 'hover:shadow-lg'
                          )}
                          disabled={isDisabled}
                      >
                           {isSelected && !isDisabled && (
                              <CheckCircle className="absolute top-1 right-1 h-4 w-4 text-primary" />
                           )}
                          <span className="leading-tight">{area}</span>
                          {isDisabled && <span className="sr-only">(Ya añadido)</span>}
                      </button>
                  );
              })}
          </div>
        </ScrollArea>
        <FormMessage>{form.formState.errors.names?.message}</FormMessage>
        
        <Separator />

        <Collapsible open={isCustomAreaOpen} onOpenChange={setIsCustomAreaOpen}>
          <CollapsibleTrigger asChild>
             <Button type="button" variant="outline">
                <Plus className="mr-2 h-4 w-4"/>Otro
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="flex gap-2">
                <Input 
                    placeholder="Escribe un nuevo nombre de área" 
                    value={customArea}
                    onChange={(e) => setCustomArea(e.target.value)}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustom();
                        }
                    }}
                />
                <Button type="button" onClick={handleAddCustom}>Añadir</Button>
            </div>
          </CollapsibleContent>
        </Collapsible>


        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Añadir ({selectedNames.length}) Áreas</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
