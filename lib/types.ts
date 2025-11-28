export type AppRole = "admin" | "student";

export type RequestStatus = "pending" | "in_progress" | "completed" | "rejected";

export type RequestType =
  | "grade_inquiry"
  | "absence_justification"
  | "certificate_request"
  | "grade_correction"
  | "schedule_change"
  | "other";

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Requete {
  id: string;
  student_id: string;
  type: RequestType;
  title: string;
  description: string;
  status: RequestStatus;
  assigned_to: string | null;
  attachment_url: string | null;
  admin_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  request_id: string;
  user_id: string | null;
  action: string;
  old_value: any | null;
  new_value: any | null;
  created_at: string;
}
