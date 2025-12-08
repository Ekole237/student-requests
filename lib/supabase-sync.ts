import { createClient } from '@supabase/supabase-js';
import type { User } from '@/lib/backend-types';

/**
 * Map Adonis role names to Supabase app_role enum values
 */
function mapRoleToSupabase(adonisRole: string | undefined): string {
  const roleMap: Record<string, string> = {
    'étudiant': 'student',
    'etudiant': 'student',  // Fallback without accent
    'enseignant': 'teacher',
    'teacher': 'teacher',
    'responsable_pedagogique': 'department_head',
    'department_head': 'department_head',
    'admin': 'admin',
  };
  
  const normalizedRole = (adonisRole || '').toLowerCase().trim();
  return roleMap[normalizedRole] || 'student';  // Default to student
}

/**
 * Server-side Supabase client using Service Role Key
 * This has admin privileges and bypasses RLS
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('[SYNC] Initializing Supabase Admin client...');
  console.log('[SYNC] URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('[SYNC] Service Role Key:', serviceRoleKey ? '✅ Set' : '❌ Missing');
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * Sync Adonis user to Supabase
 * Creates or updates user record in Supabase (both users and profiles tables)
 */
export async function syncUserToSupabase(user: User) {
  const syncStartTime = Date.now();
  console.log(`[SYNC] Starting user sync for ${user.email} (ID: ${user.id})`);
  
  try {
    console.log('[SYNC] Initializing Supabase admin client...');
    const supabase = getSupabaseAdmin();
    
    // First, insert/update the users table
    const usersData = {
      id: user.id.toString(),
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      matricule: user.matricule,
      role: mapRoleToSupabase(user.role?.name),
      department_code: user.departement?.code || null,
      is_active: user.isActive,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };

    console.log('[SYNC] Preparing user data:', JSON.stringify({
      id: usersData.id,
      email: usersData.email,
      role: usersData.role,
      department_code: usersData.department_code,
    }));

    // Upsert user to users table
    console.log('[SYNC] Upserting user to users table...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert(usersData, {
        onConflict: 'id',
      })
      .select();

    if (userError) {
      console.error('[SYNC] ❌ Error syncing user to users table:', {
        message: userError.message,
        code: userError.code,
        details: userError.details,
      });
      return null;
    }

    console.log('✅ [SYNC] User synced to users table successfully:', {
      email: user.email,
      id: user.id,
      rowsAffected: userData?.length || 0,
    });

    // Then, insert/update the profiles table if it exists
    try {
      const profilesData = {
        user_id: user.id.toString(),
        phone: user.phone || null,
        avatar_url: user.photoUrl || null,
        updated_at: new Date().toISOString(),
      };

      console.log('[SYNC] Preparing profile data:', {
        user_id: profilesData.user_id,
        phone: profilesData.phone,
      });

      console.log('[SYNC] Upserting profile to profiles table...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert(profilesData, {
          onConflict: 'user_id',
        })
        .select();

      if (!profileError) {
        console.log('✅ [SYNC] Profile synced successfully:', {
          email: user.email,
          rowsAffected: profileData?.length || 0,
        });
      } else {
        console.warn('[SYNC] ⚠️  Warning syncing to profiles table:', {
          message: profileError.message,
          code: profileError.code,
        });
        // Don't fail if profiles sync fails
      }
    } catch (profileSyncError) {
      console.warn('[SYNC] ⚠️  Failed to sync profiles table:', profileSyncError);
      // Don't fail the whole operation
    }

    const syncDuration = Date.now() - syncStartTime;
    console.log(`[SYNC] ✅ Sync completed for ${user.email} in ${syncDuration}ms`);
    return userData?.[0] || null;
  } catch (error) {
    const syncDuration = Date.now() - syncStartTime;
    console.error(`[SYNC] ❌ Error in syncUserToSupabase (${syncDuration}ms):`, error);
    return null;
  }
}

/**
 * Get user from Supabase
 */
export async function getSupabaseUser(userId: number) {
  console.log(`[SYNC] Fetching user from Supabase (ID: ${userId})`);
  
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId.toString())
      .single();

    if (error) {
      console.error(`[SYNC] ❌ Error fetching user ${userId}:`, {
        message: error.message,
        code: error.code,
      });
      return null;
    }

    console.log(`✅ [SYNC] User fetched successfully:`, {
      id: data?.id,
      email: data?.email,
    });
    return data;
  } catch (error) {
    console.error(`[SYNC] ❌ Error in getSupabaseUser (${userId}):`, error);
    return null;
  }
}

/**
 * Delete user from Supabase
 */
export async function deleteSupabaseUser(userId: number) {
  try {
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId.toString());

    if (error) {
      console.error('Error deleting user from Supabase:', error);
      return false;
    }

    console.log('✅ User deleted from Supabase');
    return true;
  } catch (error) {
    console.error('Error in deleteSupabaseUser:', error);
    return false;
  }
}

/**
 * Batch sync multiple users to Supabase
 */
export async function syncUsersToSupabase(users: User[]) {
  const syncStartTime = Date.now();
  console.log(`[SYNC] Starting batch sync for ${users.length} users`);
  
  try {
    console.log('[SYNC] Initializing Supabase admin client...');
    const supabase = getSupabaseAdmin();
    
    const userData = users.map(user => ({
      id: user.id.toString(),
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      matricule: user.matricule,
      role: user.role?.name || 'etudiant',
      department_code: user.departement?.code || null,
      is_active: user.isActive,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    }));

    console.log('[SYNC] Prepared data for users:', {
      count: userData.length,
      emails: userData.map(u => u.email),
    });

    console.log('[SYNC] Batch upserting to users table...');
    const { data, error } = await supabase
      .from('users')
      .upsert(userData, {
        onConflict: 'id',
      })
      .select();

    if (error) {
      console.error('[SYNC] ❌ Error batch syncing users to Supabase:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      return [];
    }

    const syncDuration = Date.now() - syncStartTime;
    console.log(`✅ [SYNC] Batch sync completed: ${data?.length || 0} users synced in ${syncDuration}ms`);
    return data || [];
  } catch (error) {
    const syncDuration = Date.now() - syncStartTime;
    console.error(`[SYNC] ❌ Error in syncUsersToSupabase (${syncDuration}ms):`, error);
    return [];
  }
}
