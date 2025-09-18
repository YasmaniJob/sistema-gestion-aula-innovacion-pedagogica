'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Resource } from '@/domain/types';

type UseAccessorySelectionProps = {
  selectedResources: Resource[];
  allResources: Resource[];
  autoSelectChargers?: boolean;
};

type UseAccessorySelectionReturn = {
  availableAccessories: Resource[];
  selectedAccessories: Resource[];
  suggestedAccessories: Resource[];
  toggleAccessory: (accessory: Resource) => void;
  clearAccessories: () => void;
  selectAllSuggested: () => void;
};

export function useAccessorySelection({
  selectedResources,
  allResources,
  autoSelectChargers = true,
}: UseAccessorySelectionProps): UseAccessorySelectionReturn {
  const [selectedAccessories, setSelectedAccessories] = useState<Resource[]>([]);

  // Filtrar recursos principales (laptops, proyectores)
  const mainResources = useMemo(() => {
    return selectedResources.filter(resource => 
      resource.category === 'Laptops' || 
      resource.category === 'Proyectores' ||
      resource.category === 'Tablets'
    );
  }, [selectedResources]);

  // Obtener accesorios disponibles
  const availableAccessories = useMemo(() => {
    if (mainResources.length === 0) return [];

    return allResources.filter(resource => {
      // Excluir recursos ya seleccionados como principales
      if (selectedResources.some(selected => selected.id === resource.id)) {
        return false;
      }

      // Incluir accesorios marcados como tales
      if (resource.isAccessory) {
        return mainResources.some(mainResource => 
          resource.compatibleWith?.includes(mainResource.id) ||
          mainResource.relatedAccessories?.includes(resource.id)
        );
      }

      // Incluir cargadores de la categoría "Cables y Cargadores"
      if (resource.category === 'Cables y Cargadores' || resource.category === 'Cables y Adaptadores') {
        const isCharger = resource.name.toLowerCase().includes('cargador') || 
                         resource.name.toLowerCase().includes('charger') ||
                         resource.name.toLowerCase().includes('adaptador de corriente') ||
                         resource.name.toLowerCase().includes('fuente de poder');
        
        if (isCharger) {
          return mainResources.some(mainResource => {
            // Coincidencia por marca
            if (resource.brand && mainResource.brand && 
                resource.brand.toLowerCase() === mainResource.brand.toLowerCase()) {
              return true;
            }
            
            // Coincidencia por modelo o palabras clave
            const resourceKeywords = resource.name.toLowerCase().split(/[\s-_]+/);
            const mainResourceKeywords = mainResource.name.toLowerCase().split(/[\s-_]+/);
            
            // Buscar coincidencias de palabras clave significativas
            return resourceKeywords.some(keyword => {
              if (keyword.length < 3) return false; // Ignorar palabras muy cortas
              return mainResourceKeywords.some(mainKeyword => 
                keyword.includes(mainKeyword) || mainKeyword.includes(keyword)
              );
            });
          });
        }
      }

      return false;
    });
  }, [mainResources, allResources, selectedResources]);

  // Obtener accesorios sugeridos (cargadores principalmente)
  const suggestedAccessories = useMemo(() => {
    if (!autoSelectChargers || mainResources.length === 0) return [];

    return availableAccessories.filter(accessory => {
      // Priorizar cargadores
      const isCharger = accessory.name.toLowerCase().includes('cargador') || 
                       accessory.name.toLowerCase().includes('charger');
      
      if (isCharger) {
        // Sugerir cargadores que coincidan por marca
        return mainResources.some(mainResource => {
          if (accessory.brand && mainResource.brand && 
              accessory.brand.toLowerCase() === mainResource.brand.toLowerCase()) {
            return true;
          }
          
          // También sugerir si hay coincidencia en el nombre
          const accessoryName = accessory.name.toLowerCase();
          const mainResourceName = mainResource.name.toLowerCase();
          
          return accessoryName.includes(mainResource.brand?.toLowerCase() || '') ||
                 mainResourceName.includes(accessory.brand?.toLowerCase() || '');
        });
      }

      return false;
    });
  }, [availableAccessories, mainResources, autoSelectChargers]);

  // Auto-seleccionar accesorios sugeridos cuando cambian los recursos principales
  useEffect(() => {
    if (autoSelectChargers && suggestedAccessories.length > 0) {
      // Solo auto-seleccionar si no hay accesorios ya seleccionados
      if (selectedAccessories.length === 0) {
        setSelectedAccessories(suggestedAccessories);
      }
    }
  }, [suggestedAccessories, autoSelectChargers, selectedAccessories.length]);

  // Limpiar accesorios seleccionados cuando no hay recursos principales
  useEffect(() => {
    if (mainResources.length === 0) {
      setSelectedAccessories([]);
    }
  }, [mainResources.length]);

  const toggleAccessory = (accessory: Resource) => {
    setSelectedAccessories(prev => {
      const isSelected = prev.some(selected => selected.id === accessory.id);
      
      if (isSelected) {
        return prev.filter(selected => selected.id !== accessory.id);
      } else {
        return [...prev, accessory];
      }
    });
  };

  const clearAccessories = () => {
    setSelectedAccessories([]);
  };

  const selectAllSuggested = () => {
    setSelectedAccessories(suggestedAccessories);
  };

  return {
    availableAccessories,
    selectedAccessories,
    suggestedAccessories,
    toggleAccessory,
    clearAccessories,
    selectAllSuggested,
  };
}