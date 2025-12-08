import { syncUserToSupabase } from '@/lib/supabase-sync';
import { getUser } from '@/lib/auth';

/**
 * POST /api/auth/sync-supabase
 * Sync the authenticated user to Supabase
 */
export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return Response.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const result = await syncUserToSupabase(user);

    if (!result) {
      return Response.json(
        { error: 'Failed to sync user to Supabase' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'User synced to Supabase',
      data: result,
    });
  } catch (error) {
    console.error('Error in sync-supabase route:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
