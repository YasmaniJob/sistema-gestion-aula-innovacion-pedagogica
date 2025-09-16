import { NextRequest, NextResponse } from 'next/server';
import * as areaService from '@/services/area.service';

export async function GET() {
  try {
    const areas = await areaService.getAreas();
    return NextResponse.json(areas);
  } catch (error) {
    console.error('Error fetching areas:', error);
    return NextResponse.json({ error: 'Failed to fetch areas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'addMultiple':
        const newAreas = await areaService.addAreas(data.names);
        return NextResponse.json(newAreas);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in areas POST:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { areaId, name } = body;
    
    const updatedArea = await areaService.updateArea(areaId, name);
    return NextResponse.json(updatedArea);
  } catch (error) {
    console.error('Error updating area:', error);
    return NextResponse.json({ error: 'Failed to update area' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const areaId = searchParams.get('areaId');
    
    if (!areaId) {
      return NextResponse.json({ error: 'Area ID is required' }, { status: 400 });
    }
    
    const success = await areaService.deleteArea(areaId);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting area:', error);
    return NextResponse.json({ error: 'Failed to delete area' }, { status: 500 });
  }
}