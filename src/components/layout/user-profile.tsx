
'use client';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full w-full">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" side="right" sideOffset={12}>
                    <DropdownMenuLabel>
                        <p className="font-semibold">{currentUser.name}</p>
                        <p className="text-xs text-muted-foreground font-normal">{currentUser.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1">
                        <SessionIndicator compact={true} showLastActivity={false} />
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/profile"><User className="mr-2 h-4 w-4"/>Perfil</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4"/>Cerrar Sesión
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }
    
    return (
       <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                            <p className="font-semibold text-sm leading-tight">{currentUser.name}</p>
                            <p className="text-xs text-muted-foreground">{currentUser.role}</p>
                        </div>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mb-2">
                <div className="px-2 py-2">
                    <SessionIndicator compact={false} showLastActivity={true} />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile"><User className="mr-2 h-4 w-4"/>Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4"/>Cerrar Sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
