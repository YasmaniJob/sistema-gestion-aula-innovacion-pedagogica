import { NextRequest, NextResponse } from 'next/server';
import * as loanService from '@/services/loan.service';
import type { LoanUser } from '@/domain/types';

export async function GET() {
  try {
    const loans = await loanService.getLoans();
    return NextResponse.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'add':
        const { creatorRole, ...loanData } = data;
        const newLoan = await loanService.addLoan(loanData, creatorRole as LoanUser['role']);
        return NextResponse.json(newLoan);
      
      case 'approve':
        const approvedLoan = await loanService.updateLoanStatus(data.loanId, 'active');
        return NextResponse.json(approvedLoan);
      
      case 'reject':
        const rejectedLoan = await loanService.updateLoanStatus(data.loanId, 'rejected');
        return NextResponse.json(rejectedLoan);
      
      case 'processReturn':
        const { loanId, damageReports, suggestionReports } = data;
        const returnResult = await loanService.processReturn(loanId, damageReports, suggestionReports);
        return NextResponse.json(returnResult);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in loans POST:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { loanId, status } = body;
    
    const updatedLoan = await loanService.updateLoanStatus(loanId, status);
    return NextResponse.json(updatedLoan);
  } catch (error) {
    console.error('Error updating loan:', error);
    return NextResponse.json({ error: 'Failed to update loan' }, { status: 500 });
  }
}