import { NextRequest, NextResponse } from 'next/server';
import { TabsDB, initializeDatabase } from '../../../../../lib/db';

// GET /api/tabs/recent?limit=5 - Get recent tabs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (limit < 1 || limit > 50) {
      return NextResponse.json({ 
        error: 'Invalid limit parameter. Must be between 1 and 50' 
      }, { status: 400 });
    }
    
    await initializeDatabase();
    
    const tabs = await TabsDB.getRecentTabs(limit);
    return NextResponse.json(tabs);
  } catch (error) {
    console.error('Error getting recent tabs:', error);
    return NextResponse.json({ error: 'Failed to get recent tabs' }, { status: 500 });
  }
}