'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-destructive">
                Error Crítico de la Aplicación
              </h1>
              <p className="text-muted-foreground max-w-md">
                Ha ocurrido un error crítico en la aplicación. El equipo técnico ha sido notificado.
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={reset}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Reiniciar aplicación
              </button>
              <div className="text-xs text-muted-foreground">
                Error ID: {error.digest}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
