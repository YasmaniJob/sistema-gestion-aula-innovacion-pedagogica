import { NextRequest, NextResponse } from 'next/server';
import * as reservationService from '@/services/reservation.service';

export async function GET() {
  try {
    const reservations = await reservationService.getReservations();
    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'add':
        const newReservation = await reservationService.addReservation(data);
        return NextResponse.json(newReservation);
      
      case 'updateStatus':
        const { reservationId, status } = data;
        const updatedReservation = await reservationService.updateReservationStatus(reservationId, status);
        return NextResponse.json(updatedReservation);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in reservations POST:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('reservationId');
    
    if (!reservationId) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }
    
    const success = await reservationService.deleteReservation(reservationId);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return NextResponse.json({ error: 'Failed to delete reservation' }, { status: 500 });
  }
}