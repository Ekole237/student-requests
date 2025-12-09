import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const cookieStore = await cookies();
  
  // Store the auth_token to protect it from Supabase modifications
  const authToken = cookieStore.get('auth_token');

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Protect auth_token from Supabase modifications
              if (name === 'auth_token' && authToken?.value) {
                console.log('Supabase tried to modify auth_token, skipping...');
                return;
              }
              cookieStore.set(name, value, options);
            });
          } catch (e) {
            console.warn("WARN: Supabase setAll cookies failed, likely called from a Server Component. Error:", e);
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    },
  );
}

/**
 * Create an admin Supabase client using Service Role Key
 * Bypasses RLS policies - use only for server-side operations
 * Never expose this key to the client!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase credentials for admin client');
  }

  console.log('[ADMIN_CLIENT] Creating admin client with Service Role Key');

  return createSupabaseAdminClient(supabaseUrl, serviceRoleKey);
}
