'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle, Plug, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Resource } from '@/domain/types';

type AccessorySelectorProps = {
  selectedMainResources: Resource[]; // Laptops/proyectores seleccionados
  availableAccessories: Resource[]; // Todos los accesorios disponibles
  selectedAccessories: Resource[]; // Accesorios ya seleccionados
  chargerIncluded: boolean; // Estado del switch de cargador
  availableChargers: Resource[]; // Cargadores disponibles
  onAccessoryToggle: (accessory: Resource) => void;
  onChargerToggle: () => void;
};

export function AccessorySelector({
  selectedMainResources,
  availableAccessories,
  selectedAccessories,
  chargerIncluded,
  availableChargers,
  onAccessoryToggle,
  onChargerToggle,
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

  if (selectedMainResources.length === 0 || (!showChargerSection && compatibleAccessories.length === 0)) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plug className="h-5 w-5" />
          Accesorios y Cargadores
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Selecciona los accesorios adicionales y marca si incluyes cargador.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sección de Cargador */}
        {showChargerSection && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="charger-switch" className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Incluir Cargador
                </Label>
                <p className="text-xs text-muted-foreground">
                  Marca si también estás prestando el cargador junto con el dispositivo
                </p>
              </div>
              <Switch
                id="charger-switch"
                checked={chargerIncluded}
                onCheckedChange={onChargerToggle}
              />
            </div>
            {chargerIncluded && (
              <div className="pl-6 border-l-2 border-primary/20">
                {availableChargers.length > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      Cargadores disponibles:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {availableChargers.slice(0, 3).map((charger) => (
                        <Badge key={charger.id} variant="outline" className="text-xs">
                          {charger.name}
                        </Badge>
                      ))}
                      {availableChargers.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{availableChargers.length - 3} más
                        </Badge>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Se incluirá cargador compatible con el dispositivo
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Separador si hay ambas secciones */}
        {showChargerSection && Object.keys(groupedAccessories).length > 0 && (
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
        {(chargerIncluded || selectedAccessories.length > 0) && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Elementos adicionales seleccionados:</p>
            <div className="flex flex-wrap gap-1">
              {chargerIncluded && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Cargador
                </Badge>
              )}
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