
'use client';

import Link from 'next/link';
import { useSidebar } from './sidebar-provider';
import { useEffect, useState } from 'react';
import { useData } from '@/context/data-provider-refactored';
import { Button } from '../ui/button';
import { PanelLeft, LogOut, User, ArrowLeft } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Logo } from '../logo';
import { adminNavItems, teacherNavItems } from './sidebar-items';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { getInitials } from '@/lib/utils';

export function MobileHeader() {
  const { isMobile, pageTitle, headerActions } = useSidebar();
  const { currentUser, appSettings, setCurrentUser } = useData();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Close sheet on navigation
    setIsSheetOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    router.push('/');
  };

  if (!isMobile) {
    return null;
  }
  
  const isActive = (href: string) => {
    // For sub-items, we need an exact match on path and query params.
    if (href.includes('?tab=')) {
        return pathname === href.split('?')[0] && window.location.search === `?${href.split('?')[1]}`;
    }
    
    // For main items, the logic is broader.
    if (href === '/dashboard' || href === '/my-space') {
        return pathname === href;
    }
    if (href === '/inventory') {
        return pathname.startsWith('/inventory');
    }

    return pathname.startsWith(href);
  };


  const isAdmin = currentUser?.role === 'Admin';
  const navItems = isAdmin ? adminNavItems : teacherNavItems;
  const isRootPage = navItems.some(item => 'href' in item && pathname === item.href);


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-card/95 px-4 backdrop-blur-sm sm:hidden">
      <div className="flex items-center gap-2">
         {!isRootPage ? (
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Volver</span>
            </Button>
          ) : (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={cn(!isAdmin && "invisible")}>
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col">
                <SheetHeader className="p-4 border-b text-left">
                  <SheetTitle className="sr-only">Menú Principal</SheetTitle>
                  <SheetDescription className="sr-only">
                    Navegación principal para administradores.
                  </SheetDescription>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 font-semibold"
                  >
                    {appSettings.logoUrl ? (
                      <img 
                        src={appSettings.logoUrl} 
                        alt="Logo" 
                        className="h-8 w-8 object-contain shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const logoContainer = target.parentElement;
                          if (logoContainer) {
                            const logoSvg = document.createElement('div');
                            logoSvg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="h-8 w-8 text-primary" aria-label="AIP Logo"><g fill="currentColor"><circle cx="128" cy="128" r="32" opacity="1" /><path d="M128,56a72,72,0,1,0,72,72,72,72,0,0,0-72-72Zm0,128a56,56,0,1,1,56-56,56,56,0,0,1-56,56Z" opacity="0.2" /><path d="M197.8,49.2a112,112,0,1,0-139.6,0" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" opacity="0.5" /><circle cx="56" cy="72" r="8" opacity="0.8" /><circle cx="200" cy="72" r="8" opacity="0.8" /><circle cx="192" cy="184" r="8" opacity="0.8" /></g></svg>';
                            logoContainer.appendChild(logoSvg.firstChild!);
                          }
                        }}
                      />
                    ) : (
                      <Logo className="h-8 w-8 text-primary" />
                    )}
                    <span className="font-bold">{appSettings.appName}</span>
                  </Link>
                </SheetHeader>
                <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
                  {adminNavItems.map((item, index) => (
                    'subItems' in item ? (
                      <div key={`group-${index}`}>
                          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                          {item.subItems.map(subItem => (
                               <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
                                    isActive(subItem.href) &&
                                    'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                                )}
                                >
                                <subItem.icon className="h-5 w-5" />
                                {subItem.label}
                                </Link>
                          ))}
                      </div>
                    ) : (
                        <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
                            isActive(item.href) &&
                            'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                        )}
                        >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                        </Link>
                    )
                  ))}
                </nav>
                <div className="mt-auto border-t p-2">
                  <Link
                    href="/profile"
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
                      isActive('/profile') &&
                        'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getInitials(currentUser?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold leading-tight">
                        {currentUser?.name}
                      </span>
                      <span className="text-xs">Mi Perfil</span>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start mt-1"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Cerrar Sesión
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        <h1 className="text-lg font-semibold truncate">{pageTitle}</h1>
      </div>
      {headerActions && <div className="flex items-center gap-1">{headerActions}</div>}
    </header>
  );
}

    