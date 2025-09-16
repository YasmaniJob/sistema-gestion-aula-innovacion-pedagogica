
'use client';

import type { Loan } from '@/domain/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, XCircle, Loader2 } from 'lucide-react';
import { getInitials } from '@/lib/utils';

type PendingLoanCardProps = {
    loan: Loan;
    onApprove: (loanId: string) => void;
    onReject: (loanId: string) => void;
    isProcessing: boolean;
};

export function PendingLoanCard({ loan, onApprove, onReject, isProcessing }: PendingLoanCardProps) {
    return (
        <Card key={loan.id} className="bg-primary/5 border-primary/20 border-l-4">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback>{getInitials(loan.user?.name || 'Usuario')}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{loan.user?.name || 'Usuario Desconocido'}</p>
                            <p className="text-sm text-muted-foreground">{loan.purposeDetails?.activityName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="destructive" onClick={() => onReject(loan.id)} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                            Rechazar
                        </Button>
                        <Button size="sm" onClick={() => onApprove(loan.id)} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                            Aprobar
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className='space-y-2'>
                <p className="text-sm font-medium">
                    Recursos Solicitados ({loan.resources.length})
                </p>
                <div className="flex flex-wrap gap-2">
                    {loan.resources.map((resource) => (
                        <Badge key={resource.id} variant="secondary" className="font-normal">
                            {resource.name} ({resource.brand})
                        </Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

    