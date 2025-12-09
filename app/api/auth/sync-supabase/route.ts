import { syncUserToSupabase } from '@/lib/supabase-sync';
import { getUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

/**
 * POST /api/auth/sync-supabase
 * Sync the authenticated user to Supabase
 */
export async function POST(request: NextRequest) {
  const routeStartTime = Date.now();
  console.log('[SYNC-ROUTE] POST /api/auth/sync-supabase called');
  
  try {
    // Try to get token from Authorization header first (from Server Action)
    const authHeader = request.headers.get('Authorization');
    let token: string | undefined;
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('[SYNC-ROUTE] Token found in Authorization header');
    }
    
    console.log('[SYNC-ROUTE] Fetching authenticated user...');
    const user = await getUser(token);

    if (!user) {
      console.error('[SYNC-ROUTE] ❌ User not authenticated');
      return Response.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    console.log('[SYNC-ROUTE] ✅ User retrieved:', {
      id: user.id,
      email: user.email,
      role: user.role?.name,
    });

    console.log('[SYNC-ROUTE] Starting Supabase sync...');
    const syncStartTime = Date.now();
    const result = await syncUserToSupabase(user);
    const syncDuration = Date.now() - syncStartTime;

    if (!result) {
      console.error('[SYNC-ROUTE] ❌ Sync returned null result');
      return Response.json(
        { error: 'Failed to sync user to Supabase' },
        { status: 500 }
      );
    }

    const routeDuration = Date.now() - routeStartTime;
    console.log(`✅ [SYNC-ROUTE] User synced to Supabase successfully in ${syncDuration}ms (total route time: ${routeDuration}ms)`, {
      userId: user.id,
      email: user.email,
    });

    return Response.json({
      success: true,
      message: 'User synced to Supabase',
      data: result,
    });
  } catch (error) {
    const routeDuration = Date.now() - routeStartTime;
    console.error(`[SYNC-ROUTE] ❌ Error in sync-supabase route (${routeDuration}ms):`, error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
