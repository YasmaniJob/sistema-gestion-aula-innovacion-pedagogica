'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Plug, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Resource } from '@/domain/types';

type AccessorySelectorProps = {
  selectedMainResources: Resource[]; // Laptops/proyectores seleccionados
  availableAccessories: Resource[]; // Todos los accesorios disponibles
  selectedAccessories: Resource[]; // Accesorios ya seleccionados
  onAccessoryToggle: (accessory: Resource) => void;
};

export function AccessorySelector({
  selectedMainResources,
  availableAccessories,
  selectedAccessories,
  onAccessoryToggle,
}: AccessorySelectorProps) {
  // Filtrar accesorios compatibles con los recursos principales seleccionados
  const compatibleAccessories = useMemo(() => {
    if (selectedMainResources.length === 0) return [];
    
    return availableAccessories.filter(accessory => {
      // Si es un accesorio marcado como tal
      if (accessory.isAccessory) {
        // Verificar si es compatible con alguno de los recursos seleccionados
        return selectedMainResources.some(mainResource => 
          accessory.compatibleWith?.includes(mainResource.id) ||
          mainResource.relatedAccessories?.includes(accessory.id)
        );
      }
      
      // También incluir cargadores de la categoría "Cables y Cargadores"
      if (accessory.category === 'Cables y Cargadores' || accessory.category === 'Cables y Adaptadores') {
        const isCharger = accessory.name.toLowerCase().includes('cargador') || 
                         accessory.name.toLowerCase().includes('charger') ||
                         accessory.name.toLowerCase().includes('adaptador de corriente');
        
        if (isCharger) {
          // Lógica para asociar cargadores por marca o modelo
          return selectedMainResources.some(mainResource => {
            // Coincidencia por marca
            if (accessory.brand && mainResource.brand && 
                accessory.brand.toLowerCase() === mainResource.brand.toLowerCase()) {
              return true;
            }
            
            // Coincidencia por palabras clave en el nombre
            const accessoryKeywords = accessory.name.toLowerCase().split(' ');
            const mainResourceKeywords = mainResource.name.toLowerCase().split(' ');
            
            return accessoryKeywords.some(keyword => 
              mainResourceKeywords.some(mainKeyword => 
                keyword.includes(mainKeyword) || mainKeyword.includes(keyword)
              )
            );
          });
        }
      }
      
      return false;
    });
  }, [selectedMainResources, availableAccessories]);

  // Agrupar accesorios por tipo
  const groupedAccessories = useMemo(() => {
    const groups: Record<string, Resource[]> = {};
    
    compatibleAccessories.forEach(accessory => {
      let groupKey = 'Otros';
      
      if (accessory.name.toLowerCase().includes('cargador') || 
          accessory.name.toLowerCase().includes('charger')) {
        groupKey = 'Cargadores';
      } else if (accessory.name.toLowerCase().includes('cable')) {
        groupKey = 'Cables';
      } else if (accessory.name.toLowerCase().includes('adaptador')) {
        groupKey = 'Adaptadores';
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

  if (selectedMainResources.length === 0 || compatibleAccessories.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plug className="h-5 w-5" />
          Accesorios Recomendados
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Selecciona los accesorios que deseas incluir con los recursos principales.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedAccessories).map(([groupName, accessories]) => (
          <div key={groupName}>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              {groupName === 'Cargadores' && <Zap className="h-4 w-4" />}
              {groupName}
            </h4>
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
        
        {selectedAccessories.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Accesorios seleccionados:</p>
            <div className="flex flex-wrap gap-1">
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