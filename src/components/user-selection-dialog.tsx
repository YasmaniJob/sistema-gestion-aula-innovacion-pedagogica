
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
import { Search, User, Loader2 } from 'lucide-react';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
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

  const observer = useRef<IntersectionObserver>();
  
  const filteredUsers = useMemo(() => allUsers.filter(user =>
    (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.dni && user.dni.toLowerCase().includes(searchQuery.toLowerCase()))) &&
    (user.role === 'Docente' || user.role === 'Admin' || user.role === 'Auxiliar')
  ), [allUsers, searchQuery]);

  const handleSelect = (user: LoanUser) => {
    onSelectUser(user);
    onOpenChange(false);
  }
  
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccionar Usuario</DialogTitle>
          <DialogDescription>
            Busca y selecciona al usuario (docente, auxiliar o admin) a cargo.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o DNI..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Separator />
        <div className="flex-grow overflow-hidden flex flex-col">
            <p className="text-sm font-medium text-muted-foreground px-1 mb-2">
                Mostrando {Math.min(visibleCount, filteredUsers.length)} de {filteredUsers.length} usuario(s)
            </p>
            <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2 flex-grow">
                {visibleUsers.map((user, index) => {
                    const isLastElement = visibleUsers.length === index + 1;
                    return (
                        <Button 
                            ref={isLastElement ? lastUserElementRef : null}
                            key={user.id} 
                            variant="ghost" 
                            className="w-full justify-start h-auto py-2"
                            onClick={() => handleSelect(user)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-full">
                                    <User className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold">{user.name}</span>
                                    <Badge variant="secondary" className="font-normal">{user.role}</Badge>
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
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
