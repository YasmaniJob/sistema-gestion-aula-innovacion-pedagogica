import { NextRequest, NextResponse } from 'next/server';
import { getUsers, addUser, updateUser, deleteUser, addMultipleUsers, registerUser } from '@/services/user.service';

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'add':
        const newUser = await addUser(data);
        return NextResponse.json(newUser);
      
      case 'addMultiple':
        const newUsers = await addMultipleUsers(data.users);
        return NextResponse.json(newUsers);
      
      case 'register':
        const registeredUser = await registerUser(data);
        return NextResponse.json(registeredUser);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in users POST:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...data } = body;
    
    const updatedUser = await updateUser(userId, data);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const success = await deleteUser(userId);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}