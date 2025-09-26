
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { ResourceFormData } from '@/components/resource-form';
import { ResourceForm } from '@/components/resource-form';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/data-provider-refactored';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { usePageTitle } from '@/hooks/use-page-title';
import { categoryDetails } from '@/domain/constants';

export default function AddResourcePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { addResource } = useData();
  const categoryName = decodeURIComponent(params.categoryName as string);
  usePageTitle(`Añadir a ${categoryName}`);

  const handleSubmit = (data: ResourceFormData) => {
    // Crear el recurso principal
    addResource({ ...data, category: categoryName });
    
    // Procesar opciones inteligentes si están seleccionadas
    if (data.smartOptions && data.smartOptions.length > 0) {
      const categoryConfig = categoryDetails[categoryName];
      let totalAccessories = 0;
      
      data.smartOptions.forEach(selectedOption => {
        const smartOption = categoryConfig?.smartOptions?.find(option => option.label === selectedOption);
        if (smartOption) {
          smartOption.accessories.forEach(accessory => {
            // Crear cada accesorio para cada cantidad del recurso principal
            for (let i = 0; i < data.quantity; i++) {
              addResource({
                brand: accessory.brand,
                model: accessory.model,
                category: accessory.category,
                quantity: 1,
                attributes: accessory.attributes || {},
                notes: `Accesorio creado automáticamente para ${data.brand} ${data.model || ''}`
              });
              totalAccessories++;
            }
          });
        }
      });
      
      toast({
        title: "¡Recursos y Accesorios Creados!",
        description: `Se ha(n) añadido ${data.quantity} recurso(s) principal(es) y ${totalAccessories} accesorio(s) automáticamente.`
      });
    } else {
      toast({
        title: "¡Recurso(s) Creado(s)!",
        description: `Se ha(n) añadido ${data.quantity} nuevo(s) recurso(s) a la categoría ${categoryName}.`
      });
    }

    router.push(`/inventory/${categoryName}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center text-sm text-muted-foreground">
                <Link href="/inventory" className="hover:text-primary">Inventario</Link>
                <ChevronRight className="h-4 w-4" />
                <Link href={`/inventory/${categoryName}`} className="hover:text-primary">{categoryName}</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-primary">Añadir Recurso</span>
            </div>
        </div>
      </div>

       <h1 className="text-3xl font-bold hidden sm:block">Añadir a: {categoryName}</h1>

      <ResourceForm 
        categoryName={categoryName} 
        onSubmit={handleSubmit}
        mode="add"
      />
    </div>
  );
}
