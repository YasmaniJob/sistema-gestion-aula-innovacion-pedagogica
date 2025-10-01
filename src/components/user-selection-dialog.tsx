'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
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

const USERS_PER_PAGE = 20;

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

  // Detectar altura del viewport
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    if (isOpen) {
      setTimeout(() => {
        updateViewportHeight();
        inputRef.current?.focus();
      }, 100);

      window.addEventListener('resize', updateViewportHeight);
      window.addEventListener('orientationchange', updateViewportHeight);

      return () => {
        window.removeEventListener('resize', updateViewportHeight);
        window.removeEventListener('orientationchange', updateViewportHeight);
      };
    }
  }, [isOpen]);

  // Reset visible count when search query changes
  useEffect(() => {
    if (isOpen) {
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

  // Calcular altura óptima del modal
  const modalHeight = viewportHeight > 0 ? `${Math.min(viewportHeight * 0.8, 600)}px` : 'auto';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 gap-0 overflow-hidden"
        style={{
          height: modalHeight,
          maxHeight: '80vh'
        }}
      >
        <DialogTitle className="sr-only">
          Seleccionar Usuario para Préstamo
        </DialogTitle>

        {/* Header personalizado */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Seleccionar Usuario</h2>
            <p className="text-sm text-muted-foreground">
              Busca y selecciona al usuario a cargo
            </p>
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

        {/* Campo de búsqueda */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Buscar por nombre o DNI..."
              className="pl-9 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        </div>

        {/* Información de resultados */}
        <div className="px-4 py-2 bg-muted/20 border-b">
          <p className="text-xs font-medium text-muted-foreground">
            {filteredUsers.length === 0 ? (
              searchQuery ? 'No se encontraron usuarios' : 'Cargando usuarios...'
            ) : (
              `Mostrando ${Math.min(visibleCount, filteredUsers.length)} de ${filteredUsers.length} usuario(s)`
            )}
          </p>
        </div>

        {/* Lista de usuarios */}
        <div className="flex-1 overflow-y-auto">
          {visibleUsers.length > 0 ? (
            <div className="p-2">
              {visibleUsers.map((user, index) => {
                const isLastElement = visibleUsers.length === index + 1;
                return (
                  <Button
                    ref={isLastElement ? lastUserElementRef : null}
                    key={user.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-3 px-3 mb-1 hover:bg-muted/70 active:bg-muted/80 transition-colors"
                    onClick={() => handleSelect(user)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-1.5 bg-primary/10 rounded-full flex-shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="font-medium text-sm truncate w-full text-left">
                          {user.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-xs font-normal">
                            {user.role}
                          </Badge>
                          {user.dni && (
                            <span className="text-xs text-muted-foreground">
                              DNI: {user.dni}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}

              {/* Indicador de carga para más resultados */}
              {canLoadMore && (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              {searchQuery ? (
                <>
                  <User className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">
                    No se encontraron usuarios
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    que coincidan con "{searchQuery}"
                  </p>
                </>
              ) : (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Cargando usuarios...
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
