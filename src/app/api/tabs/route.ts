import { NextRequest, NextResponse } from 'next/server';
import { TabsDB, initializeDatabase, type SavedTab } from '../../../../lib/db';
import { isAuthenticated, unauthorizedResponse } from '../../../../lib/auth';

// GET /api/tabs - List all tabs
export async function GET(request: NextRequest) {
  try {
    // Ensure database is initialized
    await initializeDatabase();
    
    // If admin authenticated, show all tabs (including pending)
    const includeAll = isAuthenticated(request);
    const tabs = await TabsDB.getAllTabs(includeAll);
    return NextResponse.json(tabs);
  } catch (error) {
    console.error('Error listing tabs:', error);
    return NextResponse.json({ error: 'Failed to list tabs' }, { status: 500 });
  }
}

// POST /api/tabs - Create new tab (pending approval)
export async function POST(request: NextRequest) {
  try {
    const { title, holeHistory, noteHistory, harmonicaType, difficulty, key, genre } = await request.json();
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!harmonicaType || (harmonicaType !== 'diatonic' && harmonicaType !== 'tremolo')) {
      return NextResponse.json({ error: 'Harmonica type is required' }, { status: 400 });
    }

    if (!difficulty || !['Beginner', 'Intermediate', 'Advanced'].includes(difficulty)) {
      return NextResponse.json({ error: 'Difficulty is required' }, { status: 400 });
    }

    if (!key || typeof key !== 'string' || !key.trim()) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    if (!genre || typeof genre !== 'string' || !genre.trim()) {
      return NextResponse.json({ error: 'Genre is required' }, { status: 400 });
    }
    
    // Ensure database is initialized
    await initializeDatabase();
    
    const newTab = await TabsDB.createTab(
      title.trim(),
      holeHistory || '',
      noteHistory || '',
      difficulty,
      key.trim(),
      genre.trim(),
      harmonicaType
    );
    
    return NextResponse.json({ 
      ...newTab, 
      message: 'Tab created successfully. It will be visible after admin approval.' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating tab:', error);
    return NextResponse.json({ error: 'Failed to create tab' }, { status: 500 });
  }
}
