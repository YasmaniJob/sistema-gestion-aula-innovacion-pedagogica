
import { LogOut, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useData } from '@/context/data-provider-refactored';
import { Skeleton } from '../ui/skeleton';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import { SessionIndicator } from '@/components/session-indicator';

type UserProfileProps = {
    isCollapsed: boolean;
};

export function UserProfile({ isCollapsed }: UserProfileProps) {
    const { currentUser, isLoadingUser, signOut } = useData();
    const router = useRouter();
    
    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    if (isLoadingUser) {
        if (isCollapsed) {
            return <Skeleton className="h-10 w-10 rounded-full" />;
        }
        return <Skeleton className="h-12 w-full" />;
    }
    
    if (!currentUser) {
        return null; 
    }

    if (isCollapsed) {
        return (
            <div className="flex items-center justify-center p-2">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
                </Avatar>
            </div>
        );
    }
    
    return (
        <div className="p-2">
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start min-w-0">
                    <p className="font-semibold text-sm leading-tight truncate w-full">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground truncate w-full">{currentUser.role}</p>
                </div>
            </div>
        </div>
    )
}
