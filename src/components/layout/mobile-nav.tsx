
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from './sidebar-provider';
import { useData } from '@/context/data-provider-refactored';
import { useEffect, useMemo, useState } from 'react';
import { Button, buttonVariants } from '../ui/button';
import { adminNavItems, teacherNavItems, contextualAddRoutes } from './sidebar-items';
import { Plus, LayoutGrid } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '../ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { CategoryForm, type CategoryFormData } from '../category-form';
import { useToast } from '@/hooks/use-toast';


export function MobileNav() {
  const pathname = usePathname();
  const { currentUser, categories, addCategories } = useData();
  const { isMobile } = useSidebar();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const shouldShowAddButton = useMemo(() => {
    // Never show the FAB on add/edit pages
    if (pathname.includes('/add') || pathname.includes('/edit')) {
      return false;
    }
    
    // Show if we have any contextual add routes or if we're on main pages
    const hasContextualRoute = Object.keys(contextualAddRoutes).some(p => pathname === p || pathname.startsWith(p));
    const isMainPage = pathname === '/dashboard' || pathname === '/my-space';
    
    return hasContextualRoute || isMainPage;
  }, [pathname]);

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

  const handleAddButtonClick = () => {
    if (pathname === '/inventory') {
      setCategoryDialogOpen(true);
    } else {
      setIsAddSheetOpen(true);
    }
  };

  const getAddOptions = useMemo(() => {
    const options = [];
    const role = currentUser?.role;
    
    if (!role) return options;
    
    // Get contextual add route for current page
    const contextualRoute = Object.keys(contextualAddRoutes).find(p => pathname === p);
    if (contextualRoute) {
      const targetRoute = contextualAddRoutes[contextualRoute as keyof typeof contextualAddRoutes];
      
      // Add specific option based on current page
      if (pathname === '/inventory') {
        options.push({ label: 'Nuevo Recurso', href: targetRoute, icon: Plus });
      } else if (pathname === '/loans' || pathname === '/my-loans') {
        options.push({ label: 'Nuevo Préstamo', href: targetRoute, icon: Plus });
      } else if (pathname === '/reservations' || pathname === '/my-reservations') {
        options.push({ label: 'Nueva Reserva', href: targetRoute, icon: Plus });
      } else if (pathname === '/meetings') {
        options.push({ label: 'Nueva Reunión', href: targetRoute, icon: Plus });
      } else if (pathname === '/docentes') {
        options.push({ label: 'Nuevo Personal', href: targetRoute, icon: Plus });
      }
    }
    
    // Special handling for inventory category pages
    if (pathname.startsWith('/inventory/') && pathname.split('/').length > 2) {
      const categoryName = pathname.split('/')[2];
      options.push({ label: `Añadir a ${decodeURIComponent(categoryName)}`, href: `/inventory/${categoryName}/add`, icon: Plus });
    }
    
    // Add common options based on role
    if (role === 'Admin') {
      if (pathname !== '/inventory' && !pathname.startsWith('/inventory/')) {
        options.push({ label: 'Nuevo Recurso', href: '/inventory/add', icon: Plus });
      }
      if (pathname !== '/loans') {
        options.push({ label: 'Nuevo Préstamo', href: '/loans/new', icon: Plus });
      }
      if (pathname !== '/reservations') {
        options.push({ label: 'Nueva Reserva', href: '/reservations/new', icon: Plus });
      }
      if (pathname !== '/meetings') {
        options.push({ label: 'Nueva Reunión', href: '/meetings/new', icon: Plus });
      }
      if (pathname !== '/docentes') {
        options.push({ label: 'Nuevo Personal', href: '/docentes/add', icon: Plus });
      }
    } else if (role === 'Docente') {
      if (pathname !== '/my-loans') {
        options.push({ label: 'Nuevo Préstamo', href: '/my-loans/new', icon: Plus });
      }
      if (pathname !== '/my-reservations') {
        options.push({ label: 'Nueva Reserva', href: '/my-reservations/new', icon: Plus });
      }
    }
    
    return options;
  }, [pathname, currentUser?.role]);

  if (!isMobile) {
    return null; 
  }

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/my-space') return pathname === href;
    if (href === '/inventory') return pathname.startsWith('/inventory');
    return pathname.startsWith(href);
  };
  
  const renderNavItem = (item: { href: string; icon: React.ElementType; label: string }) => (
     <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-muted-foreground transition-colors w-16 h-16',
          isActive(item.href) && 'text-primary'
        )}
      >
        <item.icon className="h-5 w-5" />
        <span className="text-[10px] font-medium leading-none text-center whitespace-nowrap">
          {item.label}
        </span>
      </Link>
  );

  const navItems = currentUser?.role === 'Admin' ? adminNavItems.slice(0, 4) : teacherNavItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-sm sm:hidden">
      <div className="flex h-20 items-center justify-around px-4">
        {navItems.map(renderNavItem)}
        {shouldShowAddButton && (pathname === '/inventory' || getAddOptions.length > 0) && (
          <>
            <Button
              variant="default"
              className="flex flex-col items-center justify-center gap-1 transition-colors w-16 h-16"
              onClick={handleAddButtonClick}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg">
                <Plus className="h-6 w-6" />
              </div>
              <span className="sr-only text-[10px] font-medium leading-none text-center">
                Añadir
              </span>
            </Button>
            
            {/* Sheet for general add options */}
            <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
              <SheetContent side="bottom" className="h-auto max-h-[80vh]">
                <SheetHeader>
                  <SheetTitle>¿Qué deseas añadir?</SheetTitle>
                </SheetHeader>
                <div className="grid gap-3 py-4">
                  {getAddOptions.map((option, index) => (
                    <Link
                      key={index}
                      href={option.href}
                      onClick={() => setIsAddSheetOpen(false)}
                      className={cn(
                        buttonVariants({ variant: 'outline' }),
                        'justify-start h-12 text-left'
                      )}
                    >
                      <option.icon className="mr-3 h-5 w-5" />
                      {option.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Dialog for inventory categories */}
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
          </>
        )}
      </div>
    </div>
  );
}

    
