'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Resource } from '@/domain/types';
import { categoryDetails } from '@/domain/constants';

type UseAccessorySelectionProps = {
  selectedResources: Resource[];
  allResources: Resource[];
  autoSelectChargers?: boolean;
};

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

type UseAccessorySelectionReturn = {
  availableAccessories: Resource[];
  selectedAccessories: Resource[];
  suggestedAccessories: Resource[];
  chargerIncluded: boolean;
  availableChargers: Resource[];
  smartOptions: SmartOption[];
  toggleAccessory: (accessory: Resource) => void;
  toggleCharger: () => void;
  toggleSmartOption: (optionLabel: string) => void;
  clearAccessories: () => void;
  selectAllSuggested: () => void;
};

export function useAccessorySelection({
  selectedResources,
  allResources,
  autoSelectChargers = true,
}: UseAccessorySelectionProps): UseAccessorySelectionReturn {
  const [selectedAccessories, setSelectedAccessories] = useState<Resource[]>([]);
  const [chargerIncluded, setChargerIncluded] = useState<boolean>(false);
  const [selectedSmartOptions, setSelectedSmartOptions] = useState<string[]>([]);

  // Filtrar recursos principales (laptops, proyectores)
  const mainResources = useMemo(() => {
    return selectedResources.filter(resource => 
      resource.category === 'Laptops' || 
      resource.category === 'Proyectores' ||
      resource.category === 'Tablets'
    );
  }, [selectedResources]);

  // Obtener opciones inteligentes disponibles basadas en los recursos principales
  const smartOptions = useMemo(() => {
    if (mainResources.length === 0) return [];

    const availableOptions: SmartOption[] = [];
    
    // Obtener opciones inteligentes únicas de todas las categorías de recursos principales
    const uniqueCategories = [...new Set(mainResources.map(resource => resource.category))];
    
    uniqueCategories.forEach(category => {
      const categoryConfig = categoryDetails[category as keyof typeof categoryDetails];
      if (categoryConfig?.smartOptions) {
        categoryConfig.smartOptions.forEach(option => {
          // Evitar duplicados
          if (!availableOptions.some(existing => existing.label === option.label)) {
            availableOptions.push({
              ...option,
              selected: selectedSmartOptions.includes(option.label)
            });
          }
        });
      }
    });

    return availableOptions;
  }, [mainResources, selectedSmartOptions]);

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

  // Obtener cargadores disponibles para el switch
  const availableChargers = useMemo(() => {
    if (mainResources.length === 0) return [];

    return availableAccessories.filter(accessory => {
      const isCharger = accessory.name.toLowerCase().includes('cargador') || 
                       accessory.name.toLowerCase().includes('charger') ||
                       accessory.name.toLowerCase().includes('adaptador de corriente') ||
                       accessory.name.toLowerCase().includes('fuente de poder');
      
      if (isCharger) {
        return mainResources.some(mainResource => {
          // Coincidencia por marca
          if (accessory.brand && mainResource.brand && 
              accessory.brand.toLowerCase() === mainResource.brand.toLowerCase()) {
            return true;
          }
          
          // Coincidencia por modelo o palabras clave
          const resourceKeywords = accessory.name.toLowerCase().split(/[\s-_]+/);
          const mainResourceKeywords = mainResource.name.toLowerCase().split(/[\s-_]+/);
          
          return resourceKeywords.some(keyword => {
            if (keyword.length < 3) return false;
            return mainResourceKeywords.some(mainKeyword => 
              keyword.includes(mainKeyword) || mainKeyword.includes(keyword)
            );
          });
        });
      }

      return false;
    });
  }, [availableAccessories, mainResources]);

  // Obtener accesorios sugeridos (excluyendo cargadores que ahora se manejan por separado)
  const suggestedAccessories = useMemo(() => {
    if (!autoSelectChargers || mainResources.length === 0) return [];

    return availableAccessories.filter(accessory => {
      // Excluir cargadores ya que se manejan por separado
      const isCharger = accessory.name.toLowerCase().includes('cargador') || 
                       accessory.name.toLowerCase().includes('charger');
      
      if (isCharger) return false;

      // Incluir otros accesorios sugeridos
      if (accessory.isAccessory) {
        return mainResources.some(mainResource => 
          accessory.compatibleWith?.includes(mainResource.id) ||
          mainResource.relatedAccessories?.includes(accessory.id)
        );
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

  // Auto-activar el switch de cargador cuando hay dispositivos que requieren cargador
  useEffect(() => {
    if (autoSelectChargers) {
      const hasDevicesWithCharger = mainResources.some(resource => 
        resource.category === 'Laptops' || resource.category === 'Tablets' || resource.category === 'Proyectores'
      );
      if (hasDevicesWithCharger && !chargerIncluded) {
        setChargerIncluded(true);
      }
    }
  }, [mainResources, autoSelectChargers, chargerIncluded]);

  // Limpiar accesorios y cargador cuando no hay recursos principales
  useEffect(() => {
    if (mainResources.length === 0) {
      setSelectedAccessories([]);
      setChargerIncluded(false);
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

  const toggleCharger = () => {
    setChargerIncluded(prev => !prev);
  };

  const toggleSmartOption = (optionLabel: string) => {
    setSelectedSmartOptions(prev => {
      const isSelected = prev.includes(optionLabel);
      if (isSelected) {
        return prev.filter(label => label !== optionLabel);
      } else {
        return [...prev, optionLabel];
      }
    });
  };

  const clearAccessories = () => {
    setSelectedAccessories([]);
    setChargerIncluded(false);
    setSelectedSmartOptions([]);
  };

  const selectAllSuggested = () => {
    setSelectedAccessories(suggestedAccessories);
  };

  return {
    availableAccessories,
    selectedAccessories,
    suggestedAccessories,
    chargerIncluded,
    availableChargers,
    smartOptions,
    toggleAccessory,
    toggleCharger,
    toggleSmartOption,
    clearAccessories,
    selectAllSuggested,
  };
}