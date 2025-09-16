
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, History, PlusCircle } from 'lucide-react';
import type { Loan, Resource } from '@/domain/types';
import { LoanCard } from '@/components/loan-card';
import { IncidentsReportDialog } from '@/components/incidents-report-dialog';
import { useData } from '@/context/data-provider-refactored';
import { Button } from '@/components/ui/button';
import { useAuthorization } from '@/hooks/use-authorization';
import { usePageTitle } from '@/hooks/use-page-title';


export default function MyLoansPage() {
  useAuthorization('Docente');
  usePageTitle('Mis Préstamos');
  const { loans, currentUser, refreshLoans } = useData();
  const [activeTab, setActiveTab] = useState('active');
  const [selectedIncident, setSelectedIncident] = useState<{loan: Loan, resource: Pick<Resource, 'id' | 'name' | 'brand'>} | null>(null);

  // Actualizar préstamos al montar el componente y polling inteligente como respaldo
  useEffect(() => {
    if (!currentUser) return;
    
    // Actualizar inmediatamente al montar el componente
    refreshLoans().catch(error => {
      console.error('Error refreshing loans on mount:', error);
    });
    
    // Polling inteligente cada 60 segundos como respaldo a las suscripciones en tiempo real
    const pollInterval = setInterval(() => {
      refreshLoans().catch(error => {
        console.error('Error in polling refresh:', error);
      });
    }, 60000); // 60 segundos
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [currentUser, refreshLoans]);

  const { activeLoans, historicalLoans } = useMemo(() => {
    if (!currentUser) {
      return { activeLoans: [], historicalLoans: [] };
    }
    const allUserLoans = loans.filter(l => l.user.id === currentUser.id);
    const activeAndPending = allUserLoans.filter(l => l.status === 'active' || l.status === 'pending');
    const historical = allUserLoans.filter(l => l.status === 'returned' || l.status === 'rejected');
    return { activeLoans: activeAndPending, historicalLoans: historical };
  }, [loans, currentUser]);


  const handleViewIncidents = (loan: Loan, resource: Pick<Resource, 'id' | 'name' | 'brand'>) => {
    setSelectedIncident({ loan, resource });
  };

  const renderLoanList = (loans: Loan[], emptyMessage: string) => {
    if (loans.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {loans.map(loan => (
          <LoanCard 
            key={loan.id} 
            loan={loan} 
            onViewIncidents={handleViewIncidents}
            isTeacherContext={true}
          />
        ))}
      </div>
    );
  };


  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold flex-grow hidden sm:block">Mis Préstamos y Solicitudes</h1>
        <Button asChild className="hidden sm:flex">
            <Link href="/my-loans/new">
                <PlusCircle className="mr-2" />
                Solicitar Préstamo
            </Link>
        </Button>
      </div>
       <Card>
        <CardContent className="p-6">
            <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">
                        <ArrowRightLeft className="mr-2" />
                        Activos y Pendientes
                         <Badge variant={activeTab === 'active' ? 'default' : 'secondary'} className="ml-2">
                            {activeLoans.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="historical">
                        <History className="mr-2" />
                        Historial
                         <Badge variant={activeTab === 'historical' ? 'default' : 'secondary'} className="ml-2">
                            {historicalLoans.length}
                        </Badge>
                    </TabsTrigger>
                </TabsList>
                 <TabsContent value="active" className="pt-4">
                   {renderLoanList(activeLoans, 'No tienes préstamos activos ni solicitudes pendientes.')}
                </TabsContent>
                 <TabsContent value="historical" className="pt-4">
                   {renderLoanList(historicalLoans, 'No tienes préstamos en tu historial.')}
                </TabsContent>
            </Tabs>
        </CardContent>
       </Card>
    </div>
    <IncidentsReportDialog
        isOpen={!!selectedIncident}
        onOpenChange={(isOpen) => !isOpen && setSelectedIncident(null)}
        loan={selectedIncident?.loan}
        resource={selectedIncident?.resource}
      />
    </>
  );
}
