import { NextRequest, NextResponse } from 'next/server';
import { TabsDB, initializeDatabase } from '../../../../../../lib/db';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/tabs/[id]/view - Increment view count
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await initializeDatabase();
    
    const tab = await TabsDB.incrementViewCount(id);
    if (!tab) {
      return NextResponse.json({ error: 'Tab not found or not approved' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      viewCount: tab.viewCount 
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return NextResponse.json({ error: 'Failed to increment view count' }, { status: 500 });
  }
}
