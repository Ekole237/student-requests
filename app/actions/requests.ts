'use server';

import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export interface CreateRequestPayload {
  type: string;
  title: string;
  description: string;
  gradeType?: string | null;
  subcategory?: string | null;
}

/**
 * Create a request for the authenticated user
 * Uses Adonis authentication, not Supabase Auth
 */
export async function createRequest(payload: CreateRequestPayload) {
  try {
    // Get authenticated user from Adonis
    const user = await getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    console.log('Creating request for user:', user.email, 'ID:', user.id);

    // Validate input
    if (!payload.type) {
      return { success: false, error: 'Request type is required' };
    }
    if (!payload.title?.trim()) {
      return { success: false, error: 'Title is required' };
    }
    if (!payload.description?.trim()) {
      return { success: false, error: 'Description is required' };
    }

    // Get Supabase client for server-side operations
    const supabase = await createClient();

    // Build title with subcategory if applicable
    let finalTitle = payload.title;
    if (payload.type === 'grade_inquiry' && payload.gradeType === 'CC' && payload.subcategory) {
      const subcategoryLabels: Record<string, string> = {
        missing: 'Absence de note',
        error: 'Erreur de note',
      };
      finalTitle = `${payload.title} (${subcategoryLabels[payload.subcategory] || payload.subcategory})`;
    }

    // Create request in Supabase with Adonis user ID
    const { data: request, error: requestError } = await supabase
      .from('requetes')
      .insert({
        student_id: user.id.toString(), // Use Adonis user ID as string
        type: payload.type,
        title: finalTitle,
        description: payload.description,
        status: 'submitted',
        validation_status: 'pending',
        grade_type: payload.gradeType || null,
        priority: 'normal',
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating request:', requestError);
      return {
        success: false,
        error: requestError.message || 'Failed to create request',
      };
    }

    console.log('✅ Request created:', request.id);

    // Create notification for student
    try {
      await supabase.from('notifications').insert({
        user_id: user.id.toString(),
        request_id: request.id,
        title: 'Requête soumise',
        message: `Votre requête "${payload.title}" a été soumise avec succès et sera vérifiée par l'administration.`,
        type: 'request_created',
      });
      console.log('✅ Notification created');
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the whole operation if notification fails
    }

    return {
      success: true,
      data: request,
    };
  } catch (error) {
    console.error('Error in createRequest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Upload files for a request
 */
export async function uploadRequestFiles(
  requestId: string,
  files: FormData
) {
  try {
    const user = await getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const supabase = await createClient();
    const uploadedFiles = [];

    // Process each file in FormData
    const fileEntries = files.getAll('files') as File[];
    
    for (const file of fileEntries) {
      try {
        // Generate unique filename
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${file.name}`;
        const filePath = `${user.id}/${requestId}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('request-attachments')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error for file:', file.name, uploadError);
          continue;
        }

        // Record attachment metadata
        const { data: attachment, error: attachmentError } = await supabase
          .from('attachments')
          .insert({
            request_id: requestId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            uploaded_by: user.id.toString(),
          })
          .select()
          .single();

        if (attachmentError) {
          console.error('Error recording attachment:', attachmentError);
          continue;
        }

        uploadedFiles.push(attachment);
        console.log('✅ File uploaded:', file.name);
      } catch (fileError) {
        console.error('Error processing file:', fileError);
        // Continue with next file
      }
    }

    if (uploadedFiles.length === 0) {
      return {
        success: false,
        error: 'No files were uploaded successfully',
      };
    }

    return {
      success: true,
      data: uploadedFiles,
    };
  } catch (error) {
    console.error('Error in uploadRequestFiles:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Get requests for the authenticated user
 */
export async function getUserRequests() {
  try {
    const user = await getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const supabase = await createClient();

    const { data: requests, error } = await supabase
      .from('requetes')
      .select('*')
      .eq('student_id', user.id.toString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: requests,
    };
  } catch (error) {
    console.error('Error in getUserRequests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Get request details with attachments
 */
export async function getRequestDetails(requestId: string) {
  try {
    const user = await getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const supabase = await createClient();

    // Get request
    const { data: request, error: requestError } = await supabase
      .from('requetes')
      .select('*')
      .eq('id', requestId)
      .eq('student_id', user.id.toString())
      .single();

    if (requestError) {
      return {
        success: false,
        error: 'Request not found',
      };
    }

    // Get attachments
    const { data: attachments, error: attachmentError } = await supabase
      .from('attachments')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });

    if (attachmentError) {
      console.error('Error fetching attachments:', attachmentError);
      attachments = [];
    }

    return {
      success: true,
      data: {
        request,
        attachments: attachments || [],
      },
    };
  } catch (error) {
    console.error('Error in getRequestDetails:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}
