import { NextRequest, NextResponse } from 'next/server';
import { TabsDB, initializeDatabase } from '../../../../../lib/db';
import { isAuthenticated, unauthorizedResponse } from '../../../../../lib/auth';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/tabs/[id] - Get specific tab
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await initializeDatabase();
    
    const includeAll = isAuthenticated(request);
    const tab = await TabsDB.getTab(id, includeAll);
    if (!tab) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }
    
    return NextResponse.json(tab);
  } catch (error) {
    console.error('Error getting tab:', error);
    return NextResponse.json({ error: 'Failed to get tab' }, { status: 500 });
  }
}

// PUT /api/tabs/[id] - Update tab
export async function PUT(request: NextRequest, { params }: RouteParams) {
  // Check authentication
  if (!isAuthenticated(request)) {
    return unauthorizedResponse();
  }
  
  try {
    const { id } = await params;
    const { title, holeHistory, noteHistory, harmonicaType, difficulty, key, genre } = await request.json();
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    await initializeDatabase();
    
    const updatedTab = await TabsDB.updateTab(
      id,
      title.trim(),
      holeHistory || '',
      noteHistory || '',
      harmonicaType,
      difficulty ?? null,
      typeof key === 'string' ? key.trim() : null,
      typeof genre === 'string' ? genre.trim() : null
    );
    
    if (!updatedTab) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedTab);
  } catch (error) {
    console.error('Error updating tab:', error);
    return NextResponse.json({ error: 'Failed to update tab' }, { status: 500 });
  }
}

// DELETE /api/tabs/[id] - Delete tab
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // Check authentication
  if (!isAuthenticated(request)) {
    return unauthorizedResponse();
  }
  
  try {
    const { id } = await params;
    await initializeDatabase();
    
    const success = await TabsDB.deleteTab(id);
    if (!success) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tab:', error);
    return NextResponse.json({ error: 'Failed to delete tab' }, { status: 500 });
  }
}
