import { createClient } from '@/lib/supabase/server';

export type AuditAction = 'create' | 'approve' | 'reject' | 'complete';

/**
 * Log a request action for audit trail
 * Minimal logging for MVP - just track create/approve/reject/complete
 */
export async function logRequestAction(
  requestId: string,
  action: AuditAction,
  userId: string,
  details?: string
) {
  try {
    const supabase = await createClient();
    
    console.log(`[AUDIT] Logging ${action} for request ${requestId} by user ${userId}`);
    
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: action,
      table_name: 'requetes',
      record_id: requestId,
      new_values: { 
        action, 
        details: details || null,
        timestamp: new Date().toISOString() 
      },
      created_at: new Date().toISOString()
    });
    
    console.log(`[AUDIT] ✅ Successfully logged ${action}`);
  } catch (error) {
    console.warn('[AUDIT] ⚠️  Failed to log action:', error);
    // Don't fail the main operation - audit is non-critical
  }
}
