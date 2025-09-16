
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  Filter,
  PlusCircle,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ResourceCard } from '@/components/resource-card';
import { Separator } from '@/components/ui/separator';
import { useData } from '@/context/data-provider-refactored';
import type { Resource, ResourceStatus } from '@/domain/types';
import { statusStyles } from '@/domain/constants';
import { useParams, useRouter } from 'next/navigation';
import { LoanDetailsDialog } from '@/components/loan-details-dialog';
import { DamagedResourceDialog } from '@/components/damaged-resource-dialog';
import { MaintenanceDialog } from '@/components/maintenance-dialog';
import { useToast } from '@/hooks/use-toast';
import { usePageTitle } from '@/hooks/use-page-title';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const { resources, updateResourceStatus, deleteResource } = useData();
  const { toast } = useToast();

  const categoryName = decodeURIComponent(params.categoryName as string);
  usePageTitle(categoryName);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ResourceStatus | 'all'>('all');
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);

  const [loanDetailsResource, setLoanDetailsResource] = useState<Resource | null>(null);
  const [damagedResource, setDamagedResource] = useState<Resource | null>(null);
  const [maintenanceResource, setMaintenanceResource] = useState<Resource | null>(null);


  const filteredResources = useMemo(() => {
    return resources
      .filter((r) => r.category === categoryName)
      .filter((resource) => {
        const matchesSearch =
          resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (resource.brand && resource.brand.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || resource.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [resources, categoryName, searchQuery, statusFilter]);

  const activeFilterCount =
    (searchQuery ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const handleResourceClick = (resource: Resource) => {
        switch (resource.status) {
            case 'prestado':
                setLoanDetailsResource(resource);
                break;
            case 'dañado':
                setDamagedResource(resource);
                break;
            case 'mantenimiento':
                setMaintenanceResource(resource);
                break;
            case 'disponible':
                // For available resources, we can allow editing notes or other details.
                // Let's forward to the edit page for now.
                router.push(`/inventory/${categoryName}/${resource.id}/edit`);
                break;
        }
    };

    const handleSendToMaintenance = (resourceId: string, notes: string) => {
        updateResourceStatus(resourceId, 'mantenimiento', notes);
        toast({
            title: "Recurso en Mantenimiento",
            description: "El recurso ha sido enviado a mantenimiento para su revisión.",
        });
        setDamagedResource(null);
    };

    const handleMaintenanceResolution = (resourceId: string, resolution: 'disponible' | 'dañado', notes: string) => {
        updateResourceStatus(resourceId, resolution, notes);

        toast({
            title: "Mantenimiento Resuelto",
            description: `El recurso ha sido marcado como ${resolution}.`,
        });
        setMaintenanceResource(null);
    };
    
    const handleDeleteClick = (e: React.MouseEvent, resource: Resource) => {
      e.stopPropagation();
      e.preventDefault();
      setResourceToDelete(resource);
      setIsDeleteDialogOpen(true);
    }
    
    const confirmDelete = () => {
      if (!resourceToDelete) return;
      deleteResource(resourceToDelete.id);
      toast({
          title: "Recurso dado de baja",
          description: "El recurso ha sido eliminado permanentemente del inventario.",
          variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
      setResourceToDelete(null);
    };


  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center text-sm text-muted-foreground">
                <Link href="/inventory" className="hover:text-primary">Inventario</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-primary">{categoryName}</span>
            </div>
        </div>
        <Button asChild className="hidden sm:flex">
          <Link href={`/inventory/${categoryName}/add`}>
            <PlusCircle className="mr-2" />
            Añadir Recurso
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold hidden sm:block">{categoryName}</h1>

      <div className="flex flex-row items-center gap-2">
        <div className="relative w-full flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o marca..."
            className="pl-9 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
             <Button variant="outline" className="shrink-0 relative h-10 w-10 p-0 sm:w-auto sm:px-4 sm:py-2">
              <Filter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className={cn(
                    "absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center sm:relative sm:top-auto sm:right-auto sm:ml-2 sm:h-auto sm:w-auto sm:px-1.5 sm:py-0.5",
                )}>
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros de Recursos</SheetTitle>
              <SheetDescription>
                Selecciona un estado para filtrar la lista de recursos.
              </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            <div className="flex flex-col gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                className="justify-start"
              >
                Todos los estados
              </Button>
              {(Object.entries(statusStyles) as [ResourceStatus, typeof statusStyles[ResourceStatus]][]).map(([status, { icon: Icon, label }]) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  className="justify-start"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
            <SheetFooter className="mt-6">
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                Limpiar Filtros
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filteredResources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} onClick={handleResourceClick} onDelete={(e) => handleDeleteClick(e, resource)} />
        ))}
      </div>
      
       {filteredResources.length === 0 && (
         <div className="col-span-full h-48 flex items-center justify-center border-2 border-dashed rounded-lg">
            <div className='text-center'>
                <p className="text-muted-foreground">No se encontraron recursos con los filtros aplicados.</p>
                <Button variant="link" onClick={clearFilters}>Limpiar filtros</Button>
            </div>
        </div>
      )}
    </div>

    <LoanDetailsDialog 
        resource={loanDetailsResource} 
        onOpenChange={(isOpen) => !isOpen && setLoanDetailsResource(null)}
    />
    <DamagedResourceDialog
        resource={damagedResource}
        onConfirm={handleSendToMaintenance}
        onOpenChange={(isOpen) => !isOpen && setDamagedResource(null)}
    />
    <MaintenanceDialog
        resource={maintenanceResource}
        onConfirm={handleMaintenanceResolution}
        onDelete={() => {
          if (maintenanceResource) {
            setResourceToDelete(maintenanceResource);
            setIsDeleteDialogOpen(true);
            setMaintenanceResource(null);
          }
        }}
        onOpenChange={(isOpen) => !isOpen && setMaintenanceResource(null)}
    />

    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar Dar de Baja?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción es irreversible. El recurso <strong>{resourceToDelete?.name}</strong> será eliminado permanentemente del inventario.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            className="bg-destructive hover:bg-destructive/90"
          >
            Sí, dar de baja
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
