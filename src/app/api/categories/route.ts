import { NextRequest, NextResponse } from 'next/server';
import * as resourceService from '@/services/resource.service';

export async function GET(request: NextRequest) {
  try {
    const categories = await resourceService.getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error in categories GET:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryNames } = body;
    
    if (!categoryNames || !Array.isArray(categoryNames)) {
      return NextResponse.json({ error: 'Category names array is required' }, { status: 400 });
    }
    
    const newCategories = await resourceService.addCategories(categoryNames);
    return NextResponse.json(newCategories);
  } catch (error) {
    console.error('Error in categories POST:', error);
    return NextResponse.json({ error: 'Failed to create categories' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryName = searchParams.get('categoryName');
    
    if (!categoryName) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }
    
    const success = await resourceService.deleteCategory(categoryName);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error in categories DELETE:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}