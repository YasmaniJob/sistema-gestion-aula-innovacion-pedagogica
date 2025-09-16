'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { useData } from '@/context/data-provider-refactored';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SessionIndicatorProps {
  className?: string;
  showLastActivity?: boolean;
  compact?: boolean;
}

export function SessionIndicator({ 
  className, 
  showLastActivity = false, 
  compact = false 
}: SessionIndicatorProps) {
  const { manualRefresh, extendSession, isSessionActive, lastActivity } = useSession();
  const { currentUser } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastActivityText, setLastActivityText] = useState('');

  // Actualizar texto de última actividad cada minuto
  useEffect(() => {
    if (!showLastActivity || !lastActivity) return;

    const updateLastActivityText = () => {
      setLastActivityText(
        formatDistanceToNow(new Date(lastActivity), {
          addSuffix: true,
          locale: es
        })
      );
    };

    updateLastActivityText();
    const interval = setInterval(updateLastActivityText, 60000); // Cada minuto

    return () => clearInterval(interval);
  }, [lastActivity, showLastActivity]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await manualRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExtendSession = () => {
    extendSession();
  };

  if (!currentUser) {
    return null;
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-1', className)}>
              <div className={cn(
                'w-2 h-2 rounded-full',
                isSessionActive ? 'bg-green-500' : 'bg-red-500'
              )} />
              {showLastActivity && (
                <span className="text-xs text-muted-foreground">
                  {lastActivityText}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">
                Sesión: {isSessionActive ? 'Activa' : 'Inactiva'}
              </p>
              {showLastActivity && lastActivityText && (
                <p className="text-sm text-muted-foreground">
                  Última actividad: {lastActivityText}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge 
        variant={isSessionActive ? 'default' : 'destructive'}
        className="flex items-center gap-1"
      >
        {isSessionActive ? (
          <Wifi className="w-3 h-3" />
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
        {isSessionActive ? 'Sesión Activa' : 'Sesión Inactiva'}
      </Badge>

      {showLastActivity && lastActivityText && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{lastActivityText}</span>
        </div>
      )}

      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={cn(
                  'w-3 h-3',
                  isRefreshing && 'animate-spin'
                )} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refrescar sesión manualmente</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExtendSession}
                className="h-6 px-2 text-xs"
              >
                Extender
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Extender tiempo de sesión</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}