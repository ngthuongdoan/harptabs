import { NextRequest, NextResponse } from 'next/server';
import { TabsDB, initializeDatabase, type SavedTab } from '../../../../lib/db';
import { isAuthenticated, unauthorizedResponse } from '../../../../lib/auth';

// GET /api/tabs - List all tabs
export async function GET() {
  try {
    // Ensure database is initialized
    await initializeDatabase();
    
    const tabs = await TabsDB.getAllTabs();
    return NextResponse.json(tabs);
  } catch (error) {
    console.error('Error listing tabs:', error);
    return NextResponse.json({ error: 'Failed to list tabs' }, { status: 500 });
  }
}

// POST /api/tabs - Create new tab
export async function POST(request: NextRequest) {
  // Check authentication
  if (!isAuthenticated(request)) {
    return unauthorizedResponse();
  }
  
  try {
    const { title, holeHistory, noteHistory } = await request.json();
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Ensure database is initialized
    await initializeDatabase();
    
    const newTab = await TabsDB.createTab(
      title.trim(),
      holeHistory || '',
      noteHistory || ''
    );
    
    return NextResponse.json(newTab, { status: 201 });
  } catch (error) {
    console.error('Error creating tab:', error);
    return NextResponse.json({ error: 'Failed to create tab' }, { status: 500 });
  }
}