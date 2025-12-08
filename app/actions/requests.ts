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
  const createStartTime = Date.now();
  console.log('[REQUEST] Starting request creation...');
  
  try {
    // Get authenticated user from Adonis
    console.log('[REQUEST] Fetching authenticated user...');
    const user = await getUser();
    
    if (!user) {
      console.error('[REQUEST] ❌ User not authenticated');
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    console.log('[REQUEST] ✅ User authenticated:', {
      id: user.id,
      email: user.email,
      role: user.role?.name,
    });

    // Validate input
    if (!payload.type) {
      console.error('[REQUEST] ❌ Request type is required');
      return { success: false, error: 'Request type is required' };
    }
    if (!payload.title?.trim()) {
      console.error('[REQUEST] ❌ Title is required');
      return { success: false, error: 'Title is required' };
    }
    if (!payload.description?.trim()) {
      console.error('[REQUEST] ❌ Description is required');
      return { success: false, error: 'Description is required' };
    }

    console.log('[REQUEST] ✅ Validation passed:', {
      type: payload.type,
      title: payload.title,
      hasDescription: !!payload.description,
    });

    // Get Supabase client for server-side operations
    console.log('[REQUEST] Creating Supabase client...');
    const supabase = await createClient();

    // Build title with subcategory if applicable
    let finalTitle = payload.title;
    if (payload.type === 'grade_inquiry' && payload.gradeType === 'CC' && payload.subcategory) {
      const subcategoryLabels: Record<string, string> = {
        missing: 'Absence de note',
        error: 'Erreur de note',
      };
      finalTitle = `${payload.title} (${subcategoryLabels[payload.subcategory] || payload.subcategory})`;
      console.log('[REQUEST] Title modified with subcategory:', finalTitle);
    }

    const requestData = {
      created_by: user.id.toString(),
      request_type: payload.type,
      title: finalTitle,
      description: payload.description,
      department_code: user.departement?.code || 'N/A',
      status: 'submitted',
      validation_status: 'pending',
      grade_type: payload.gradeType || null,
      priority: 'normal',
    };

    console.log('[REQUEST] Inserting request with data:', {
      created_by: requestData.created_by,
      request_type: requestData.request_type,
      title: requestData.title,
      department_code: requestData.department_code,
      status: requestData.status,
    });

    // Create request in Supabase with Adonis user ID
    const { data: request, error: requestError } = await supabase
      .from('requetes')
      .insert(requestData)
      .select()
      .single();

    if (requestError) {
      console.error('[REQUEST] ❌ Error creating request:', {
        message: requestError.message,
        code: requestError.code,
        details: requestError.details,
      });
      return {
        success: false,
        error: requestError.message || 'Failed to create request',
      };
    }

    console.log('✅ [REQUEST] Request created successfully:', {
      id: request.id,
      request_type: request.request_type,
      createdBy: request.created_by,
    });

    // Create notification for student
    console.log('[REQUEST] Creating notification...');
    try {
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id.toString(),
          requete_id: request.id,
          title: 'Requête soumise',
          message: `Votre requête "${payload.title}" a été soumise avec succès et sera vérifiée par l'administration.`,
          type: 'request_created',
          read: false,
        })
        .select();

      if (notificationError) {
        console.warn('[REQUEST] ⚠️  Failed to create notification:', {
          message: notificationError.message,
          code: notificationError.code,
        });
      } else {
        console.log('✅ [REQUEST] Notification created');
      }
    } catch (notificationError) {
      console.error('[REQUEST] ⚠️  Notification creation error:', notificationError);
      // Don't fail the whole operation if notification fails
    }

    const createDuration = Date.now() - createStartTime;
    console.log(`✅ [REQUEST] Request creation completed in ${createDuration}ms`);

    return {
      success: true,
      data: request,
    };
  } catch (error) {
    const createDuration = Date.now() - createStartTime;
    console.error(`[REQUEST] ❌ Error in createRequest (${createDuration}ms):`, error);
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
      .eq('created_by', user.id.toString())
      .single();

    if (requestError) {
      return {
        success: false,
        error: 'Request not found',
      };
    }

    // Get attachments
    const { data: attachmentsData, error: attachmentError } = await supabase
      .from('attachments')
      .select('*')
      .eq('requete_id', requestId)
      .order('created_at', { ascending: false });

    if (attachmentError) {
      console.error('Error fetching attachments:', attachmentError);
    }

    return {
      success: true,
      data: {
        request,
        attachments: attachmentsData || [],
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
