import { NextRequest, NextResponse } from 'next/server';
import { RateLimitDB, TabsDB, buildTabContentHash, initializeDatabase, type SavedTab } from '../../../../lib/db';
import { isAuthenticated } from '../../../../lib/auth';

function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ip = forwardedFor.split(',')[0]?.trim();
    if (ip) {
      return ip;
    }
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) {
    return realIp;
  }

  const requestIp = (request as NextRequest & { ip?: string }).ip;
  return requestIp ?? null;
}

async function verifyTurnstileToken(token: string | undefined, request: NextRequest): Promise<{ ok: boolean; error?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { ok: false, error: 'Captcha verification is not configured.' };
  }

  if (!token) {
    return { ok: false, error: 'Captcha token is required.' };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  const clientIp = getClientIp(request);
  if (clientIp) {
    body.set('remoteip', clientIp);
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    return { ok: false, error: 'Captcha verification failed.' };
  }

  const data = (await response.json()) as { success?: boolean };
  if (!data.success) {
    return { ok: false, error: 'Captcha verification failed.' };
  }

  return { ok: true };
}

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
    const { title, holeHistory, noteHistory, harmonicaType, difficulty, key, genre, captchaToken } = await request.json();
    
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

    const isAdmin = isAuthenticated(request);
    if (!isAdmin) {
      const captchaCheck = await verifyTurnstileToken(captchaToken, request);
      if (!captchaCheck.ok) {
        return NextResponse.json({ error: captchaCheck.error ?? 'Captcha verification failed.' }, { status: 400 });
      }
    }
    
    // Ensure database is initialized
    await initializeDatabase();

    const contentHash = buildTabContentHash({
      title: title.trim(),
      holeHistory: holeHistory || '',
      noteHistory: noteHistory || '',
      harmonicaType,
      difficulty,
      key: key.trim(),
      genre: genre.trim()
    });

    const existingTab = await TabsDB.getTabByContentHash(contentHash);
    if (existingTab) {
      return NextResponse.json(
        { error: 'Duplicate tab submission detected.' },
        { status: 409 }
      );
    }

    if (!isAdmin) {
      const clientIp = getClientIp(request) ?? 'unknown';
      const rateLimit = await RateLimitDB.checkAndRecordSubmission(clientIp);

      if (!rateLimit.allowed) {
        const retryAfterSeconds = rateLimit.resetAt
          ? Math.max(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000), 1)
          : 3600;
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429, headers: { 'Retry-After': retryAfterSeconds.toString() } }
        );
      }
    }
    
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
