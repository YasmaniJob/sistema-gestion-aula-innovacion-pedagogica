import { NextRequest, NextResponse } from 'next/server';
import * as pedagogicalHourService from '@/services/pedagogical-hour.service';

export async function GET() {
  try {
    const pedagogicalHours = await pedagogicalHourService.getPedagogicalHours();
    return NextResponse.json(pedagogicalHours);
  } catch (error) {
    console.error('Error fetching pedagogical hours:', error);
    return NextResponse.json({ error: 'Failed to fetch pedagogical hours' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'add':
        const newPedagogicalHour = await pedagogicalHourService.addPedagogicalHour(data);
        return NextResponse.json(newPedagogicalHour);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in pedagogical hours POST:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { pedagogicalHourId, ...updateData } = body;
    
    const updatedPedagogicalHour = await pedagogicalHourService.updatePedagogicalHour(pedagogicalHourId, updateData);
    return NextResponse.json(updatedPedagogicalHour);
  } catch (error) {
    console.error('Error updating pedagogical hour:', error);
    return NextResponse.json({ error: 'Failed to update pedagogical hour' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pedagogicalHourId = searchParams.get('pedagogicalHourId');
    
    if (!pedagogicalHourId) {
      return NextResponse.json({ error: 'Pedagogical Hour ID is required' }, { status: 400 });
    }
    
    const success = await pedagogicalHourService.deletePedagogicalHour(pedagogicalHourId);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting pedagogical hour:', error);
    return NextResponse.json({ error: 'Failed to delete pedagogical hour' }, { status: 500 });
  }
}