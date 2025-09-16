
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { getCategoryVisuals } from '@/domain/constants';
import type { Category } from '@/domain/types';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';

type CategoryCardProps = {
    category: Category;
    resourceCount: number;
    availableResources: number;
    onDelete: (e: React.MouseEvent) => void;
}

export function CategoryCard({ category, resourceCount, availableResources, onDelete }: CategoryCardProps) {
  const { icon: Icon, color } = getCategoryVisuals(category.name);

  const progressValue = resourceCount > 0 ? (availableResources / resourceCount) * 100 : 0;

  return (
    <Link href={`/inventory/${category.name}`} className="block group">
        <Card className={cn("transition-all hover:shadow-lg hover:-translate-y-1 relative border-2 flex flex-col h-full")}>
             <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onDelete}
                aria-label={`Eliminar categoría ${category.name}`}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="font-bold text-lg">{category.name}</CardTitle>
                <div className={cn("p-2 rounded-lg bg-muted")}>
                    <Icon className={cn("h-5 w-5 text-muted-foreground", color)} />
                </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow">
                <p className="text-sm text-muted-foreground">{category.name}</p>
                <div className='mt-auto pt-4'>
                    <p className='text-sm font-semibold'>{availableResources} / {resourceCount} disponibles</p>
                    <Progress value={progressValue} className="h-2 mt-1" />
                </div>
            </CardContent>
        </Card>
    </Link>
  );
}
