import { NextRequest, NextResponse } from 'next/server';
import * as meetingService from '@/services/meeting.service';
import { supabaseAdmin } from '@/infrastructure/supabase/client';

export async function GET() {
  try {
    const meetings = await meetingService.getMeetings();
    return NextResponse.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, organizerId, ...data } = body;

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    switch (action) {
      case 'add':
        if (!organizerId) {
          return NextResponse.json({ error: 'Organizer ID is required' }, { status: 400 });
        }
        console.log('Calling addMeeting with organizer ID:', organizerId);
        const newMeeting = await meetingService.addMeeting(data, organizerId);
        return NextResponse.json(newMeeting);
      
      case 'toggleTaskStatus':
        const { meetingId, taskId } = data;
        const updatedMeeting = await meetingService.toggleTaskStatus(meetingId, taskId);
        return NextResponse.json(updatedMeeting);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in meetings POST:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}