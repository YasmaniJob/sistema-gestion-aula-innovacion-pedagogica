'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, RefreshCw, Package } from 'lucide-react';
import { useData } from '@/context/data-provider-refactored';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthorization } from '@/hooks/use-authorization';
import { CategoryForm, type CategoryFormData } from '@/components/category-form';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Category } from '@/domain/types';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryCard } from '@/components/category-card';
import { usePageTitle } from '@/hooks/use-page-title';

export default function InventoryPage() {
  useAuthorization({ requiredRole: 'Docente' });
  usePageTitle('Inventario de Recursos');
  const { categories, addCategories, deleteCategory, resources, refreshResources } = useData();
  const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useData();

  const isAdmin = currentUser?.role === 'Admin';

  const handleRefreshResources = async () => {
    setIsRefreshing(true);
    try {
      await refreshResources();
      toast({
        title: "Recursos Actualizados",
        description: "Los recursos se han actualizado desde la base de datos."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los recursos.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddCategories = async (data: CategoryFormData) => {
    const existingCategoryNames = categories.map(c => c.name);
    const newCategoryNames = data.types.filter(name => !existingCategoryNames.includes(name));
    
    if (newCategoryNames.length > 0) {
        try {
            const newCategories = await addCategories(newCategoryNames);
            if (newCategories && newCategories.length > 0) {
                toast({
                    title: "¡Categorías Añadidas!",
                    description: `${newCategories.length} nueva(s) categoría(s) ha(n) sido añadida(s).`
                });
            } else {
                 toast({ title: "Sin cambios", description: "Las categorías que intentas añadir ya existen o no se pudieron crear."})
            }
        } catch (error: any) {
            toast({
                title: "Error al crear categorías",
                description: error.message || "No se pudieron añadir las categorías. Revisa los permisos de la base de datos.",
                variant: 'destructive'
            });
        }
    } else if (data.types.length > 0) {
        toast({ title: "Sin cambios", description: "Las categorías que intentas añadir ya existen."})
    }

    setCategoryDialogOpen(false);
  };
  
  const handleDeleteClick = (e: React.MouseEvent, category: Category) => {
    e.stopPropagation();
    e.preventDefault();
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!categoryToDelete) return;
    
    deleteCategory(categoryToDelete.name);

    toast({
        title: "Categoría Eliminada",
        description: `La categoría "${categoryToDelete.name}" y todos sus recursos han sido eliminados.`,
        variant: 'destructive',
    });
    
    setIsDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold flex-grow hidden sm:block">Inventario de Recursos</h1>
          <div className="hidden sm:flex items-center gap-2">
            {isAdmin && (
              <>
                <Button
                  onClick={handleRefreshResources}
                  variant="outline"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Actualizando...' : 'Refrescar'}
                </Button>
                <Button onClick={() => setCategoryDialogOpen(true)}>
                  <PlusCircle className="mr-2" />
                  Añadir Categoría
                </Button>
              </>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar categoría..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
          </CardContent>
        </Card>

        {filteredCategories.length > 0 ? (
           <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
             {filteredCategories.map((category) => {
               const categoryResources = resources.filter(r => r.category === category.name);
               const availableResources = categoryResources.filter(r => r.status === 'disponible').length;
               return (
                 <CategoryCard
                    key={category.name}
                    category={category}
                    resourceCount={categoryResources.length}
                    availableResources={availableResources}
                    onDelete={undefined}
                 />
               )
             })}
           </div>
        ) : (
           <div className="col-span-full h-48 flex items-center justify-center border-2 border-dashed rounded-lg">
              <div className='text-center'>
                  <p className="text-muted-foreground">No se encontraron categorías con el nombre "{searchQuery}".</p>
                  <Button variant="link" onClick={() => setSearchQuery('')}>Limpiar búsqueda</Button>
              </div>
          </div>
        )}

         <Dialog open={isCategoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogContent>
              <DialogHeader>
                  <DialogTitle>Añadir Nuevas Categorías</DialogTitle>
                  <DialogDescription>
                      Selecciona uno o más tipos de categorías de la lista, o añade una personalizada. Las categorías que ya existen serán ignoradas.
                  </DialogDescription>
              </DialogHeader>
              <CategoryForm
                  onSubmit={handleAddCategories}
                  onCancel={() => setCategoryDialogOpen(false)}
                  existingCategories={categories}
              />
            </DialogContent>
         </Dialog>

         <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la categoría <strong>{categoryToDelete?.name}</strong> y todos los recursos que contiene.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
