
'use client';
import Link from 'next/link';
import {
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useMemo, useState, useEffect } from 'react';
import type { LoanUser } from '@/domain/types';
import { UserProfile } from './user-profile';
import { Separator } from '../ui/separator';
import { useData } from '@/context/data-provider-refactored';
import { Logo } from '../logo';
import { useSidebar } from './sidebar-provider';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { adminNavItems, teacherNavItems } from './sidebar-items';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


export function Sidebar() {
  const { isSidebarCollapsed, toggleSidebarCollapse } = useSidebar();
  const { currentUser, appSettings } = useData(); 
  const role = currentUser?.role;
  const isMobile = useIsMobile();
  const pathname = usePathname();

  const navItems = useMemo(() => {
      if (!role) return [];
      return role === 'Admin' ? adminNavItems : teacherNavItems;
  }, [role]);

  if (isMobile) {
    return null;
  }
  
  const isSettingsPath = pathname === '/settings';

  return (
    <TooltipProvider>
      <aside className={cn("hidden sm:block bg-card text-card-foreground border-r transition-all duration-300 ease-in-out", isSidebarCollapsed ? 'w-20' : 'w-64')}>
        <div className="flex h-full max-h-screen flex-col">
          <div className={cn("flex h-[68px] shrink-0 items-center border-b px-4 lg:px-6", isSidebarCollapsed && !isMobile && "justify-center")}>
            <Link href={role === 'Admin' ? '/dashboard' : '/my-space'} className={cn("flex items-center gap-3 font-semibold w-full", isSidebarCollapsed && !isMobile && "justify-center")}>
              {appSettings.logoUrl ? (
                <img 
                  src={appSettings.logoUrl} 
                  alt="Logo" 
                  className="h-9 w-9 object-contain shrink-0"
                  onError={(e) => {
                    // Si la imagen falla al cargar, mostrar el Logo por defecto
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const logoContainer = target.parentElement;
                    if (logoContainer) {
                      const logoSvg = document.createElement('div');
                      logoSvg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="h-9 w-9 text-primary shrink-0" aria-label="AIP Logo"><g fill="currentColor"><circle cx="128" cy="128" r="32" opacity="1" /><path d="M128,56a72,72,0,1,0,72,72,72,72,0,0,0-72-72Zm0,128a56,56,0,1,1,56-56,56,56,0,0,1-56,56Z" opacity="0.2" /><path d="M197.8,49.2a112,112,0,1,0-139.6,0" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" opacity="0.5" /><circle cx="56" cy="72" r="8" opacity="0.8" /><circle cx="200" cy="72" r="8" opacity="0.8" /><circle cx="192" cy="184" r="8" opacity="0.8" /></g></svg>';
                      logoContainer.appendChild(logoSvg.firstChild!);
                    }
                  }}
                />
              ) : (
                <Logo className="h-9 w-9 text-primary shrink-0" />
              )}
              <div className={cn("flex flex-col text-card-foreground", isSidebarCollapsed && 'hidden')}>
                  <span className='font-bold text-base leading-tight'>{appSettings.appName}</span>
                  <span className='text-xs text-muted-foreground font-normal leading-tight'>{appSettings.schoolName}</span>
              </div>
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto space-y-1 px-2 py-4 lg:px-4">
            {role && navItems.map((item, index) => (
              'subItems' in item
                ? <CollapsibleNavItem key={`collapsible-${index}`} item={item} role={role} isCollapsed={isSidebarCollapsed} />
                : <SidebarNavItem key={item.href} item={item as any} role={role} isCollapsed={isSidebarCollapsed}/>
            ))}
          </nav>
          <div className="mt-auto shrink-0 border-t p-4">
              <Separator className="my-2" />
               <div className={cn("p-2", isSidebarCollapsed && !isMobile && "p-0")}>
                    <UserProfile isCollapsed={isSidebarCollapsed && !isMobile} />
                </div>
              <Button
                  variant="ghost"
                  className={cn("w-full h-auto p-2.5 flex", isSidebarCollapsed ? 'justify-center' : 'justify-start')}
                  onClick={toggleSidebarCollapse}
              >
                  {isSidebarCollapsed ? (
                      <PanelLeftOpen className="h-5 w-5" />
                  ) : (
                      <>
                        <PanelLeftClose className="h-5 w-5 mr-3" />
                        <span className="font-medium">Colapsar</span>
                      </>
                  )}
                  <span className="sr-only">Toggle Sidebar</span>
              </Button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function CollapsibleNavItem({ item, role, isCollapsed }: { item: any, role: LoanUser['role'], isCollapsed: boolean }) {
  const pathname = usePathname();
  const searchParams = usePathname();
  const isGroupActive = item.subItems.some((subItem: any) => pathname.startsWith(subItem.href.split('?')[0]));

  const [isOpen, setIsOpen] = useState(isGroupActive);

  useEffect(() => {
    setIsOpen(isGroupActive);
  }, [isGroupActive]);
  

  if (!item.roles.includes(role)) {
    return null;
  }
  
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.subItems[0].href}
            className={cn(
              'flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-muted/50',
              isGroupActive && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={5}>
          <p>{item.label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
     <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-1">
      <CollapsibleTrigger asChild>
         <button
            className={cn(
                'flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:bg-muted/50',
                isGroupActive && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
            )}
            >
            <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span className="font-medium text-base">{item.label}</span>
            </div>
            <ChevronDown className={cn('h-5 w-5 transition-transform', isOpen && 'rotate-180')} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 pl-6 pt-1">
        {item.subItems.map((subItem: any) => (
          <SidebarNavItem key={subItem.href} item={subItem} role={role} isCollapsed={false} isSubItem />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}


function SidebarNavItem({ item, role, isCollapsed, isSubItem = false }: { item: { href: string, icon: React.ElementType, label: string, roles?: string[] }, role: LoanUser['role'], isCollapsed: boolean, isSubItem?: boolean }) {
    const pathname = usePathname();
    const searchParams = usePathname();
    const { isMobile } = useSidebar();

    const isActive = (href: string) => {
      // For sub-items, we need an exact match on path and query params.
      const currentFullPath = `${pathname}${window.location.search}`;
      if (isSubItem) {
        return currentFullPath === href;
      }
      
      // For main items, the logic is broader.
      if (href === '/dashboard' || href === '/my-space') {
        return pathname === href;
      }
      if (href === '/inventory') {
        return pathname.startsWith('/inventory');
      }
      // For settings, check if the path starts with /settings
      if (href.startsWith('/settings')) {
         return pathname.startsWith('/settings');
      }
      return pathname.startsWith(href);
    };

    if (item.roles && !item.roles.includes(role)) {
        return null;
    }

    const href = item.href;
    const active = isActive(href);
    
    const linkContent = (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 text-muted-foreground transition-all',
           isSubItem ? 'hover:text-primary text-sm py-2' : 'hover:text-primary hover:bg-muted/50 py-2.5',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground': active && !isSubItem,
            'text-primary font-semibold': active && isSubItem,
          },
          { 'justify-center': isCollapsed && !isMobile }
        )}
      >
        <item.icon className={cn("h-5 w-5 shrink-0", isSubItem && "h-4 w-4")} />
        <span className={cn('font-medium', { hidden: isCollapsed && !isMobile }, isSubItem ? 'text-sm' : 'text-base')}>
          {item.label}
        </span>
      </Link>
    );

    if (isCollapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={5}>
                    <p>{item.label}</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    return linkContent;
}
