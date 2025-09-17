
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
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { AdaptiveDialog } from '../adaptive-dialog';
import { CategoryForm, type CategoryFormData } from '../category-form';
import { useToast } from '@/hooks/use-toast';


export function MobileNav() {
  const pathname = usePathname();
  const { currentUser, categories, addCategories } = useData();
  const { isMobile } = useSidebar();
  const { toast } = useToast();
  const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
  
  const handleAddCategories = async (data: CategoryFormData) => {
    try {
      await addCategories(data.types);
      setCategoryDialogOpen(false);
      toast({
        title: 'Categorías añadidas',
        description: `Se han añadido ${data.types.length} categoría(s) exitosamente.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron añadir las categorías. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };
  
  const { addActionPath, shouldShowModal } = useMemo(() => {
    // Priority 1: Never show the FAB on add/edit pages.
    if (pathname.includes('/add') || pathname.includes('/edit')) {
      return { addActionPath: null, shouldShowModal: false };
    }
  
    // Special handling for main inventory page - show modal
    if (pathname === '/inventory') {
      return { addActionPath: null, shouldShowModal: true };
    }
    
    // Special handling for inventory category pages
    if (pathname.startsWith('/inventory/') && pathname.split('/').length > 2) {
      const categoryName = pathname.split('/')[2];
      return { addActionPath: `/inventory/${categoryName}/add`, shouldShowModal: false };
    }
    
    // General case for root module pages
    const primaryPath = Object.keys(contextualAddRoutes).find(p => pathname === p);
    const path = primaryPath ? contextualAddRoutes[primaryPath as keyof typeof contextualAddRoutes] : null;
    return { addActionPath: path, shouldShowModal: false };

  }, [pathname]);

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

  const renderAddButton = () => {
    if (shouldShowModal) {
      return (
        <button
          onClick={() => setCategoryDialogOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center gap-1 transition-colors w-16 h-16'
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg">
            <Plus className="h-6 w-6" />
          </div>
          <span className="sr-only text-[10px] font-medium leading-none text-center">
            Añadir
          </span>
        </button>
      );
    }
    
    if (addActionPath) {
      return (
        <Link
          href={addActionPath}
          className={cn(
            'flex flex-col items-center justify-center gap-1 transition-colors w-16 h-16'
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg">
            <Plus className="h-6 w-6" />
          </div>
          <span className="sr-only text-[10px] font-medium leading-none text-center">
            Añadir
          </span>
        </Link>
      );
    }
    
    return null;
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-sm sm:hidden">
        <div className="flex h-20 items-center justify-around px-4">
          {navItems.map(renderNavItem)}
          {renderAddButton()}
        </div>
      </div>
      
      <AdaptiveDialog
        isOpen={isCategoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        title="Añadir Nuevas Categorías"
        description="Selecciona uno o más tipos de categorías de la lista, o añade una personalizada. Las categorías que ya existen serán ignoradas."
      >
        <CategoryForm 
          onSubmit={handleAddCategories} 
          onCancel={() => setCategoryDialogOpen(false)}
          existingCategories={categories}
        />
      </AdaptiveDialog>
    </>
  );
}

    
