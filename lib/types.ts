export type AppRole = "admin" | "student" | "department_head" | "teacher";

export type RequestStatus = "pending" | "in_progress" | "completed" | "rejected";

export const RequestType = {
  grade_inquiry: "Demande de note",
  absence_justification: "Justification d'absence",
  certificate_request: "Demande de certificat",
  grade_correction: "Correction de note",
  schedule_change: "Changement d'horaire",
  other: "Autre",
} as const; // 'as const' makes it a readonly tuple/object, allowing type inference of literal values

export type RequestTypeEnum = keyof typeof RequestType; // For type safety when using the keys

export type RequestPriority = "low" | "normal" | "high" | "urgent";

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null; // Added
  avatar_url: string | null; // Added
  is_active: boolean; // Added
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  matricule: string;
  promotion: string;
  filiere: string;
  date_naissance: string | null;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  specialization: string | null;
  office_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  head_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  request_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  request_id: string | null;
  title: string;
  message: string;
  type: string; // e.g., 'status_change', 'assignment', 'new_message'
  is_read: boolean;
  created_at: string;
}

export interface Requete {
  id: string;
  student_id: string;
  type: RequestTypeEnum; // Use the new enum type
  title: string;
  description: string;
  status: RequestStatus;
  priority: RequestPriority; // Added
  assigned_to: string | null;
  attachment_url: string | null;
  admin_comment: string | null;
  resolved_at: string | null; // Added
  resolved_by: string | null; // Added
  created_at: string;
  updated_at: string;
}

export interface RequeteComplete extends Requete {
  matricule: string | null;
  promotion: string | null;
  filiere: string | null;
  student_first_name: string | null;
  student_last_name: string | null;
  student_email: string | null;
  student_phone: string | null;
  assigned_first_name: string | null;
  assigned_last_name: string | null;
  assigned_email: string | null;
  message_count: number;
  attachment_count: number;
  // Note: 'messages' and 'attachments' arrays are not directly included in this view.
  // They need to be fetched separately if detailed lists are required.
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
