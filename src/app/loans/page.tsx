
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRightLeft,
  Download,
  Filter,
  History,
  PlusCircle,
  Search,
  X,
  ShieldAlert,
  MessageSquarePlus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isBefore, startOfDay, isWithinInterval } from 'date-fns';
import type { Loan, Resource } from '@/domain/types';
import { LoanCard } from '@/components/loan-card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { IncidentsReportDialog } from '@/components/incidents-report-dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-provider-refactored';
import { useAuthorization } from '@/hooks/use-authorization';
import { usePageTitle } from '@/hooks/use-page-title';
import { cn } from '@/lib/utils';

export default function LoansPage() {
  useAuthorization('Admin');
  usePageTitle('Gestión de Préstamos');
  const { loans, approveLoan, rejectLoan, isLoadingUser, isLoadingData } = useData();
  const [activeTab, setActiveTab] = useState('active');
  
  const { toast } = useToast();
  const [processingLoanId, setProcessingLoanId] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [filterWithDamages, setFilterWithDamages] = useState(false);
  const [filterWithSuggestions, setFilterWithSuggestions] = useState(false);

  const [selectedIncident, setSelectedIncident] = useState<{loan: Loan, resource: Pick<Resource, 'id' | 'name' | 'brand'>} | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFilterType, setExportFilterType] = useState<'all' | 'active' | 'overdue' | 'pending' | 'returned'>('all');

  const { pendingLoans, activeLoans, historicalLoans } = useMemo(() => {
    const pending: Loan[] = [];
    const active: Loan[] = [];
    const historical: Loan[] = [];
    loans.forEach(loan => {
      if (loan.status === 'pending') {
        pending.push(loan);
      } else if (loan.status === 'active') {
        active.push(loan);
      } else {
        historical.push(loan);
      }
    });
    return { pendingLoans: pending, activeLoans: active, historicalLoans: historical };
  }, [loans]);

  
  const handleViewIncidents = (loan: Loan, resource: Pick<Resource, 'id' | 'name' | 'brand'>) => {
    setSelectedIncident({ loan, resource });
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setShowOnlyOverdue(false);
    setDateRange(undefined);
    setFilterWithDamages(false);
    setFilterWithSuggestions(false);
  };
  
  useEffect(() => {
    clearFilters();
  }, [activeTab]);

  const handleLoanApproval = async (loanId: string) => {
    const loanToApprove = loans.find(loan => loan.id === loanId);
    if (!loanToApprove) return;

    setProcessingLoanId(loanId);
    try {
      await approveLoan(loanId);
      toast({
          title: "Solicitud Aprobada",
          description: `El préstamo para ${loanToApprove.user.name} ha sido aprobado.`,
          variant: 'default',
      });
    } catch (error: any) {
        toast({
            title: "Error al Aprobar",
            description: error.message || "No se pudo aprobar la solicitud en el servidor.",
            variant: 'destructive',
        });
    } finally {
        setProcessingLoanId(null);
    }
  };

  const handleLoanRejection = async (loanId: string) => {
      const loanToReject = loans.find(loan => loan.id === loanId);
      if (!loanToReject) return;

      setProcessingLoanId(loanId);
      try {
          await rejectLoan(loanId);
          toast({
              title: "Solicitud Rechazada",
              description: `La solicitud de ${loanToReject.user.name} ha sido rechazada.`,
              variant: 'destructive',
          });
      } catch (error: any) {
          toast({
              title: "Error al Rechazar",
              description: error.message || "No se pudo rechazar la solicitud en el servidor.",
              variant: 'destructive',
          });
      } finally {
          setProcessingLoanId(null);
      }
  };

  const filteredPendingLoans = useMemo(() => {
    return pendingLoans.filter(loan => loan.user && loan.user.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [pendingLoans, searchQuery]);

  const filteredActiveLoans = useMemo(() => {
    const today = startOfDay(new Date());
    return activeLoans.filter(loan => {
        if (!loan.user) return false;
        const matchesSearch = loan.user.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
        
        if (showOnlyOverdue) {
            return loan.returnDate && isBefore(loan.returnDate, today);
        }
        return true;
    })
  }, [activeLoans, searchQuery, showOnlyOverdue]);

  const filteredHistoricalLoans = useMemo(() => {
    return historicalLoans.filter(loan => {
        if (!loan.user) return false;
        const matchesSearch = loan.user.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
        
        if (dateRange?.from && loan.returnDate) {
            if (!isWithinInterval(loan.returnDate, { start: dateRange.from, end: dateRange.to || new Date() })) {
                return false;
            }
        }
        
        if (filterWithDamages) {
            const hasDamages = loan.damageReports && Object.values(loan.damageReports).some(r => r.commonProblems.length > 0 || r.otherNotes.trim() !== '');
            if (!hasDamages) return false;
        }

        if (filterWithSuggestions) {
            const hasSuggestions = loan.suggestionReports && Object.values(loan.suggestionReports).some(r => r.commonSuggestions.length > 0 || r.otherNotes.trim() !== '');
            if (!hasSuggestions) return false;
        }

        return true;
    });
  }, [historicalLoans, searchQuery, dateRange, filterWithDamages, filterWithSuggestions]);
  
  const activeFilterCount = [
    searchQuery, 
    showOnlyOverdue, 
    dateRange, 
    filterWithDamages, 
    filterWithSuggestions
  ].filter(Boolean).length;

  const handleExportLoans = (format: 'excel' | 'pdf') => {
    // Usar datos ya filtrados según el estado actual de filtros
    const loansToExport = activeTab === 'active'
      ? [...filteredPendingLoans, ...filteredActiveLoans]
      : filteredHistoricalLoans;

    if (format === 'excel') {
      const dataToExport = loansToExport.map(loan => ({
        'Usuario': loan.user.name,
        'Estado': loan.status === 'active' ? 'Activo' : loan.status === 'pending' ? 'Pendiente' : 'Devuelto',
        'Fecha': loan.loanDate.toLocaleDateString('es-ES'),
        'Recursos': loan.resources.map(r => r.name).join(', ')
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Préstamos');
      XLSX.writeFile(workbook, `prestamos_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "Exportación a Excel Exitosa",
        description: `Se han exportado ${loansToExport.length} préstamos.`
      });
    } else {
      const doc = new jsPDF();
      doc.text('Reporte de Préstamos', 20, 20);
      doc.save(`reporte_prestamos_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "Exportación a PDF Exitosa",
        description: `Se ha generado un reporte con ${loansToExport.length} préstamos.`
      });
    }
  };

  if (isLoadingUser || isLoadingData) {
      return (
          <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Skeleton className="h-10 w-64" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-40" />
                </div>
              </div>
              <Skeleton className="h-12 w-full sm:w-96" />
              <div className="space-y-4 mt-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
          </div>
      );
  }

  const activeTabCount = filteredPendingLoans.length + filteredActiveLoans.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold flex-grow hidden sm:block">Gestión de Préstamos</h1>
        <div className="hidden sm:flex items-center gap-2">
           <Button variant="outline" onClick={() => handleExportLoans('excel')}>
             <Download className="mr-2 h-4 w-4" />
             Exportar Datos
           </Button>
           <Button asChild>
                <Link href="/loans/new">
                    <PlusCircle className="mr-2" />
                    Nuevo Préstamo
                </Link>
            </Button>
        </div>
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto grid grid-cols-2">
          <TabsTrigger value="active">
              <ArrowRightLeft className="mr-2" />
              Activos y Pendientes
              <Badge variant={activeTab === 'active' ? 'default' : 'secondary'} className="ml-2">
                  {activeTabCount}
              </Badge>
          </TabsTrigger>
          <TabsTrigger value="historical">
              <History className="mr-2" />
              Historial
              <Badge variant={activeTab === 'historical' ? 'default' : 'secondary'} className="ml-2">
                  {filteredHistoricalLoans.length}
              </Badge>
          </TabsTrigger>
          </TabsList>

        <Card className="mt-4">
          <CardHeader>
             <div className="flex flex-row items-center gap-2">
              <div className="relative w-full flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      placeholder="Buscar por docente..."
                      className="pl-9 w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
              <Sheet>
                  <SheetTrigger asChild>
                      <Button variant="outline" className="shrink-0 relative h-10 w-10 p-0 sm:w-auto sm:px-4 sm:py-2">
                          <Filter className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Filtros</span>
                           {activeFilterCount > 0 && (
                                <Badge variant="secondary" className={cn(
                                    "absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center sm:relative sm:top-auto sm:right-auto sm:ml-2 sm:h-auto sm:w-auto sm:px-1.5 sm:py-0.5",
                                )}>
                                {activeFilterCount}
                                </Badge>
                          )}
                      </Button>
                  </SheetTrigger>
                  <SheetContent className="flex flex-col">
                      <SheetHeader>
                          <SheetTitle>Filtros de Préstamos</SheetTitle>
                          <SheetDescription>
                              Aplica filtros para encontrar préstamos específicos.
                          </SheetDescription>
                      </SheetHeader>
                      <div className="flex-1 py-4">
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search-user"
                                    placeholder="Buscar por docente..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            <Separator />

                            {activeTab === 'active' && (
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <Label htmlFor="overdue-filter">Mostrar solo vencidos</Label>
                                    <Switch 
                                        id="overdue-filter" 
                                        checked={showOnlyOverdue}
                                        onCheckedChange={setShowOnlyOverdue}
                                    />
                                </div>
                            )}
                            
                            {activeTab === 'historical' && (
                                <div className="space-y-4">
                                    <div>
                                        <Label>Filtrar por Fecha de Devolución</Label>
                                        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border p-3">
                                        <Label htmlFor="damages-filter" className="flex items-center gap-2">
                                            <ShieldAlert className="h-4 w-4 text-destructive" /> Con Daños
                                        </Label>
                                        <Switch 
                                            id="damages-filter" 
                                            checked={filterWithDamages}
                                            onCheckedChange={setFilterWithDamages}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border p-3">
                                        <Label htmlFor="suggestions-filter" className="flex items-center gap-2">
                                            <MessageSquarePlus className="h-4 w-4 text-amber-600" /> Con Sugerencias
                                        </Label>
                                        <Switch 
                                            id="suggestions-filter" 
                                            checked={filterWithSuggestions}
                                            onCheckedChange={setFilterWithSuggestions}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                      </div>
                      <SheetFooter>
                          <Button variant="outline" className="w-full" onClick={clearFilters}>
                              <X className="mr-2 h-4 w-4" />
                              Limpiar Filtros
                          </Button>
                      </SheetFooter>
                  </SheetContent>
              </Sheet>
            </div>
          </CardHeader>
        </Card>

        <TabsContent value="active" className="mt-4">
             {activeTabCount === 0 ? (
                <Card>
                    <CardContent className="h-48 flex flex-col items-center justify-center text-center">
                        <p className="text-muted-foreground">No se encontraron préstamos activos o pendientes con los filtros aplicados.</p>
                    </CardContent>
                </Card>
             ) : (
                <div className="space-y-4">
                    {filteredPendingLoans.map(loan => (
                        <PendingLoanCard
                            key={loan.id}
                            loan={loan}
                            onApprove={handleLoanApproval}
                            onReject={handleLoanRejection}
                            isProcessing={processingLoanId === loan.id}
                        />
                    ))}
                    {filteredPendingLoans.length > 0 && filteredActiveLoans.length > 0 && <Separator />}
                    {filteredActiveLoans.map((loan) => (
                        <LoanCard key={loan.id} loan={loan} onViewIncidents={handleViewIncidents} />
                    ))}
                </div>
             )}
        </TabsContent>

        <TabsContent value="historical" className="mt-0">
            {filteredHistoricalLoans.length === 0 ? (
                 <Card className="mt-4">
                    <CardContent className="p-6">
                        <div className="flex h-48 flex-col items-center justify-center text-center">
                            <p className="text-muted-foreground">
                                No se encontraron préstamos en el historial con los filtros aplicados.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4 mt-4">
                    {filteredHistoricalLoans.map((loan) => (
                        <LoanCard key={loan.id} loan={loan} onViewIncidents={handleViewIncidents}/>
                    ))}
                </div>
            )}
        </TabsContent>
      </Tabs>
      
      <IncidentsReportDialog
        isOpen={!!selectedIncident}
        onOpenChange={(isOpen) => !isOpen && setSelectedIncident(null)}
        loan={selectedIncident?.loan}
        resource={selectedIncident?.resource}
      />

    </div>
  );
}
