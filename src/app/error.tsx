'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-destructive">
            Algo salió mal
          </h1>
          <p className="text-muted-foreground max-w-md">
            Ha ocurrido un error inesperado. Puedes intentar recargar la página o contactar al administrador.
          </p>
        </div>
        <div className="space-y-2">
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Intentar de nuevo
          </button>
          <div className="text-xs text-muted-foreground">
            Error: {error.message}
          </div>
        </div>
      </div>
    </div>
  );
}
