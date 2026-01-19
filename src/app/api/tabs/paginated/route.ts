import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '../../../../../lib/db';
import { AdvancedTabsDB } from '../../../../../lib/db-utils';
import { isAuthenticated } from '../../../../../lib/auth';

// GET /api/tabs/paginated?page=1&limit=10 - Get paginated tabs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const query = searchParams.get('q')?.trim() || undefined;
    const difficulty = searchParams.get('difficulty')?.trim() || undefined;
    const harmonicaType = searchParams.get('type')?.trim() || undefined;
    const key = searchParams.get('key')?.trim() || undefined;
    const sort = searchParams.get('sort')?.trim() || undefined;
    
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ 
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100' 
      }, { status: 400 });
    }

    if (difficulty && !['Beginner', 'Intermediate', 'Advanced'].includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty filter' }, { status: 400 });
    }

    if (harmonicaType && !['diatonic', 'tremolo'].includes(harmonicaType)) {
      return NextResponse.json({ error: 'Invalid harmonica type filter' }, { status: 400 });
    }

    if (sort && !['newest', 'views'].includes(sort)) {
      return NextResponse.json({ error: 'Invalid sort value' }, { status: 400 });
    }
    
    await initializeDatabase();
    
    const includeAll = isAuthenticated(request);
    const result = await AdvancedTabsDB.getTabsPaginated(page, limit, includeAll, {
      query,
      difficulty: difficulty as "Beginner" | "Intermediate" | "Advanced" | undefined,
      harmonicaType: harmonicaType as "diatonic" | "tremolo" | undefined,
      key,
      sort: sort as "newest" | "views" | undefined
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting paginated tabs:', error);
    return NextResponse.json({ error: 'Failed to get paginated tabs' }, { status: 500 });
  }
}
