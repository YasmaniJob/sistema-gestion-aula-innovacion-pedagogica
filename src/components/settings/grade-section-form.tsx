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
import { Input } from '../ui/input';

const sectionSchema = z.object({
  name: z.string().min(1, "La letra es obligatoria."),
  alias: z.string().optional(),
});

export type GradeSectionFormData = z.infer<typeof sectionSchema>;

type GradeSectionFormProps = {
  onSubmit: (values: GradeSectionFormData) => void;
  onCancel: () => void;
  isEditingAlias?: boolean;
  initialData?: GradeSectionFormData;
};

export function GradeSectionForm({
  onSubmit,
  onCancel,
  isEditingAlias = false,
  initialData
}: GradeSectionFormProps) {

  const form = useForm<GradeSectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: initialData || { name: '', alias: '' },
  });

  // This form is now only for editing an alias
  if (isEditingAlias) {
    return (
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
           <FormField
              control={form.control}
              name="alias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alias para Sección {initialData?.name}</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Los Valientes" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Form>
    )
  }
  
  // Return null or some placeholder if not in edit mode, as creation is handled directly.
  return null;
}
