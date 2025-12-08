import type { User, VerifyTokenResponse, LoginResponse } from './backend-types';

export interface VerifyResponse {
  valid: boolean;
  user: {
    id: number;
    matricule: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
  };
}

export async function verifyToken(token: string): Promise<VerifyResponse | null> {
  try {
    console.log('Verifying token with ENSPD API...');
    const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('Token verify response status:', response.status);
    console.log('Token verify response headers:', {
      'content-type': response.headers.get('content-type'),
    });

    const responseText = await response.text();
    console.log('Token verify response body:', responseText);

    if (!response.ok) {
      console.error('Token verification failed with status:', response.status);
      return null;
    }

    const data = JSON.parse(responseText);
    console.log('Token verify parsed data:', data);
    return data;
  } catch (error) {
    console.error('Token verification exception:', error);
    return null;
  }
}

export async function getUser(authToken?: string): Promise<User | null> {
  let token = authToken;
  
  if (!token) {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    token = cookieStore.get('auth_token')?.value;
  }

  console.log('getUser() - token exists:', !!token);
  console.log('getUser() - token length:', token?.length || 0);

  if (!token) {
    console.log('getUser() - no token found in cookies or header');
    return null;
  }

  console.log('getUser() - verifying token with ENSPD...');
  const result = await verifyToken(token);

  if (!result) {
    console.error('getUser() - token verification returned null');
    return null;
  }

  console.log('getUser() - verify result valid:', result.valid);

  if (!result.valid) {
    console.log('getUser() - token marked as invalid');
    return null;
  }

  console.log('getUser() - user authenticated:', result.user.email);
  
  // Return simplified user for now, in real app would fetch full user data
  return {
    id: result.user.id,
    matricule: result.user.matricule,
    email: result.user.email,
    firstName: result.user.firstName || '',
    lastName: result.user.lastName || '',
    personalEmail: null,
    emailVerifiedAt: null,
    roleId: 0,
    departementId: null,
    promotionId: null,
    phone: null,
    photoUrl: null,
    twoFactorEnabled: false,
    isActive: true,
    lastLogin: null,
    lastIp: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    role: {
      id: 0,
      name: result.user.role as any,
      permissions: result.user.permissions,
      createdAt: new Date().toISOString(),
    },
    departement: null,
  };
}
