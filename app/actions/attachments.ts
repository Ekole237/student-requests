'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function getSignedFileUrl(filePath: string) {
  try {
    // Remove bucket prefix if present and encode the path properly
    const cleanPath = filePath.startsWith('request-attachments/') 
      ? filePath.replace('request-attachments/', '')
      : filePath;
    
    const encodedPath = cleanPath
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');

    console.log('[SIGNED URL] Original path:', filePath);
    console.log('[SIGNED URL] Clean path:', cleanPath);
    console.log('[SIGNED URL] Encoded path:', encodedPath);

    // Use admin client to bypass RLS
    const supabase = await createAdminClient();

    // Generate a signed URL valid for 1 hour
    const { data, error } = await supabase.storage
      .from('request-attachments')
      .createSignedUrl(encodedPath, 3600); // 1 hour

    if (error) {
      console.error('[SIGNED URL] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, url: data.signedUrl };
  } catch (err) {
    console.error('[SIGNED URL] Exception:', err);
    return { success: false, error: 'Failed to generate signed URL' };
  }
}
