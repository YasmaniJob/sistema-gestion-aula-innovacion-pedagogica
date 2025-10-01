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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const observer = useRef<IntersectionObserver>();
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const filteredUsers = useMemo(() => allUsers.filter(user =>
    (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.dni && user.dni.toLowerCase().includes(searchQuery.toLowerCase()))) &&
    (user.role === 'Docente' || user.role === 'Admin' || user.role === 'Auxiliar')
  ), [allUsers, searchQuery]);

  const handleSelect = (user: LoanUser) => {
    onSelectUser(user);
    onOpenChange(false);
  }

  // Detectar altura del viewport y teclado virtual
  useEffect(() => {
    const updateViewportHeight = () => {
      const height = window.innerHeight;
      setViewportHeight(height);

      // Detectar si el teclado está visible (reducción significativa de altura)
      const isKeyboard = height < window.screen.height * 0.7;
      setIsKeyboardVisible(isKeyboard);
    };

    if (isOpen) {
      // Pequeño delay para asegurar que el modal esté renderizado
      setTimeout(() => {
        updateViewportHeight();
        inputRef.current?.focus();
      }, 100);

      window.addEventListener('resize', updateViewportHeight);
      window.addEventListener('orientationchange', updateViewportHeight);

      // También escuchar cambios de viewport (teclado virtual)
      const viewportHandler = () => {
        setTimeout(updateViewportHeight, 300);
      };
      window.visualViewport?.addEventListener('resize', viewportHandler);

      return () => {
        window.removeEventListener('resize', updateViewportHeight);
        window.removeEventListener('orientationchange', updateViewportHeight);
        window.visualViewport?.removeEventListener('resize', viewportHandler);
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

  // Calcular altura óptima del modal para móviles
  const getModalHeight = () => {
    if (!viewportHeight) return 'auto';

    // Si el teclado está visible, usar altura reducida
    if (isKeyboardVisible) {
      return `${Math.min(viewportHeight * 0.85, 500)}px`;
    }

    // Sin teclado, usar altura completa disponible
    return `${Math.min(viewportHeight * 0.9, 600)}px`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        ref={modalRef}
        className="sm:max-w-md p-0 gap-0 max-h-[95vh] overflow-hidden mx-4"
        style={{
          height: getModalHeight(),
          maxHeight: '95vh'
        }}
      >
        <DialogHeader className="px-4 py-3 border-b bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold truncate">
                Seleccionar Usuario
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Busca y selecciona al usuario a cargo
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-shrink-0 px-4 py-3 border-b bg-background/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Buscar por nombre o DNI..."
              className="pl-9 pr-4 h-10 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Información de resultados */}
          <div className="px-4 py-2 border-b bg-muted/20">
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
            <div className="p-2">
              {visibleUsers.length > 0 ? (
                <div className="space-y-1">
                  {visibleUsers.map((user, index) => {
                    const isLastElement = visibleUsers.length === index + 1;
                    return (
                      <Button
                        ref={isLastElement ? lastUserElementRef : null}
                        key={user.id}
                        variant="ghost"
                        className="w-full justify-start h-auto py-3 px-3 hover:bg-muted/70 active:bg-muted/80 transition-colors"
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
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
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

              {/* Indicador de carga para más resultados */}
              {canLoadMore && (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
