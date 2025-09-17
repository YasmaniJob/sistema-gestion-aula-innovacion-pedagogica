'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadingWithTimeoutProps {
  timeout?: number;
  onTimeout?: () => void;
  onRetry?: () => void;
  message?: string;
  timeoutMessage?: string;
}

export function LoadingWithTimeout({
  timeout = 15000, // 15 segundos por defecto
  onTimeout,
  onRetry,
  message = "Cargando...",
  timeoutMessage = "La carga está tomando más tiempo del esperado. Esto puede deberse a problemas de conexión."
}: LoadingWithTimeoutProps) {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    
    // Actualizar tiempo transcurrido cada segundo
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);
      
      if (elapsed >= timeout && !hasTimedOut) {
        setHasTimedOut(true);
        onTimeout?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeout, onTimeout, hasTimedOut]);

  const handleRetry = () => {
    setHasTimedOut(false);
    setElapsedTime(0);
    onRetry?.();
  };

  const handleReload = () => {
    window.location.reload();
  };

  if (hasTimedOut) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Tiempo de carga agotado</h2>
          <p className="text-gray-600 mb-6">{timeoutMessage}</p>
          
          <div className="space-y-3">
            {onRetry && (
              <Button onClick={handleRetry} className="w-full">
                Reintentar
              </Button>
            )}
            <Button onClick={handleReload} variant="outline" className="w-full">
              Recargar página
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Tiempo transcurrido: {Math.round(elapsedTime / 1000)}s
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
      <p className="text-gray-600 mb-2">{message}</p>
      <p className="text-sm text-gray-500">
        {Math.round(elapsedTime / 1000)}s transcurridos
      </p>
      
      {elapsedTime > 5000 && (
        <p className="text-xs text-gray-400 mt-2 text-center max-w-xs">
          Si la carga continúa, puede haber un problema de conexión
        </p>
      )}
    </div>
  );
}