import { NextRequest, NextResponse } from 'next/server';
import { TabsDB, initializeDatabase } from '../../../../../lib/db';
import { AdvancedTabsDB } from '../../../../../lib/db-utils';

// GET /api/tabs/search?q=searchTerm - Search tabs by title
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }
    
    await initializeDatabase();
    
    const tabs = await TabsDB.getTabsByTitle(query);
    return NextResponse.json(tabs);
  } catch (error) {
    console.error('Error searching tabs:', error);
    return NextResponse.json({ error: 'Failed to search tabs' }, { status: 500 });
  }
}