import { NextRequest, NextResponse } from 'next/server';
import { TabsDB, initializeDatabase } from '../../../../../lib/db';
import { AdvancedTabsDB } from '../../../../../lib/db-utils';

// GET /api/tabs/paginated?page=1&limit=10 - Get paginated tabs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ 
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100' 
      }, { status: 400 });
    }
    
    await initializeDatabase();
    
    const result = await AdvancedTabsDB.getTabsPaginated(page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting paginated tabs:', error);
    return NextResponse.json({ error: 'Failed to get paginated tabs' }, { status: 500 });
  }
}