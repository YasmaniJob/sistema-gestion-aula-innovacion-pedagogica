'use client';

import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Lazy loading de componentes pesados
export const LazyReservationCalendar = lazy(() => 
  import('@/components/reservation-calendar').then(module => ({ 
    default: module.ReservationCalendar 
  }))
);

export const LazyReportsCharts = lazy(() => 
  import('recharts').then(module => ({
    default: module
  }))
);

export const LazyUserSelector = lazy(() => 
  import('@/components/user-selector').then(module => ({ 
    default: module.UserSelector 
  }))
);

export const LazyCategorySelector = lazy(() => 
  import('@/components/category-selector').then(module => ({ 
    default: module.CategorySelector 
  }))
);

export const LazyExportDialog = lazy(() => 
  import('@/components/export-dialog').then(module => ({ 
    default: module.ExportDialog 
  }))
);

export const LazyUserImportDialog = lazy(() => 
  import('@/components/user-import-dialog').then(module => ({ 
    default: module.UserImportDialog 
  }))
);

// Componentes de loading específicos
export const CalendarSkeleton = () => (
  <Card className="w-full">
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-64" />
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-7 gap-2 mb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </CardContent>
  </Card>
);

export const ChartSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
);

export const FormSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-20 w-full" />
    <div className="flex gap-2">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

export const LoadingSpinner = ({ text = 'Cargando...' }: { text?: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  </div>
);

// HOC para lazy loading con suspense
export function withLazyLoading<T extends object>(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<T>>,
  fallback?: React.ReactNode
) {
  return function WrappedComponent(props: T) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Componentes envueltos listos para usar
export const ReservationCalendarLazy = withLazyLoading(
  LazyReservationCalendar,
  <CalendarSkeleton />
);

export const UserSelectorLazy = withLazyLoading(
  LazyUserSelector,
  <FormSkeleton />
);

export const CategorySelectorLazy = withLazyLoading(
  LazyCategorySelector,
  <FormSkeleton />
);

export const ExportDialogLazy = withLazyLoading(
  LazyExportDialog,
  <LoadingSpinner text="Preparando exportación..." />
);

export const UserImportDialogLazy = withLazyLoading(
  LazyUserImportDialog,
  <LoadingSpinner text="Preparando importación..." />
);