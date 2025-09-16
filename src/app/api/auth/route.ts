import { NextRequest, NextResponse } from 'next/server';
import { signIn, signOut, getCurrentUser, getSession, refreshSession } from '@/services/auth.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'getCurrentUser':
        const currentUser = await getCurrentUser();
        return NextResponse.json(currentUser);
      
      case 'getSession':
        const session = await getSession();
        return NextResponse.json(session);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in auth GET:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'signIn':
        const { email, password } = data;
        const signInResult = await signIn({ email, password });
        return NextResponse.json(signInResult);
      
      case 'signOut':
        const signOutResult = await signOut();
        return NextResponse.json(signOutResult);
      
      case 'refreshSession':
        const refreshResult = await refreshSession();
        return NextResponse.json(refreshResult);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in auth POST:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process request' 
    }, { status: 500 });
  }
}