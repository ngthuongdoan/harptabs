import { NextRequest, NextResponse } from 'next/server';
import { TabsDB, initializeDatabase } from '../../../../../lib/db';
import { isAuthenticated, unauthorizedResponse } from '../../../../../lib/auth';

// GET /api/tabs/pending - List all pending tabs (admin only)
export async function GET(request: NextRequest) {
  // Check authentication
  if (!isAuthenticated(request)) {
    return unauthorizedResponse();
  }

  try {
    await initializeDatabase();
    const tabs = await TabsDB.getPendingTabs();
    return NextResponse.json(tabs);
  } catch (error) {
    console.error('Error fetching pending tabs:', error);
    return NextResponse.json({ error: 'Failed to fetch pending tabs' }, { status: 500 });
  }
}
