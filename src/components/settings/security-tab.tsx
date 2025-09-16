

'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useData } from '@/context/data-provider-refactored';


export function SecurityTab() {
    const { appSettings, updateAppSettings } = useData();
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleToggleRegistration = async (isEnabled: boolean) => {
        setIsSaving(true);
        try {
            await updateAppSettings({ isPublicRegistrationEnabled: isEnabled });
            toast({
                title: `Registro Público ${isEnabled ? 'Habilitado' : 'Deshabilitado'}`,
                description: isEnabled 
                    ? 'Cualquier persona con el enlace podrá registrarse como administrador.' 
                    : 'El registro público ha sido desactivado.',
                variant: isEnabled ? 'destructive' : 'default',
            });
        } catch (e: any) {
            toast({
                title: 'Error al Guardar',
                description: e.message || 'No se pudo actualizar la configuración de seguridad.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seguridad y Acceso</CardTitle>
        <CardDescription>
          Controla cómo los nuevos usuarios pueden acceder al sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        <div className="flex items-center justify-between rounded-lg border p-4">
            <div className='space-y-0.5'>
                <Label htmlFor="registration-switch" className="text-base">
                    Habilitar Registro Público de Administradores
                </Label>
                <p className="text-sm text-muted-foreground">
                    Permite que nuevos usuarios se registren como administradores.
                </p>
            </div>
            <div className="flex items-center gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin"/>}
              <Switch
                  id="registration-switch"
                  checked={appSettings.isPublicRegistrationEnabled}
                  onCheckedChange={handleToggleRegistration}
                  disabled={isSaving}
              />
            </div>
        </div>
        
        {appSettings.isPublicRegistrationEnabled && (
             <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Advertencia de Seguridad</AlertTitle>
                <AlertDescription>
                    Habilitar el registro público es un riesgo de seguridad. Cualquier persona con acceso al enlace podrá crear una cuenta de administrador. Se recomienda deshabilitar esta opción tan pronto como sea posible.
                </AlertDescription>
            </Alert>
        )}

        <Card className="bg-muted/50">
            <CardHeader>
                <CardTitle className="text-base">Método de Acceso Recomendado</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                    Para máxima seguridad, se recomienda mantener el registro público deshabilitado.
                </p>
                <p>
                    Los nuevos administradores deben ser añadidos manualmente por un administrador existente desde la pestaña <span className="font-semibold text-primary">"Administradores"</span>.
                </p>
                 <p>
                    Los docentes y auxiliares son gestionados desde la sección <span className="font-semibold text-primary">"Personal"</span> y se autentican con su DNI y correo, sin necesidad de registro.
                </p>
            </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
