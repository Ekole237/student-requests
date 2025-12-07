interface User {
  id: number;
  matricule: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    name: string;
    permissions: string[];
  };
  departement?: string;
}

interface VerifyResponse {
  valid: boolean;
  user: User;
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

export async function getUser(): Promise<User | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  console.log('getUser() - token exists:', !!token);
  console.log('getUser() - token length:', token?.length || 0);

  if (!token) {
    console.log('getUser() - no token found in cookies');
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
  return result.user;
}
