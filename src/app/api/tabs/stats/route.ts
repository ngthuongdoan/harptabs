import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '../../../../../lib/db';
import { AdvancedTabsDB } from '../../../../../lib/db-utils';
import { isAuthenticated } from '../../../../../lib/auth';

// GET /api/tabs/stats - Get tabs statistics
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const includeAll = isAuthenticated(request);
    const stats = await AdvancedTabsDB.getTabsStats(includeAll);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting tabs stats:', error);
    return NextResponse.json({ error: 'Failed to get tabs statistics' }, { status: 500 });
  }
}
