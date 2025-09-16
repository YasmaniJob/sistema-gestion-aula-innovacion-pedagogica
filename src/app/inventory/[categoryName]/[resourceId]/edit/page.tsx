
'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { ResourceFormData } from '@/components/resource-form';
import { ResourceForm } from '@/components/resource-form';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/data-provider-refactored';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { Resource } from '@/domain/types';
import { usePageTitle } from '@/hooks/use-page-title';


export default function EditResourcePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { resources, updateResource } = useData();
  
  const [resource, setResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const categoryName = decodeURIComponent(params.categoryName as string);
  const resourceId = decodeURIComponent(params.resourceId as string);

  usePageTitle(resource ? `Editar: ${resource.name}` : 'Editar Recurso');
  
  useEffect(() => {
    const foundResource = resources.find(r => r.id === resourceId);
    if (foundResource) {
        setResource(foundResource);
    }
    setIsLoading(false);
  }, [resourceId, resources]);


  const handleSubmit = (data: Omit<ResourceFormData, 'quantity'>) => {
    if (!resource) return;

    updateResource(resource.id, data);
    
    toast({
        title: "Recurso Actualizado",
        description: `El recurso ${resource.name} ha sido actualizado correctamente.`
    });

    router.push(`/inventory/${categoryName}`);
  };

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  if (!resource) {
      return (
          <div>
              <h1 className="text-2xl font-bold text-destructive">Recurso no encontrado</h1>
              <p>El recurso que intentas editar no existe.</p>
              <Button asChild variant="link">
                  <Link href={`/inventory/${categoryName}`}>Volver a la categoría</Link>
              </Button>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center text-sm text-muted-foreground">
                <Link href="/inventory" className="hover:text-primary">Inventario</Link>
                <ChevronRight className="h-4 w-4" />
                <Link href={`/inventory/${categoryName}`} className="hover:text-primary">{categoryName}</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-primary">Editar Recurso</span>
            </div>
        </div>
      </div>

       <h1 className="text-3xl font-bold hidden sm:block">Editar Recurso: {resource.name}</h1>

      <ResourceForm 
        categoryName={categoryName} 
        onSubmit={handleSubmit}
        mode="edit"
        initialData={{
            brand: resource.brand,
            model: resource.model,
            quantity: resource.stock,
            notes: resource.notes,
            attributes: resource.attributes,
        }}
      />
    </div>
  );
}
