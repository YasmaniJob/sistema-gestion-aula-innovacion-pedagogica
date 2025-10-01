
'use client';

import { useState } from 'react';
import { User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { LoanUser } from '@/domain/types';
import { UserSelectionDialog } from '@/components/user-selection-dialog';
import { useData } from '@/context/data-provider-refactored';
import { useMemo } from 'react';

type UserSelectorProps = {
    selectedUser: LoanUser | null;
    onUserSelect: (user: LoanUser) => void;
    disabled?: boolean;
}

export function UserSelector({ selectedUser, onUserSelect, disabled = false }: UserSelectorProps) {
    const { users } = useData();
    const [isUserSelectionOpen, setUserSelectionOpen] = useState(false);

    const selectableUsers = useMemo(() => {
        return users.filter(u => u.role === 'Docente' || u.role === 'Admin');
    }, [users]);

    const handleSelectUser = (user: LoanUser) => {
        onUserSelect(user);
        setUserSelectionOpen(false);
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
                ¿Quién realiza la solicitud?
            </label>
            <div className="relative">
                <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal h-12 px-4 border-2 focus:border-primary transition-colors"
                    onClick={() => !disabled && setUserSelectionOpen(true)}
                    disabled={disabled}
                >
                    {selectedUser ? (
                        <div className="flex items-center gap-3 w-full min-w-0">
                            <div className="p-1.5 bg-primary/10 rounded-full flex-shrink-0">
                                <User className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex flex-col items-start flex-1 min-w-0">
                                <span className="font-semibold text-sm truncate w-full">
                                    {selectedUser.name}
                                </span>
                                <Badge variant="secondary" className="text-xs font-normal mt-0.5">
                                    {selectedUser.role}
                                </Badge>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 w-full text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span className="text-sm">Buscar docente o administrador...</span>
                            <ChevronDown className="h-4 w-4 ml-auto" />
                        </div>
                    )}
                </Button>

                {/* Indicador de estado */}
                {isUserSelectionOpen && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary animate-pulse z-10" />
                )}
            </div>

            <UserSelectionDialog
                isOpen={isUserSelectionOpen}
                onOpenChange={setUserSelectionOpen}
                onSelectUser={handleSelectUser}
                allUsers={selectableUsers}
            />
        </div>
    );
}
