'use client';

import { useState, useMemo } from 'react';
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
    setSearchQuery(''); // Limpiar búsqueda al seleccionar
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery(''); // Limpiar búsqueda al cerrar
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogTitle className="sr-only">
          Seleccionar Usuario
        </DialogTitle>

        {/* Header fijo */}
        <div className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur-sm">
          <div className="flex-1">
            <h2 className="font-semibold text-base">Seleccionar Usuario</h2>
            <p className="text-sm text-muted-foreground">
              {filteredUsers.length === 0 && searchQuery
                ? 'No se encontraron usuarios'
                : `Selecciona un usuario de la lista`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Campo de búsqueda fijo */}
        <div className="p-4 border-b bg-background/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o DNI..."
              className="pl-9 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Lista de usuarios con scroll */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredUsers.length > 0 ? (
            <div className="p-2">
              {filteredUsers.map((user) => (
                <Button
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
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center p-8">
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
