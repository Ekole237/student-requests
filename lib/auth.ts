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
    const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function getUser(): Promise<User | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return null;
  }

  const result = await verifyToken(token);

  if (!result || !result.valid) {
    return null;
  }

  return result.user;
}
