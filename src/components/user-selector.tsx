
'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
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
            <label className="text-sm font-medium">¿Quién realiza la solicitud?</label>
            <Button
                variant="outline"
                className="w-full justify-start text-left font-normal h-auto py-3 px-4"
                onClick={() => !disabled && setUserSelectionOpen(true)}
                disabled={disabled}
            >
                {selectedUser ? (
                    <div className="flex items-center gap-3 w-full">
                        <div className="p-1.5 bg-primary/10 rounded-full flex-shrink-0">
                            <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col items-start flex-1 min-w-0">
                            <span className="font-semibold text-sm truncate">{selectedUser.name}</span>
                            <Badge variant="secondary" className="text-xs font-normal mt-1">
                                {selectedUser.role}
                            </Badge>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 w-full text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="text-sm">Buscar docente o administrador...</span>
                    </div>
                )}
            </Button>
            <UserSelectionDialog
                isOpen={isUserSelectionOpen}
                onOpenChange={setUserSelectionOpen}
                onSelectUser={handleSelectUser}
                allUsers={selectableUsers}
            />
        </div>
    );
}
