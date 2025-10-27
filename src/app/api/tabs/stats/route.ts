import { NextRequest, NextResponse } from 'next/server';
import { TabsDB, initializeDatabase } from '../../../../../lib/db';
import { AdvancedTabsDB } from '../../../../../lib/db-utils';

// GET /api/tabs/stats - Get tabs statistics
export async function GET() {
  try {
    await initializeDatabase();
    
    const stats = await AdvancedTabsDB.getTabsStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting tabs stats:', error);
    return NextResponse.json({ error: 'Failed to get tabs statistics' }, { status: 500 });
  }
}