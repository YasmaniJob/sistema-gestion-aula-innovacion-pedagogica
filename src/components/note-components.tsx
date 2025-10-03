'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Eye, FileText, User, Calendar, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoteButtonProps {
  notes?: string;
  onNotesChange?: (notes: string) => void;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function NoteButton({
  notes,
  onNotesChange,
  variant = 'button',
  size = 'sm',
  className,
  children
}: NoteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNotesChange = (newNotes: string) => {
    if (onNotesChange) {
      onNotesChange(newNotes);
    }
  };

  if (variant === 'icon') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full transition-all duration-200 hover:scale-105",
              "hover:bg-blue-50 hover:border-blue-200 border border-transparent",
              "focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
              notes && notes.trim().length > 0
                ? "text-blue-600 bg-blue-50/50 border-blue-200"
                : "text-gray-400 hover:text-blue-600",
              className
            )}
            title={notes && notes.trim().length > 0 ? "Ver notas del préstamo" : "Sin notas"}
          >
            <MessageSquare className={cn(
              "h-4 w-4 transition-colors",
              notes && notes.trim().length > 0 ? "text-blue-600" : "text-gray-400"
            )} />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Notas del Préstamo
            </DialogTitle>
            <DialogDescription>
              {onNotesChange ? 'Edita las notas de tu solicitud de préstamo' : 'Revisa las notas adicionales de la solicitud'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Card>
              <CardContent className="p-4">
                {onNotesChange ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Edit3 className="h-4 w-4" />
                      Editar Notas
                    </div>
                    <textarea
                      value={notes || ''}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder="Agrega información adicional sobre tu solicitud de préstamo..."
                      className="w-full min-h-[140px] px-3 py-3 border border-input bg-background text-sm rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Contenido de las Notas
                    </div>
                    <div className="min-h-[140px] p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      {notes ? (
                        <p className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">{notes}</p>
                      ) : (
                        <div className="flex items-center justify-center h-full text-blue-500">
                          <div className="text-center">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm text-blue-600/80">Sin notas adicionales</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size={size} className={className}>
          <MessageSquare className="mr-2 h-4 w-4" />
          {children || (notes ? 'Ver Notas' : 'Agregar Notas')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Notas del Préstamo
          </DialogTitle>
          <DialogDescription>
            {onNotesChange ? 'Edita las notas de tu solicitud de préstamo' : 'Revisa las notas adicionales de la solicitud'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Card>
            <CardContent className="p-4">
              {onNotesChange ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Edit3 className="h-4 w-4" />
                    Editar Notas
                  </div>
                  <textarea
                    value={notes || ''}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Agrega información adicional sobre tu solicitud de préstamo..."
                    className="w-full min-h-[140px] px-3 py-3 border border-input bg-background text-sm rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Contenido de las Notas
                  </div>
                  <div className="min-h-[140px] p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    {notes ? (
                      <p className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">{notes}</p>
                    ) : (
                      <div className="flex items-center justify-center h-full text-blue-500">
                        <div className="text-center">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm text-blue-600/80">Sin notas adicionales</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente para mostrar solo las notas (sin botón)
export function NoteDisplay({ notes }: { notes?: string }) {
  if (!notes) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
        <MessageSquare className="h-4 w-4" />
        Notas Adicionales
      </div>
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">{notes}</p>
      </div>
    </div>
  );
}
