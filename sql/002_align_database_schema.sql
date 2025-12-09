-- ============================================================================
-- Migration: Align Database Schema with Application Requirements
-- Created: 2025-12-08
-- Purpose: Update Supabase schema to match TypeScript application types
-- ============================================================================

-- =============================================================================
-- STEP 1: Create ENUM Types
-- =============================================================================

-- Check if enum exists, if not create it
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('student', 'teacher', 'department_head', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM (
        'submitted',
        'validated',
        'assigned',
        'processing',
        'completed',
        'rejected'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE validation_status AS ENUM ('pending', 'validated', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_type AS ENUM (
        'grade_inquiry',
        'absence_justification',
        'certificate_request',
        'grade_correction',
        'schedule_change',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE grade_type_enum AS ENUM ('CC', 'SN');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE final_status_enum AS ENUM ('approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- STEP 2: Update users table
-- =============================================================================

-- Update role column to use app_role enum (if not already)
-- This may require a temporary column approach
ALTER TABLE public.users 
  ALTER COLUMN role TYPE app_role USING (role::app_role);

-- =============================================================================
-- STEP 3: Update requetes table
-- =============================================================================

-- Add missing columns if they don't exist
ALTER TABLE public.requetes
  ADD COLUMN IF NOT EXISTS processing_comment TEXT;

-- Rename student_id to created_by if needed (check first)
-- Note: This is handled carefully to avoid breaking existing data
-- If created_by already exists, this will be skipped
ALTER TABLE public.requetes
  ADD COLUMN IF NOT EXISTS course_id UUID;

-- Update column types to use enums
ALTER TABLE public.requetes
  ALTER COLUMN request_type TYPE request_type USING (request_type::request_type),
  ALTER COLUMN status TYPE request_status USING (status::request_status),
  ALTER COLUMN validation_status TYPE validation_status USING (validation_status::validation_status),
  ALTER COLUMN priority TYPE request_priority USING (priority::request_priority);

-- Handle grade_type enum (may be null)
ALTER TABLE public.requetes
  ALTER COLUMN grade_type TYPE grade_type_enum USING (
    CASE 
      WHEN grade_type IS NULL THEN NULL
      ELSE grade_type::grade_type_enum 
    END
  );

-- Handle final_status enum (may be null)
ALTER TABLE public.requetes
  ALTER COLUMN final_status TYPE final_status_enum USING (
    CASE 
      WHEN final_status IS NULL THEN NULL
      ELSE final_status::final_status_enum 
    END
  );

-- =============================================================================
-- STEP 4: Rename column for consistency if needed
-- =============================================================================

-- Only rename if created_by doesn't exist and student_id does
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='requetes' AND column_name='created_by'
  ) THEN
    -- created_by already exists, do nothing
    RAISE NOTICE 'Column created_by already exists';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='requetes' AND column_name='student_id'
  ) THEN
    -- Rename student_id to created_by
    ALTER TABLE public.requetes RENAME COLUMN student_id TO created_by;
    RAISE NOTICE 'Renamed student_id to created_by';
  END IF;
END $$;

-- =============================================================================
-- STEP 5: Add missing indexes for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_requetes_processing_comment 
  ON public.requetes(processing_comment);

CREATE INDEX IF NOT EXISTS idx_requetes_course_id 
  ON public.requetes(course_id);

CREATE INDEX IF NOT EXISTS idx_requetes_final_status 
  ON public.requetes(final_status);

CREATE INDEX IF NOT EXISTS idx_attachments_request_id 
  ON public.attachments(requete_id);

-- =============================================================================
-- STEP 6: Update request_platform_roles table
-- =============================================================================

-- Ensure request_platform_roles uses correct enum types
ALTER TABLE public.request_platform_roles
  ALTER COLUMN app_role TYPE app_role USING (app_role::app_role);

-- =============================================================================
-- STEP 7: Add missing comment columns in requetes if not present
-- =============================================================================

-- These should already exist but we ensure they're there
ALTER TABLE public.requetes
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS subject VARCHAR(255);

-- =============================================================================
-- STEP 8: Verify constraints
-- =============================================================================

-- Ensure foreign keys exist for important relationships
ALTER TABLE public.attachments
  DROP CONSTRAINT IF EXISTS attachments_requete_id_fkey,
  ADD CONSTRAINT attachments_requete_id_fkey 
    FOREIGN KEY (requete_id) REFERENCES public.requetes(id) ON DELETE CASCADE;

-- =============================================================================
-- STEP 9: Create view for RequeteComplete (if needed by application)
-- =============================================================================

-- This view combines requetes with user information for easier queries
DROP VIEW IF EXISTS public.requetes_with_details CASCADE;

CREATE VIEW public.requetes_with_details AS
SELECT 
  r.id,
  r.created_by,
  r.assigned_to,
  r.routed_to,
  r.resolved_by,
  r.title,
  r.description,
  r.request_type,
  r.priority,
  r.department_code,
  r.promotion_code,
  r.subject,
  r.grade_type,
  r.grade_value,
  r.status,
  r.validation_status,
  r.final_status,
  r.internal_notes,
  r.rejection_reason,
  r.processing_comment,
  r.submitted_at,
  r.validated_at,
  r.assigned_at,
  r.routed_at,
  r.resolved_at,
  r.completed_at,
  r.created_at,
  r.updated_at,
  r.course_id,
  -- Student details
  u_student.email AS student_email,
  u_student.first_name AS student_first_name,
  u_student.last_name AS student_last_name,
  u_student.phone AS student_phone,
  u_student.matricule AS matricule,
  u_student.promotion_code AS promotion,
  -- Assigned to (validator) details
  u_assigned.email AS assigned_email,
  u_assigned.first_name AS assigned_first_name,
  u_assigned.last_name AS assigned_last_name,
  -- Routed to (processor) details
  u_routed.email AS routed_email,
  u_routed.first_name AS routed_first_name,
  u_routed.last_name AS routed_last_name,
  -- Resolved by (decision maker) details
  u_resolved.email AS resolved_email,
  u_resolved.first_name AS resolved_first_name,
  u_resolved.last_name AS resolved_last_name,
  -- Count attachments
  (SELECT COUNT(*) FROM public.attachments WHERE requete_id = r.id) AS attachment_count,
  -- Count notifications
  (SELECT COUNT(*) FROM public.notifications WHERE requete_id = r.id) AS notification_count
FROM public.requetes r
LEFT JOIN public.users u_student ON r.created_by = u_student.id
LEFT JOIN public.users u_assigned ON r.assigned_to = u_assigned.id
LEFT JOIN public.users u_routed ON r.routed_to = u_routed.id
LEFT JOIN public.users u_resolved ON r.resolved_by = u_resolved.id;

-- =============================================================================
-- STEP 10: RLS Policies (if needed)
-- =============================================================================

-- Enable RLS on requetes table
ALTER TABLE public.requetes ENABLE ROW LEVEL SECURITY;

-- Policy: Students can see their own requests
DROP POLICY IF EXISTS requetes_student_select ON public.requetes;
CREATE POLICY requetes_student_select ON public.requetes
  FOR SELECT
  USING (created_by = current_user_id());

-- Policy: Admins can see all requests
DROP POLICY IF EXISTS requetes_admin_select ON public.requetes;
CREATE POLICY requetes_admin_select ON public.requetes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = current_user_id() 
      AND users.role = 'admin'
    )
  );

-- =============================================================================
-- STEP 11: Summary Comments
-- =============================================================================

-- Add table comments for documentation
COMMENT ON TABLE public.requetes IS 'Main table for academic requests (demandes académiques)';
COMMENT ON COLUMN public.requetes.created_by IS 'Student ID who created the request (FK to users.id)';
COMMENT ON COLUMN public.requetes.request_type IS 'Type of request: grade_inquiry, absence_justification, certificate_request, grade_correction, schedule_change, other';
COMMENT ON COLUMN public.requetes.status IS 'Request status: submitted -> validated -> assigned -> processing -> completed/rejected';
COMMENT ON COLUMN public.requetes.validation_status IS 'Admin validation status: pending -> validated/rejected';
COMMENT ON COLUMN public.requetes.final_status IS 'Final decision: approved or rejected';
COMMENT ON COLUMN public.requetes.processing_comment IS 'Comments from processor during treatment';
COMMENT ON COLUMN public.requetes.internal_notes IS 'Internal notes for administrative purposes';

COMMENT ON TABLE public.users IS 'Users table - synchronized from Adonis backend';
COMMENT ON COLUMN public.users.role IS 'User role: student, teacher, department_head, admin';

-- =============================================================================
-- End of migration
-- =============================================================================
-- Run this in Supabase SQL editor
-- Then verify all changes with:
-- SELECT * FROM information_schema.columns WHERE table_name IN ('requetes', 'users') ORDER BY table_name, ordinal_position;
