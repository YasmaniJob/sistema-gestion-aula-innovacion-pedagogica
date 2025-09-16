

'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { useData } from '@/context/data-provider-refactored';
import { Loader2 } from 'lucide-react';


export function CustomizationTab() {
  const { 
      appSettings,
      updateAppSettings
  } = useData();
  
  const [localSettings, setLocalSettings] = useState(appSettings);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLocalSettings(appSettings);
  }, [appSettings]);


  const handleInputChange = (field: keyof typeof localSettings, value: string) => {
    setLocalSettings(prev => ({...prev, [field]: value}));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await updateAppSettings(localSettings);
      toast({
        title: '¡Guardado!',
        description: 'Los cambios de personalización han sido aplicados y guardados.',
      });
    } catch(e: any) {
        toast({
            title: 'Error al Guardar',
            description: e.message || 'No se pudieron guardar los cambios.',
            variant: 'destructive',
        })
    } finally {
        setIsSaving(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalización Visual</CardTitle>
        <CardDescription>
          Ajusta la apariencia del sistema para que coincida con la identidad de tu institución.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="app-name">Nombre de la App</Label>
                <Input
                    id="app-name"
                    value={localSettings.appName}
                    onChange={(e) => handleInputChange('appName', e.target.value)}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="school-name">Nombre de la Institución</Label>
                <Input
                    id="school-name"
                    value={localSettings.schoolName}
                    onChange={(e) => handleInputChange('schoolName', e.target.value)}
                />
            </div>
        </div>
         <div className="space-y-2">
            <Label htmlFor="logo-url">URL del Logo</Label>
            <Input
                id="logo-url"
                type="text"
                placeholder="https://example.com/logo.png"
                value={localSettings.logoUrl}
                onChange={(e) => handleInputChange('logoUrl', e.target.value)}
            />
             <p className='text-sm text-muted-foreground'>
                Pega la URL de un logo alojado en un servicio externo.
            </p>
        </div>
        <div className="space-y-2">
            <Label htmlFor="background-image-url">URL de Imagen de Fondo</Label>
            <Input
                id="background-image-url"
                type="text"
                placeholder="https://example.com/background.jpg"
                value={localSettings.backgroundImageUrl}
                onChange={(e) => handleInputChange('backgroundImageUrl', e.target.value)}
            />
             <p className='text-sm text-muted-foreground'>
                URL de una imagen para usar como fondo en ciertas secciones de la aplicación.
            </p>
        </div>
        <Separator />
        <div className="space-y-2">
            <Label htmlFor='primary-color'>Color Principal (Acento)</Label>
            <p className='text-sm text-muted-foreground'>
                Este color se usará en botones, enlaces y otros elementos interactivos.
            </p>
            <div className="flex items-center gap-4 pt-2">
                <Input
                    id="primary-color"
                    type="color"
                    value={localSettings.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="h-12 w-24 p-1"
                />
                <div 
                    className="h-10 w-full rounded-md border flex items-center justify-center font-mono text-lg"
                    style={{ backgroundColor: localSettings.primaryColor, color: '#FFFFFF' }}
                >
                    {localSettings.primaryColor.toUpperCase()}
                </div>
            </div>
        </div>
        <div className="flex justify-end">
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Guardar Cambios
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
