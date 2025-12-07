import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  // Public routes
  if (request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  // Protected routes
  if (!token) {
    console.log('proxy: No auth_token found, redirecting to login');
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  console.log('proxy: Verifying token for', request.nextUrl.pathname);
  console.log('proxy: Token length:', token.length, 'Token preview:', token.substring(0, 50) + '...');

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log('proxy: Verify response status:', response.status);

    if (!response.ok) {
      console.log('proxy: Token verification failed, redirecting to login');
      const redirectResponse = NextResponse.redirect(new URL('/auth/login', request.url));
      // Don't delete the cookie on failed verification, let the user try again
      // Only delete on explicit logout
      return redirectResponse;
    }

    console.log('proxy: Token verified, allowing request');
    
    // Ensure auth_token cookie is preserved in the response
    const response_next = NextResponse.next();
    response_next.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    
    return response_next;
  } catch (error) {
    console.error('proxy: Verification error:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/requests/:path*',
    '/my-queue/:path*',
  ],
};
