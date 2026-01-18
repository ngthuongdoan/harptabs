import { NextRequest, NextResponse } from 'next/server';
import { TabsDB, initializeDatabase } from '../../../../../../lib/db';
import { isAuthenticated, unauthorizedResponse } from '../../../../../../lib/auth';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/tabs/[id]/reject - Reject a pending tab (admin only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Check authentication
  if (!isAuthenticated(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const rejectionReason = typeof body?.reason === 'string' ? body.reason.trim() : '';
    if (!rejectionReason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    await initializeDatabase();

    const rejectedTab = await TabsDB.rejectTab(id, rejectionReason);

    if (!rejectedTab) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...rejectedTab,
      message: 'Tab rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting tab:', error);
    return NextResponse.json({ error: 'Failed to reject tab' }, { status: 500 });
  }
}
