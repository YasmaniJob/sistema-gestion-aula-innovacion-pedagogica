
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, User, Loader2 } from 'lucide-react';
import type { LoanUser } from '@/domain/types';
import { useData } from '@/context/data-provider-refactored';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
    const { toast } = useToast();
    const { currentUser, isLoadingUser } = useData();

    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, collect form data and send to the API.
        toast({
            title: '¡Perfil Actualizado!',
            description: 'Tus cambios han sido guardados exitosamente.'
        })
    }
    
    if (isLoadingUser) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                  <Skeleton className="h-9 w-48" />
                  <Skeleton className="h-5 w-80 mt-2" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-60 w-full" />
                    <Skeleton className="h-72 w-full" />
                </div>
            </div>
        );
    }
    
    if (!currentUser) {
        return (
            <div className="text-center">
                <p>No se pudo cargar el perfil de usuario.</p>
            </div>
        )
    }

  return (
    <form onSubmit={handleSaveChanges} className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y la configuración de tu cuenta.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5"/>
                    Información Personal
                </CardTitle>
                <CardDescription>
                    Tu nombre y dirección de correo electrónico. El DNI y el Rol no se pueden cambiar.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input id="name" defaultValue={currentUser.name} />
                    </div>
                        <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" type="email" defaultValue={currentUser.email} />
                    </div>
                </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="dni">DNI</Label>
                        <Input id="dni" defaultValue={currentUser.dni} disabled />
                    </div>
                        <div className="space-y-2">
                        <Label htmlFor="role">Rol</Label>
                        <Input id="role" defaultValue={currentUser.role} disabled />
                    </div>
                </div>
            </CardContent>
        </Card>

        {currentUser.role === 'Admin' && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5" />
                        Contraseña
                    </CardTitle>
                    <CardDescription>
                        Para cambiar tu contraseña, ingresa tu contraseña actual y luego la nueva.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Contraseña Actual</Label>
                        <Input id="current-password" type="password" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Nueva Contraseña</Label>
                            <Input id="new-password" type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                            <Input id="confirm-password" type="password" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}
        
        <div className="flex justify-end">
            <Button type="submit">
                Guardar Cambios
            </Button>
        </div>
      </div>
    </form>
  );
}
