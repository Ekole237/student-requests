'use server';

import { getUser } from '@/lib/auth';

export async function getCurrentUser() {
  return await getUser();
}
