import { NextRequest, NextResponse } from 'next/server';
import * as resourceService from '@/services/resource.service';
import type { Resource } from '@/domain/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'getCategories') {
      const categories = await resourceService.getCategories();
      return NextResponse.json(categories);
    } else {
      const resources = await resourceService.getResources();
      return NextResponse.json(resources);
    }
  } catch (error) {
    console.error('Error in resources GET:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'add':
        const newResources = await resourceService.addResource(data);
        return NextResponse.json(newResources);
      
      case 'updateStatus':
        const { resourceId, status, notes } = data;
        const updatedResource = await resourceService.updateResourceStatus(resourceId, status, notes);
        return NextResponse.json(updatedResource);
      
      case 'addCategories':
        const { categoryNames } = data;
        const newCategories = await resourceService.addCategories(categoryNames);
        return NextResponse.json(newCategories);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in resources POST:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { resourceId, ...updateData } = body;
    
    const updatedResource = await resourceService.updateResource(resourceId, updateData);
    return NextResponse.json(updatedResource);
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    const action = searchParams.get('action');
    const categoryName = searchParams.get('categoryName');
    
    if (action === 'deleteCategory') {
      if (!categoryName) {
        return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
      }
      
      const success = await resourceService.deleteCategory(categoryName);
      return NextResponse.json({ success });
    } else {
      if (!resourceId) {
        return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
      }
      
      const success = await resourceService.deleteResource(resourceId);
      return NextResponse.json({ success });
    }
  } catch (error) {
    console.error('Error in DELETE operation:', error);
    return NextResponse.json({ error: 'Failed to process delete request' }, { status: 500 });
  }
}