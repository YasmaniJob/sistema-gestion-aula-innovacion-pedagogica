
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Info, PackageCheck, Smile, Meh, Frown, Tag, Cpu, MemoryStick, HardDrive, Hash, AlignLeft, Zap } from 'lucide-react';
import { categoryDetails } from '@/domain/constants';

const resourceFormSchema = z.object({
  brand: z.string().min(1, 'La marca es obligatoria.'),
  model: z.string().optional(),
  quantity: z.number().min(1).max(50),
  notes: z.string().optional(),
  attributes: z.record(z.string()).optional(),
  smartOptions: z.array(z.string()).optional(),
});

export type ResourceFormData = z.infer<typeof resourceFormSchema>;


type ResourceFormProps = {
    categoryName: string;
    onSubmit: (data: any) => void; 
    mode: 'add' | 'edit';
    initialData?: Partial<ResourceFormData>;
}

function SummaryItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number | undefined | null }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">{label}:</span>
                <span className="font-semibold">{value}</span>
            </div>
        </div>
    );
}


export function ResourceForm({ categoryName, onSubmit, mode, initialData }: ResourceFormProps) {
  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: initialData || {
      brand: '',
      model: '',
      quantity: 1,
      notes: '',
      attributes: {},
      smartOptions: [],
    },
  });

  const watchedValues = useWatch({ control: form.control });
  const isEditMode = mode === 'edit';
  
  const details = categoryDetails[categoryName] || categoryDetails['Default'];

  const handleAttributeChange = (key: string, value: string) => {
    form.setValue('attributes', {
        ...form.getValues('attributes'),
        [key]: value,
    });
  }
  
  const technicalDetailsSubtitle = details.technicalDetails.length > 0
    ? `Añade especificaciones como ${details.technicalDetails.slice(0, 2).map(d => d.label).join(', ')}, etc.`
    : 'Añade especificaciones adicionales para este recurso.';


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Columna Izquierda: Formulario */}
      <div className="lg:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Información Principal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Marca (Obligatorio)</FormLabel>
                                <FormControl>
                                    <Input placeholder={details.brandPlaceholder} {...field} />
                                </FormControl>
                                <FormMessage />
                                {details.suggestedBrands.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {details.suggestedBrands.map(brand => (
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm" 
                                                key={brand}
                                                onClick={() => form.setValue('brand', brand)}
                                            >
                                                {brand}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Modelo (Opcional)</FormLabel>
                                <FormControl>
                                    <Input placeholder={details.modelPlaceholder} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <Collapsible>
                 <CollapsibleTrigger asChild>
                    <button type="button" className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="text-left">
                            <h3 className="font-semibold">Detalles Técnicos (Opcional)</h3>
                            <p className="text-sm text-muted-foreground">{technicalDetailsSubtitle}</p>
                        </div>
                        <ChevronDown className="h-5 w-5" />
                    </button>
                 </CollapsibleTrigger>
                 <CollapsibleContent className="pt-4">
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                           {details.technicalDetails.length > 0 ? (
                                details.technicalDetails.map(attr => (
                                    <FormField
                                        key={attr.label}
                                        control={form.control}
                                        name={`attributes.${attr.label}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{attr.label}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} onChange={(e) => handleAttributeChange(attr.label, e.target.value)} value={watchedValues.attributes?.[attr.label] || ''} />
                                                </FormControl>
                                                 {attr.suggestions && attr.suggestions.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 pt-2">
                                                        {attr.suggestions.map(suggestion => (
                                                            <Button 
                                                                type="button" 
                                                                variant="outline" 
                                                                size="sm" 
                                                                key={suggestion}
                                                                onClick={() => handleAttributeChange(attr.label, suggestion)}
                                                            >
                                                                {suggestion}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                )}
                                            </FormItem>
                                        )}
                                    />
                                ))
                           ) : (
                             <p className="text-sm text-muted-foreground text-center">
                                No hay detalles técnicos específicos para esta categoría.
                             </p>
                           )}
                        </CardContent>
                    </Card>
                 </CollapsibleContent>
            </Collapsible>
            
            {!isEditMode && (
                <Card>
                    <CardHeader>
                        <CardTitle>Configuración de Creación</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cantidad a crear: {field.value}</FormLabel>
                                    <FormControl>
                                        <Slider 
                                            min={1} 
                                            max={50} 
                                            step={1}
                                            value={[field.value]}
                                            onValueChange={(value) => field.onChange(value[0])}
                                            disabled={isEditMode}
                                        />
                                    </FormControl>
                                    {isEditMode && <FormDescription>La cantidad no se puede editar.</FormDescription>}
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas (Opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Cualquier información adicional, como la ubicación de almacenamiento, accesorios incluidos, etc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            )}

            {!isEditMode && details.smartOptions && details.smartOptions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Opciones Inteligentes
                        </CardTitle>
                        <CardDescription>
                            Selecciona para crear automáticamente accesorios relacionados
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {details.smartOptions.map((option, index) => (
                            <FormField
                                key={index}
                                control={form.control}
                                name="smartOptions"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(option.label) || false}
                                                onCheckedChange={(checked) => {
                                                    const currentOptions = field.value || [];
                                                    if (checked) {
                                                        field.onChange([...currentOptions, option.label]);
                                                    } else {
                                                        field.onChange(currentOptions.filter(item => item !== option.label));
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="font-medium">
                                                {option.label}
                                            </FormLabel>
                                            <FormDescription>
                                                {option.description}
                                            </FormDescription>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Creará: {option.accessories.map(acc => `${acc.brand} ${acc.model}`).join(', ')}
                                            </div>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        ))}
                    </CardContent>
                </Card>
            )}

            {isEditMode && (
                <Card>
                    <CardHeader>
                        <CardTitle>Notas Adicionales</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas (Opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Cualquier información adicional, como la ubicación de almacenamiento, accesorios incluidos, etc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            )}

          </form>
        </Form>
      </div>

      {/* Columna Derecha: Resumen */}
      <div className="space-y-6">
         <Card className="sticky top-6">
            <CardHeader>
                <CardTitle>{isEditMode ? 'Editando Recurso' : 'Nuevo(s) Recurso(s)'}</CardTitle>
                <CardDescription>Para la categoría: <span className="font-semibold text-primary">{categoryName}</span></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                    <SummaryItem icon={Tag} label="Marca" value={watchedValues.brand} />
                    <SummaryItem icon={PackageCheck} label="Modelo" value={watchedValues.model} />
                    {!isEditMode && <SummaryItem icon={Hash} label="Cantidad" value={watchedValues.quantity} />}
                    {watchedValues.attributes && Object.entries(watchedValues.attributes).map(([key, value]) => (
                        <SummaryItem key={key} icon={Cpu} label={key} value={value} />
                    ))}
                    <SummaryItem icon={AlignLeft} label="Notas" value={watchedValues.notes} />
                </div>
                <Button 
                    size="lg" 
                    className="w-full mt-6"
                    onClick={form.handleSubmit(onSubmit)}
                >
                    {isEditMode ? 'Guardar Cambios' : `Añadir ${watchedValues.quantity || 0} Recurso(s)`}
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
