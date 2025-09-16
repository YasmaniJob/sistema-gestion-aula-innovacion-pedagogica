
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
        <div>
            <label className="text-sm font-medium">¿Quién realiza la solicitud?</label>
            <Button
                variant="outline"
                className="w-full justify-start text-left font-normal mt-2"
                onClick={() => !disabled && setUserSelectionOpen(true)}
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
            <UserSelectionDialog
                isOpen={isUserSelectionOpen}
                onOpenChange={setUserSelectionOpen}
                onSelectUser={handleSelectUser}
                allUsers={selectableUsers}
            />
        </div>
    );
}
