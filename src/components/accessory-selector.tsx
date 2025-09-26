'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle, Plug, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Resource } from '@/domain/types';

type SmartOption = {
  label: string;
  description: string;
  accessories: {
    category: string;
    brand: string;
    model: string;
    attributes?: Record<string, string>;
  }[];
  selected?: boolean;
};

type AccessorySelectorProps = {
  selectedMainResources: Resource[]; // Laptops/proyectores seleccionados
  availableAccessories: Resource[]; // Todos los accesorios disponibles
  selectedAccessories: Resource[]; // Accesorios ya seleccionados
  chargerIncluded: boolean; // Estado del switch de cargador
  availableChargers: Resource[]; // Cargadores disponibles
  smartOptions: SmartOption[]; // Opciones inteligentes disponibles
  onAccessoryToggle: (accessory: Resource) => void;
  onChargerToggle: () => void;
  onSmartOptionToggle: (optionLabel: string) => void;
};

export function AccessorySelector({
  selectedMainResources,
  availableAccessories,
  selectedAccessories,
  chargerIncluded,
  availableChargers,
  smartOptions,
  onAccessoryToggle,
  onChargerToggle,
  onSmartOptionToggle,
}: AccessorySelectorProps) {
  // Filtrar accesorios compatibles (excluyendo cargadores que se manejan por separado)
  const compatibleAccessories = useMemo(() => {
    if (selectedMainResources.length === 0) return [];
    
    return availableAccessories.filter(accessory => {
      // Excluir cargadores ya que se manejan por separado
      const isCharger = accessory.name.toLowerCase().includes('cargador') || 
                       accessory.name.toLowerCase().includes('charger') ||
                       accessory.name.toLowerCase().includes('adaptador de corriente');
      
      if (isCharger) return false;
      
      // Si es un accesorio marcado como tal
      if (accessory.isAccessory) {
        // Verificar si es compatible con alguno de los recursos seleccionados
        return selectedMainResources.some(mainResource => 
          accessory.compatibleWith?.includes(mainResource.id) ||
          mainResource.relatedAccessories?.includes(accessory.id)
        );
      }
      
      return false;
    });
  }, [selectedMainResources, availableAccessories]);

  // Agrupar accesorios por tipo (sin cargadores)
  const groupedAccessories = useMemo(() => {
    const groups: Record<string, Resource[]> = {};
    
    compatibleAccessories.forEach(accessory => {
      let groupKey = 'Otros';
      
      if (accessory.name.toLowerCase().includes('cable')) {
        groupKey = 'Cables';
      } else if (accessory.name.toLowerCase().includes('adaptador') && 
                !accessory.name.toLowerCase().includes('cargador')) {
        groupKey = 'Adaptadores';
      } else if (accessory.name.toLowerCase().includes('mouse') ||
                accessory.name.toLowerCase().includes('ratón')) {
        groupKey = 'Periféricos';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(accessory);
    });
    
    return groups;
  }, [compatibleAccessories]);

  const isAccessorySelected = (accessory: Resource) => {
    return selectedAccessories.some(selected => selected.id === accessory.id);
  };

  // Determinar si mostrar la sección de cargadores
  const showChargerSection = selectedMainResources.some(resource => 
    resource.category === 'Laptops' || resource.category === 'Tablets' || resource.category === 'Proyectores'
  );

  if (selectedMainResources.length === 0 || (smartOptions.length === 0 && compatibleAccessories.length === 0)) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5" />
          Opciones Inteligentes y Accesorios
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Selecciona las opciones inteligentes configuradas y accesorios adicionales.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sección de Opciones Inteligentes */}
        {smartOptions.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Opciones Inteligentes
            </h4>
            <p className="text-xs text-muted-foreground">
              Estas opciones incluyen automáticamente los accesorios configurados para cada tipo de dispositivo.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {smartOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => onSmartOptionToggle(option.label)}
                  className={cn(
                    'relative flex items-start justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-left',
                    option.selected && 'ring-2 ring-primary border-primary bg-primary/5'
                  )}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{option.label}</p>
                      {option.selected && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {option.accessories.map((accessory, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {accessory.model} ({accessory.brand})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Separador si hay ambas secciones */}
        {smartOptions.length > 0 && Object.keys(groupedAccessories).length > 0 && (
          <Separator />
        )}
        
        {/* Sección de Otros Accesorios */}
        {Object.keys(groupedAccessories).length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Otros Accesorios</h4>
            {Object.entries(groupedAccessories).map(([groupName, accessories]) => (
              <div key={groupName}>
                <h5 className="font-medium text-sm mb-2">{groupName}</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {accessories.map((accessory) => (
                    <button
                      key={accessory.id}
                      onClick={() => onAccessoryToggle(accessory)}
                      className={cn(
                        'relative flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-left',
                        isAccessorySelected(accessory) && 'ring-2 ring-primary border-primary bg-primary/5'
                      )}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{accessory.name}</p>
                        {accessory.brand && (
                          <p className="text-xs text-muted-foreground">{accessory.brand}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Disponible
                        </Badge>
                        {isAccessorySelected(accessory) && (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {groupName !== Object.keys(groupedAccessories)[Object.keys(groupedAccessories).length - 1] && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Resumen de selección */}
        {(smartOptions.some(option => option.selected) || selectedAccessories.length > 0) && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Elementos seleccionados:</p>
            <div className="flex flex-wrap gap-1">
              {smartOptions.filter(option => option.selected).map((option) => (
                <Badge key={option.label} variant="secondary" className="text-xs flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {option.label}
                </Badge>
              ))}
              {selectedAccessories.map((accessory) => (
                <Badge key={accessory.id} variant="secondary" className="text-xs">
                  {accessory.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}