import { NextRequest, NextResponse } from 'next/server';
import * as gradeService from '@/services/grade.service';

export async function GET() {
  try {
    const grades = await gradeService.getGradesAndSections();
    return NextResponse.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'addGrade':
        const newGrade = await gradeService.addGrade(data.name);
        return NextResponse.json(newGrade);
      
      case 'addSection':
        const newSection = await gradeService.addSection(data.gradeId, data.name);
        return NextResponse.json(newSection);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in grades POST:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id, name } = body;
    
    if (type === 'grade') {
      const updatedGrade = await gradeService.updateGrade(id, name);
      return NextResponse.json(updatedGrade);
    } else if (type === 'section') {
      const updatedSection = await gradeService.updateSection(id, name);
      return NextResponse.json(updatedSection);
    }
    
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error updating grade/section:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    
    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID are required' }, { status: 400 });
    }
    
    let success = false;
    if (type === 'grade') {
      success = await gradeService.deleteGrade(id);
    } else if (type === 'section') {
      success = await gradeService.deleteSection(id);
    }
    
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting grade/section:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}