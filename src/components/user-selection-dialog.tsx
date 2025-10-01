'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, User, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { LoanUser } from '@/domain/types';

type UserSelectionDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectUser: (user: LoanUser) => void;
  allUsers: LoanUser[];
};

const USERS_PER_PAGE = 10;

export function UserSelectionDialog({
  isOpen,
  onOpenChange,
  onSelectUser,
  allUsers,
}: UserSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(USERS_PER_PAGE);
  const [viewportHeight, setViewportHeight] = useState<number>(0);

  const observer = useRef<IntersectionObserver>();
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredUsers = useMemo(() => allUsers.filter(user =>
    (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.dni && user.dni.toLowerCase().includes(searchQuery.toLowerCase()))) &&
    (user.role === 'Docente' || user.role === 'Admin' || user.role === 'Auxiliar')
  ), [allUsers, searchQuery]);

  const handleSelect = (user: LoanUser) => {
    onSelectUser(user);
    onOpenChange(false);
  }

  // Manejar altura del viewport para móviles
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    if (isOpen) {
      updateViewportHeight();
      window.addEventListener('resize', updateViewportHeight);
      window.addEventListener('orientationchange', updateViewportHeight);

      // Enfocar el input de búsqueda cuando se abre el modal
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      return () => {
        window.removeEventListener('resize', updateViewportHeight);
        window.removeEventListener('orientationchange', updateViewportHeight);
      };
    }
  }, [isOpen]);

  // Reset visible count when search query or dialog visibility changes
  useEffect(() => {
      if(isOpen) {
        setVisibleCount(USERS_PER_PAGE);
      }
  }, [searchQuery, isOpen]);

  const visibleUsers = useMemo(() => filteredUsers.slice(0, visibleCount), [filteredUsers, visibleCount]);
  const canLoadMore = visibleCount < filteredUsers.length;

  const lastUserElementRef = useCallback((node: HTMLButtonElement) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && canLoadMore) {
        setVisibleCount(prevCount => prevCount + USERS_PER_PAGE);
      }
    });
    if (node) observer.current.observe(node);
  }, [canLoadMore]);

  // Calcular altura dinámica basada en viewport y si hay teclado
  const modalHeight = viewportHeight > 0 ? `${Math.min(viewportHeight * 0.9, 600)}px` : 'auto';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 gap-0 max-h-[90vh] overflow-hidden"
        style={{
          height: modalHeight,
          maxHeight: '90vh'
        }}
      >
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-lg">Seleccionar Usuario</DialogTitle>
              <DialogDescription className="text-sm">
                Busca y selecciona al usuario a cargo
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-shrink-0 px-6 py-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Buscar por nombre o DNI..."
              className="pl-9 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="px-6 py-2 border-b bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground">
              {filteredUsers.length === 0 ? (
                'No se encontraron usuarios'
              ) : (
                `Mostrando ${Math.min(visibleCount, filteredUsers.length)} de ${filteredUsers.length} usuario(s)`
              )}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-2">
            <div className="space-y-1 py-2">
              {visibleUsers.map((user, index) => {
                const isLastElement = visibleUsers.length === index + 1;
                return (
                  <Button
                    ref={isLastElement ? lastUserElementRef : null}
                    key={user.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-3 px-4 hover:bg-muted/50"
                    onClick={() => handleSelect(user)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="font-medium text-sm truncate w-full">{user.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs font-normal">
                            {user.role}
                          </Badge>
                          {user.dni && (
                            <span className="text-xs text-muted-foreground">DNI: {user.dni}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}

              {canLoadMore && (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {filteredUsers.length === 0 && searchQuery && (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <User className="h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No se encontraron usuarios que coincidan con "{searchQuery}"
                  </p>
                </div>
              )}

              {filteredUsers.length === 0 && !searchQuery && allUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <User className="h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No hay usuarios disponibles
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
