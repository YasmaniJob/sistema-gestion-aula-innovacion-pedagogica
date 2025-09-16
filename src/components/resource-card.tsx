
'use client';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Resource } from '@/domain/types';
import { cn } from '@/lib/utils';
import { statusStyles } from '@/domain/constants';
import { Camera, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

type ResourceCardProps = {
    resource: Resource;
    onClick: (resource: Resource) => void;
    onDelete: (e: React.MouseEvent) => void;
}

export function ResourceCard({ resource, onClick, onDelete }: ResourceCardProps) {
    
    const handleDeleteClick = (e: React.MouseEvent) => {
        // Stop the click from bubbling up to the main card's onClick handler
        e.stopPropagation();
        onDelete(e);
    };

    return (
        <div
            className={cn(
                'group relative rounded-lg border bg-card text-card-foreground shadow-sm transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                statusStyles[resource.status].border
            )}
        >
            {/* Delete button, with a higher z-index to be on top */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                onClick={handleDeleteClick}
                aria-label={`Eliminar recurso ${resource.name}`}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
            
            {/* Main clickable area, which doesn't include the delete button */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => onClick(resource)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick(resource)}
                className="flex flex-col text-left h-full cursor-pointer z-10"
                aria-label={`Ver detalles de ${resource.name}`}
            >
                <CardHeader className="flex-row items-start justify-between pb-2 w-full">
                    <div className="flex items-center gap-3">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                        <div className="grid gap-0.5">
                            <CardTitle className="text-base font-semibold">{resource.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{resource.brand}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="mt-auto pt-2 flex items-center justify-between w-full">
                    <Badge className={cn('font-normal', statusStyles[resource.status].badge)}>
                        {statusStyles[resource.status].label}
                    </Badge>
                </CardContent>
            </div>
        </div>
    );
}
