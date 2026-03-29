import { NextRequest } from 'next/server';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { SettingsDB } from './db';

const scryptAsync = promisify(scrypt);

const SETTINGS_KEY = 'admin_password_hash';

function getAuthSecret(request: NextRequest): string | null {
  const adminPasswordHeader = request.headers.get('x-admin-password')?.trim();
  if (adminPasswordHeader) {
    return adminPasswordHeader;
  }

  const apiKeyHeader = request.headers.get('x-api-key')?.trim();
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  const authorizationHeader = request.headers.get('authorization')?.trim();
  if (authorizationHeader?.toLowerCase().startsWith('bearer ')) {
    const bearerToken = authorizationHeader.slice(7).trim();
    return bearerToken || null;
  }

  return null;
}

/**
 * Hash a plaintext password using scrypt.
 * Returns "salt:hash" as a hex string.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify a plaintext password against a stored "salt:hash" string.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  const storedBuffer = Buffer.from(hash, 'hex');
  if (derivedKey.length !== storedBuffer.length) return false;
  return timingSafeEqual(derivedKey, storedBuffer);
}

/**
 * Check whether a DB password hash has been configured.
 */
export async function hasPasswordInDb(): Promise<boolean> {
  try {
    const hash = await SettingsDB.get(SETTINGS_KEY);
    return hash !== null;
  } catch {
    return false;
  }
}

/**
 * Authenticate a request.
 * Priority:
 *  1. DB-stored scrypt hash (SettingsDB)
 *  2. Fallback: plain ADMIN_API_KEY env var (bootstrap / first-run)
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const authSecret = getAuthSecret(request);
  if (!authSecret) return false;

  try {
    const storedHash = await SettingsDB.get(SETTINGS_KEY);
    if (storedHash) {
      return verifyPassword(authSecret, storedHash);
    }
  } catch {
    // DB unavailable — fall through to env var
  }

  // Fallback: plain env var comparison (timing-safe)
  const envKey = process.env.ADMIN_API_KEY;
  if (!envKey) {
    console.warn('ADMIN_API_KEY not set and no DB password configured');
    return false;
  }
  const a = Buffer.from(authSecret);
  const b = Buffer.from(envKey.trim());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Returns a 401 Unauthorized response
 */
export function unauthorizedResponse() {
  return new Response(
    JSON.stringify({ error: 'Unauthorized - Valid admin credentials required' }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
