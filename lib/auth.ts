import { NextRequest } from 'next/server';

/**
 * Simple API key authentication for write operations
 * Checks for x-api-key header against environment variable
 */
export function isAuthenticated(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const validKey = process.env.ADMIN_API_KEY;
  
  if (!validKey) {
    console.warn('ADMIN_API_KEY not set in environment variables');
    return false;
  }
  
  return apiKey === validKey;
}

/**
 * Returns a 401 Unauthorized response
 */
export function unauthorizedResponse() {
  return new Response(
    JSON.stringify({ error: 'Unauthorized - Valid API key required' }), 
    { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
