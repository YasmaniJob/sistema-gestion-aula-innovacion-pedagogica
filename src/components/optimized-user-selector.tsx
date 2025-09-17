'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { MobileDialogContent } from '@/components/ui/mobile-dialog';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { Separator } from './ui/separator';
import type { LoanUser } from '@/domain/types';
import { useData } from '@/context/data-provider-refactored';

type OptimizedUserSelectorProps = {
    selectedUser: LoanUser | null;
    onUserSelect: (user: LoanUser) => void;
    disabled?: boolean;
}

const USERS_PER_PAGE = 15;
const SEARCH_DEBOUNCE_MS = 300;

export function OptimizedUserSelector({ selectedUser, onUserSelect, disabled = false }: OptimizedUserSelectorProps) {
    const { users } = useData();
    const [isUserSelectionOpen, setUserSelectionOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(USERS_PER_PAGE);
    const observer = useRef<IntersectionObserver>();
    const searchTimeoutRef = useRef<NodeJS.Timeout>();

    // Debounce search query
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    // Solo filtrar usuarios cuando el diálogo esté abierto y con debounce
    const filteredUsers = useMemo(() => {
        if (!isUserSelectionOpen) return [];
        
        const selectableUsers = users.filter(u => u.role === 'Docente' || u.role === 'Admin');
        
        if (!debouncedSearchQuery.trim()) {
            return selectableUsers;
        }
        
        const query = debouncedSearchQuery.toLowerCase();
        return selectableUsers.filter(user =>
            user.name.toLowerCase().includes(query) ||
            (user.dni && user.dni.toLowerCase().includes(query))
        );
    }, [users, isUserSelectionOpen, debouncedSearchQuery]);

    // Reset visible count when search query or dialog visibility changes
    useEffect(() => {
        if (isUserSelectionOpen) {
            setVisibleCount(USERS_PER_PAGE);
        }
    }, [debouncedSearchQuery, isUserSelectionOpen]);

    const visibleUsers = useMemo(() => 
        filteredUsers.slice(0, visibleCount), 
        [filteredUsers, visibleCount]
    );
    
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

    const handleSelectUser = (user: LoanUser) => {
        onUserSelect(user);
        setUserSelectionOpen(false);
        setSearchQuery('');
        setDebouncedSearchQuery('');
    };

    const handleOpenDialog = () => {
        if (!disabled) {
            setUserSelectionOpen(true);
            setVisibleCount(USERS_PER_PAGE);
        }
    };

    const handleCloseDialog = (isOpen: boolean) => {
        setUserSelectionOpen(isOpen);
        if (!isOpen) {
            setSearchQuery('');
            setDebouncedSearchQuery('');
            setVisibleCount(USERS_PER_PAGE);
        }
    };

    return (
        <div>
            <label className="text-sm font-medium">¿Quién realiza la solicitud?</label>
            <Button
                variant="outline"
                className="w-full justify-start text-left font-normal mt-2"
                onClick={handleOpenDialog}
                disabled={disabled}
            >
                {selectedUser ? (
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{selectedUser.name}</span>
                        <Badge variant="secondary" className="ml-2">{selectedUser.role}</Badge>
                    </div>
                ) : (
                    <span className="text-muted-foreground">Buscar docente o administrador...</span>
                )}
            </Button>
            
            <Dialog open={isUserSelectionOpen} onOpenChange={handleCloseDialog}>
                <MobileDialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Seleccionar Usuario</DialogTitle>
                        <DialogDescription>
                            Busca y selecciona al usuario (docente o admin) a cargo.
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
                            {searchQuery !== debouncedSearchQuery && (
                                <span className="ml-2 text-xs">(buscando...)</span>
                            )}
                        </p>
                        <div className="max-h-[300px] max-sm:max-h-[calc(80vh-12rem)] overflow-y-auto space-y-1 pr-2 flex-grow">
                            {visibleUsers.map((user, index) => {
                                const isLastElement = visibleUsers.length === index + 1;
                                return (
                                    <Button 
                                        ref={isLastElement ? lastUserElementRef : null}
                                        key={user.id} 
                                        variant="ghost" 
                                        className="w-full justify-start h-auto py-2"
                                        onClick={() => handleSelectUser(user)}
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
                            {filteredUsers.length === 0 && debouncedSearchQuery && (
                                <div className="flex flex-col items-center justify-center p-8 text-center">
                                    <User className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        No se encontraron usuarios que coincidan con "{debouncedSearchQuery}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </MobileDialogContent>
            </Dialog>
        </div>
    );
}