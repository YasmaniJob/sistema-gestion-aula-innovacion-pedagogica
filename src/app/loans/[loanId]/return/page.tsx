
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  ShieldAlert,
  MessageSquarePlus,
  User,
  Hash,
  Camera,
  Check,
  CheckCircle,
  XCircle,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { Loan, DamageReport, SuggestionReport, Resource } from '@/domain/types';
import { cn } from '@/lib/utils';
import { Accordion } from '@/components/ui/accordion';
import { DamageReportForm } from '@/components/damage-report-form';
import { SuggestionReportForm } from '@/components/suggestion-report-form';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-provider-refactored';

type ValidationStatus = 'idle' | 'valid' | 'invalid' | 'incomplete';

export default function ReturnLoanPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { loans, processReturn } = useData();
  const loanId = params.loanId as string;
  
  const [loan, setLoan] = useState<Loan | null>(null);
  const [dni, setDni] = useState('');
  const [formattedLoanDate, setFormattedLoanDate] = useState<string | null>(null);
  const [formattedReturnDate, setFormattedReturnDate] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  
  const [showDamageReport, setShowDamageReport] = useState(false);
  const [damageReports, setDamageReports] = useState<Record<string, DamageReport>>({});
  
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [suggestionReports, setSuggestionReports] = useState<Record<string, SuggestionReport>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const foundLoan = loans.find(l => l.id === loanId);
    if (foundLoan) {
      setLoan(foundLoan);
    }
  }, [loanId, loans]);

  useEffect(() => {
    if (loan) {
      const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
      const loanDate = loan.loanDate instanceof Date ? loan.loanDate : new Date(loan.loanDate);
      if (loanDate instanceof Date && !isNaN(loanDate.getTime())) {
        setFormattedLoanDate(loanDate.toLocaleDateString('es-ES', options));
      } else {
        setFormattedLoanDate('Fecha inválida');
      }
      setFormattedReturnDate(new Date().toLocaleDateString('es-ES', options));
    }
  }, [loan]);

  useEffect(() => {
    if (dni.length === 0) {
      setValidationStatus('idle');
      return;
    }
    if (dni.length < 8) {
      setValidationStatus('incomplete');
    } else {
      if (dni === loan?.user.dni) {
        setValidationStatus('valid');
      } else {
        setValidationStatus('invalid');
      }
    }
  }, [dni, loan]);

  const handleDamageReportChange = useCallback((resourceId: string, report: DamageReport) => {
    setDamageReports(prev => ({ ...prev, [resourceId]: report }));
  }, []);

  const handleSuggestionReportChange = useCallback((resourceId: string, report: SuggestionReport) => {
    setSuggestionReports(prev => ({ ...prev, [resourceId]: report }));
  }, []);
  
  const handleConfirmReturn = () => {
    if (!loan) return;
    setIsSubmitting(true);
    
    processReturn(loan.id, damageReports, suggestionReports);

    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: '¡Devolución Exitosa!',
        description: `La devolución para ${loan?.user.name} ha sido registrada correctamente.`,
        variant: 'default',
      });
      router.push('/loans');
    }, 1000);
  };
  
  const totalDamageReports = Object.values(damageReports).filter(r => r.commonProblems.length > 0 || r.otherNotes.trim() !== '').length;
  const totalSuggestionReports = Object.values(suggestionReports).filter(r => r.commonSuggestions.length > 0 || r.otherNotes.trim() !== '').length;

  if (!loan) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-4">Cargando préstamo...</p>
        </div>
    );
  }
  
  const showIncompleteMessage = validationStatus === 'incomplete' && dni.length > 0;
  
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Link href="/loans" className="hover:text-primary">
              Préstamos
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-primary">Devolver Préstamo</span>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold hidden sm:block">
        Registrar Devolución de: <span className="text-primary">{loan.user.name}</span>
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Validar Docente</CardTitle>
                    <CardDescription>
                        Ingresa el DNI de <strong>{loan.user.name}</strong> para confirmar la devolución.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
                     <InputOTP 
                        maxLength={8} 
                        value={dni} 
                        onChange={setDni}
                        className={cn(
                            (validationStatus === 'invalid' || showIncompleteMessage) && 'is-invalid'
                        )}
                     >
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                            <InputOTPSlot index={6} />
                            <InputOTPSlot index={7} />
                        </InputOTPGroup>
                    </InputOTP>
                     <div className="h-6 mt-2">
                        {validationStatus === 'valid' && (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-500/90">
                                <CheckCircle className="mr-2 h-4 w-4" /> DNI Válido
                            </Badge>
                        )}
                        {validationStatus === 'invalid' && (
                             <Badge variant="destructive">
                                <XCircle className="mr-2 h-4 w-4" /> DNI Inválido
                            </Badge>
                        )}
                        {showIncompleteMessage && (
                            <p className="text-sm text-destructive">
                                El DNI debe tener 8 dígitos.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  variant={showDamageReport ? 'destructive' : 'outline'}
                  size="lg" 
                  onClick={() => setShowDamageReport(prev => !prev)}
                  disabled={isSubmitting}
                >
                    <ShieldAlert className="mr-2" />
                    Reportar Daños
                    <ChevronDown className={cn("ml-auto h-5 w-5 transition-transform", showDamageReport && "rotate-180")} />
                </Button>
                <Button
                  variant={showSuggestionForm ? 'secondary' : 'outline'}
                  size="lg"
                  onClick={() => setShowSuggestionForm(prev => !prev)}
                  className={cn(showSuggestionForm && 'bg-amber-500 text-white hover:bg-amber-500/90')}
                  disabled={isSubmitting}
                >
                  <MessageSquarePlus className="mr-2" />
                  Añadir Sugerencias
                  <ChevronDown className={cn("ml-auto h-5 w-5 transition-transform", showSuggestionForm && "rotate-180")} />
                </Button>
            </div>
            
            {showDamageReport && (
              <Card>
                <CardHeader>
                  <CardTitle>Seleccionar Recursos Dañados</CardTitle>
                  <CardDescription>
                    Expande cada recurso para añadir un reporte de daños.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {loan.resources.map(resource => (
                      <DamageReportForm 
                        key={resource.id}
                        resource={resource}
                        onReportChange={(report) => handleDamageReportChange(resource.id, report)}
                      />
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {showSuggestionForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Añadir Sugerencias por Recurso</CardTitle>
                  <CardDescription>
                    Deja sugerencias para el mantenimiento o mejora de cada recurso.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {loan.resources.map(resource => (
                      <SuggestionReportForm
                        key={resource.id}
                        resource={resource}
                        onReportChange={(report) => handleSuggestionReportChange(resource.id, report)}
                      />
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}

        </div>

        <div className="sticky top-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Préstamo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Docente:</span>
                    <span className="font-semibold">{loan.user.name}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Fecha Préstamo:</span>
                    <span className="font-semibold">
                      {formattedLoanDate || 'Cargando...'}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Fecha de Devolución:</span>
                    <span className="font-semibold">
                      {formattedReturnDate || 'Cargando...'}
                    </span>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    Recursos en Préstamo ({loan.resources.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {loan.resources.map(resource => (
                    <div key={resource.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{resource.name}</p>
                          <p className="text-xs text-muted-foreground">{resource.brand}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button size="lg" className="w-full" disabled={validationStatus !== 'valid' || isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2"/>
                                Confirmar Devolución
                            </>
                        )}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar Devolución?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se registrará la devolución para <strong>{loan.user.name}</strong>. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="text-sm text-muted-foreground">
                        <ul className='list-disc pl-5 mt-2 space-y-1'>
                            <li><strong>{totalDamageReports}</strong> {totalDamageReports === 1 ? 'recurso reportado' : 'recursos reportados'} con daños.</li>
                            <li><strong>{totalSuggestionReports}</strong> {totalSuggestionReports === 1 ? 'recurso con' : 'recursos con'} sugerencias.</li>
                        </ul>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmReturn}>
                            Sí, confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
