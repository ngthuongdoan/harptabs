import { NextResponse } from 'next/server';
import { initializeDatabase } from '../../../../../lib/db';

// POST /api/db/init - Initialize database tables
export async function POST() {
  try {
    await initializeDatabase();
    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization failed:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database' }, 
      { status: 500 }
    );
  }
}