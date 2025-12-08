import { createClient } from '@supabase/supabase-js';
import type { User } from '@/lib/backend-types';

/**
 * Server-side Supabase client using Service Role Key
 * This has admin privileges and bypasses RLS
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * Sync Adonis user to Supabase
 * Creates or updates user record in Supabase
 */
export async function syncUserToSupabase(user: User) {
  try {
    const supabase = getSupabaseAdmin();
    
    const userData = {
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
    };

    // Upsert user to Supabase
    const { data, error } = await supabase
      .from('users')
      .upsert(userData, {
        onConflict: 'id',
      })
      .select();

    if (error) {
      console.error('Error syncing user to Supabase:', error);
      // Don't throw - allow app to continue even if sync fails
      return null;
    }

    console.log('✅ User synced to Supabase:', user.email);
    return data?.[0] || null;
  } catch (error) {
    console.error('Error in syncUserToSupabase:', error);
    // Don't throw - allow app to continue even if sync fails
    return null;
  }
}

/**
 * Get user from Supabase
 */
export async function getSupabaseUser(userId: number) {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId.toString())
      .single();

    if (error) {
      console.error('Error fetching user from Supabase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getSupabaseUser:', error);
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
  try {
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

    const { data, error } = await supabase
      .from('users')
      .upsert(userData, {
        onConflict: 'id',
      })
      .select();

    if (error) {
      console.error('Error batch syncing users to Supabase:', error);
      return [];
    }

    console.log(`✅ ${data?.length || 0} users synced to Supabase`);
    return data || [];
  } catch (error) {
    console.error('Error in syncUsersToSupabase:', error);
    return [];
  }
}
