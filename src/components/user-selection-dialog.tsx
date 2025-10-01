'use client';

import { useState, useMemo } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Input } from '@/components/ui/input';
import { Search, User, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LoanUser } from '@/domain/types';

type UserSelectionDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectUser: (user: LoanUser) => void;
  allUsers: LoanUser[];
};

// Componente Dialog completamente personalizado
const UserSelectionDialogContent = ({
  children,
  ...props
}: { children: React.ReactNode } & React.ComponentPropsWithoutRef<'div'>) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <DialogPrimitive.Content
        className={cn(
          "relative w-full max-w-md max-h-[80vh] bg-background rounded-lg border shadow-2xl",
          "flex flex-col overflow-hidden",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </div>
  </DialogPrimitive.Portal>
);

export function UserSelectionDialog({
  isOpen,
  onOpenChange,
  onSelectUser,
  allUsers,
}: UserSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return allUsers.filter(user =>
        user.role === 'Docente' || user.role === 'Admin' || user.role === 'Auxiliar'
      );
    }

    const query = searchQuery.toLowerCase();
    return allUsers.filter(user =>
      (user.name.toLowerCase().includes(query) ||
      (user.dni && user.dni.toLowerCase().includes(query))) &&
      (user.role === 'Docente' || user.role === 'Admin' || user.role === 'Auxiliar')
    );
  }, [allUsers, searchQuery]);

  const handleSelect = (user: LoanUser) => {
    onSelectUser(user);
    onOpenChange(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={handleClose}>
      <UserSelectionDialogContent>
        <DialogPrimitive.Title className="sr-only">
          Seleccionar Usuario
        </DialogPrimitive.Title>

        {/* Header completamente integrado */}
        <div className="flex items-center justify-between p-4 pb-3 border-b border-border/50">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base text-foreground">Seleccionar Usuario</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filteredUsers.length === 0 && searchQuery
                ? 'No se encontraron usuarios'
                : 'Busca y selecciona un usuario'}
            </p>
          </div>
          <DialogPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogPrimitive.Close>
        </div>

        {/* Campo de búsqueda integrado */}
        <div className="p-4 pt-3 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o DNI..."
              className="pl-9 h-10 bg-background border-border/50 focus:border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Lista de usuarios completamente integrada */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            <div className="p-2">
              {filteredUsers.map((user) => (
                <Button
                  key={user.id}
                  variant="ghost"
                  className="w-full justify-start h-auto py-3 px-3 mb-1 text-left hover:bg-muted/50 active:bg-muted/70 transition-colors"
                  onClick={() => handleSelect(user)}
                >
                  <div className="flex items-center gap-3 w-full min-w-0">
                    <div className="p-1.5 bg-primary/10 rounded-full flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="font-medium text-sm text-foreground truncate w-full">
                        {user.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs font-normal bg-muted/50 text-muted-foreground">
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
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              {searchQuery ? (
                <>
                  <div className="p-3 bg-muted/30 rounded-full mb-4">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">
                    No se encontraron usuarios
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    que coincidan con "{searchQuery}"
                  </p>
                </>
              ) : (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Cargando usuarios...
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </UserSelectionDialogContent>
    </DialogPrimitive.Root>
  );
}
