import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, hashPassword, unauthorizedResponse } from '../../../../../lib/auth';
import { SettingsDB, initializeDatabase } from '../../../../../lib/db';

// POST /api/admin/password - Set or change the admin password
// Requires current valid credentials (DB hash or env var fallback)
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    if (!await isAuthenticated(request)) {
      return unauthorizedResponse();
    }
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(newPassword);
    await SettingsDB.set('admin_password_hash', hashed);

    return NextResponse.json({ success: true, message: 'Admin password updated.' });
  } catch (error) {
    console.error('Error updating admin password:', error);
    return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 });
  }
}
