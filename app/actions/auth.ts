'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('Login response status:', response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Login error response:', errorBody);
      return { success: false, error: 'Invalid credentials' };
    }

    const responseData = await response.json();
    console.log('Login response data received');
    console.log('Full response data:', JSON.stringify(responseData, null, 2));

    const token = responseData.token;
    
    console.log('Token length:', token?.length || 0);
    console.log('Token type:', typeof token);
    
    if (!token) {
      return { success: false, error: 'No token in response' };
    }

    console.log('Token received, saving to cookies...');

    const cookieStore = await cookies();
    
    // Set auth_token cookie with proper security options
    cookieStore.set('auth_token', token, {
      httpOnly: true,  // Secure: not accessible from JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    });

    console.log('Cookie set successfully');
    
    // Verify cookie was set
    const savedToken = cookieStore.get('auth_token');
    console.log('Cookie verified:', !!savedToken?.value);
    
    // Sync user to Supabase in the background
    try {
      console.log('[AUTH] Starting Supabase sync after login...');
      
      // Fetch the complete user data
      console.log('[AUTH] Verifying token with ENSPD API...');
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('[AUTH] Token verified, user data received:', {
          id: userData.user?.id,
          email: userData.user?.email,
        });
        
        // Call Supabase sync endpoint
        // Note: Pass token in Authorization header since we're in a Server Action
        console.log('[AUTH] Calling /api/auth/sync-supabase endpoint...');
        const syncStartTime = Date.now();
        const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/sync-supabase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const syncDuration = Date.now() - syncStartTime;
        
        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          console.log(`✅ [AUTH] User synced to Supabase successfully (${syncDuration}ms):`, {
            success: syncData.success,
            message: syncData.message,
          });
        } else {
          console.error('[AUTH] ❌ Sync endpoint returned error:', {
            status: syncResponse.status,
            statusText: syncResponse.statusText,
          });
        }
      } else {
        console.warn('[AUTH] ⚠️  User verification failed, skipping sync');
      }
    } catch (error) {
      console.error('[AUTH] ❌ Failed to sync user to Supabase:', error);
      // Don't fail login if sync fails
    }
    
    return { success: true, redirectUrl: '/dashboard' };
  } catch (error) {
    console.error('Login failed:', error);
    return { success: false, error: 'Login failed' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (token) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    }
  }

  // Delete the auth_token cookie by setting maxAge to 0
  cookieStore.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // Immediately expire the cookie
  });

  console.log('✅ User logged out, redirecting to login...');
  redirect('/auth/login');
}
