import { NextRequest, NextResponse } from 'next/server';
import * as settingsService from '@/services/settings.service';

export async function GET() {
  try {
    const settings = await settingsService.getAppSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updatedSettings = await settingsService.updateAppSettings(body);
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}