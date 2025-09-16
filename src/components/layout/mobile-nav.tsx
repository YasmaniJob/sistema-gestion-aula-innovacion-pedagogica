
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


export function MobileNav() {
  const pathname = usePathname();
  const { currentUser } = useData();
  const { isMobile } = useSidebar();
  
  const addActionPath = useMemo(() => {
    // Priority 1: Never show the FAB on add/edit pages.
    if (pathname.includes('/add') || pathname.includes('/edit')) {
      return null;
    }
  
    // Special handling for inventory category pages
    if (pathname.startsWith('/inventory/') && pathname.split('/').length > 2) {
      const categoryName = pathname.split('/')[2];
      return `/inventory/${categoryName}/add`;
    }
    
    // General case for root module pages
    const primaryPath = Object.keys(contextualAddRoutes).find(p => pathname === p);
    return primaryPath ? contextualAddRoutes[primaryPath as keyof typeof contextualAddRoutes] : null;

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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-sm sm:hidden">
      <div className="flex h-20 items-center justify-around px-4">
        {navItems.map(renderNavItem)}
        {addActionPath && (
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
        )}
      </div>
    </div>
  );
}

    
