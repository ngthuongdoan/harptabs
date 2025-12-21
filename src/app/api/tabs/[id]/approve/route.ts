import { NextRequest, NextResponse } from 'next/server';
import { TabsDB, initializeDatabase } from '../../../../../../lib/db';
import { isAuthenticated, unauthorizedResponse } from '../../../../../../lib/auth';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/tabs/[id]/approve - Approve a pending tab (admin only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Check authentication
  if (!isAuthenticated(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    await initializeDatabase();
    
    const approvedTab = await TabsDB.approveTab(id);
    
    if (!approvedTab) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      ...approvedTab, 
      message: 'Tab approved successfully' 
    });
  } catch (error) {
    console.error('Error approving tab:', error);
    return NextResponse.json({ error: 'Failed to approve tab' }, { status: 500 });
  }
}
