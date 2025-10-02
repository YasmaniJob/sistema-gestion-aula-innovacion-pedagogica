
import { useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const userFormSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  dni: z.string().length(8, 'El DNI debe tener exactamente 8 caracteres.').regex(/^\d+$/, 'El DNI solo debe contener números.'),
  email: z.string().email('El correo electrónico no es válido.'),
  role: z.enum(['Admin', 'Docente']),
});

export type UserFormData = z.infer<typeof userFormSchema>;

type UserFormProps = {
  onSubmit: (values: UserFormData) => void;
  onCancel: () => void;
  mode: 'add' | 'edit';
  initialData?: Partial<UserFormData>;
  isEditingRole?: boolean;
};

export function UserForm({ onSubmit, onCancel, mode, initialData, isEditingRole = true }: UserFormProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      dni: '',
      email: '',
      role: 'Docente' as const,
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        dni: initialData.dni || '',
        email: initialData.email || '',
        role: initialData.role || 'Docente',
      });
    }
  }, [initialData, form]);

  const isLoading = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <div className="space-y-4">
           <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Maria López" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: mlopez@correo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
            control={form.control}
            name="dni"
            render={({ field }) => (
                <FormItem>
                <FormLabel>DNI</FormLabel>
                <FormControl>
                    <Input placeholder="Documento de 8 dígitos" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!isEditingRole}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Docente">Docente</SelectItem>
                    </SelectContent>
                  </Select>
                  {!isEditingRole && <FormMessage>El rol no se puede cambiar para un administrador existente.</FormMessage>}
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : (mode === 'edit' ? 'Guardar Cambios' : 'Añadir Usuario')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
