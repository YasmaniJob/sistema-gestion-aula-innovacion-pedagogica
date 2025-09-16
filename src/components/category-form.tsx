
'use client';

import { useState, useEffect } from 'react';
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
import { DialogFooter } from './ui/dialog';
import { categoryNames, getCategoryVisuals } from '@/domain/constants';
import type { Category } from '@/domain/types';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';
import { ScrollArea } from './ui/scroll-area';

const categorySchema = z.object({
  types: z.array(z.string()),
  customCategory: z.string().optional(),
}).refine(data => data.types.length > 0 || (data.customCategory && data.customCategory.trim() !== ''), {
    message: 'Debes seleccionar al menos una categoría predefinida o añadir una personalizada.',
    path: ['types'],
});


export type CategoryFormData = z.infer<typeof categorySchema>;

type CategoryFormProps = {
  onSubmit: (values: CategoryFormData) => void;
  onCancel: () => void;
  existingCategories: Category[];
};

export function CategoryForm({ onSubmit, onCancel, existingCategories }: CategoryFormProps) {
  const [showCustomField, setShowCustomField] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      types: [],
      customCategory: '',
    },
  });
  
  const handleInternalSubmit = (data: CategoryFormData) => {
    const combinedData = {
        ...data,
        types: data.customCategory ? [...data.types, data.customCategory.trim()] : data.types,
    };
    onSubmit(combinedData);
  }

  const categoryTypesForRender = categoryNames.map(name => ({
    name,
    ...getCategoryVisuals(name)
  }));


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleInternalSubmit)} className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name="types"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipos de Categoría</FormLabel>
              <FormControl>
                <ScrollArea className="h-72 w-full pr-4">
                {!isClient ? (
                   <div className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-3 md:grid-cols-4">
                      {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
                   </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-3">
                    {categoryTypesForRender.map((type) => {
                      const isExisting = existingCategories.some(c => c.name === type.name);
                      const isSelected = field.value?.includes(type.name);
                      const isDisabled = isExisting;
                      const Icon = type.icon;

                      return (
                        <div
                          key={type.name}
                          className={cn(
                            'relative flex flex-col items-center justify-center gap-2 rounded-md border p-4 transition-all',
                            !isDisabled && 'cursor-pointer hover:shadow-lg',
                            isSelected && !isDisabled && 'border-2 border-primary',
                            isDisabled && 'opacity-50 cursor-not-allowed'
                          )}
                          onClick={() => {
                            if (isDisabled) return;
                            
                            const currentValues = field.value || [];
                            if (currentValues.includes(type.name)) {
                              field.onChange(
                                currentValues.filter((value) => value !== type.name)
                              );
                            } else {
                              field.onChange([...currentValues, type.name]);
                            }
                          }}
                        >
                              <Icon
                                className={cn('h-8 w-8', isDisabled ? 'text-muted-foreground' : type.color)}
                              />
                              <span className="text-xs font-medium text-center">
                                {type.name}
                              </span>
                              {isDisabled && <span className="text-xs font-bold absolute top-1 right-1 text-muted-foreground">(ya existe)</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
                </ScrollArea>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
         <Separator />

         <Button type="button" variant="outline" onClick={() => setShowCustomField(!showCustomField)}>
            Añadir otra categoría
        </Button>
        
        {showCustomField && (
            <FormField
              control={form.control}
              name="customCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Nueva Categoría</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Kits de Robótica" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        )}


        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Añadir Categorías</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
