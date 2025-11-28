export type AppRole = "admin" | "student" | "department_head" | "teacher";

export type RequestStatus = "submitted" | "validated" | "assigned" | "processing" | "completed" | "rejected";
export type ValidationStatus = "pending" | "validated" | "rejected";
export type FinalStatus = "approved" | "rejected" | null;

export const RequestType = {
  grade_inquiry: "Demande de note",
  absence_justification: "Justification d'absence",
  certificate_request: "Demande de certificat",
  grade_correction: "Correction de note",
  schedule_change: "Changement d'horaire",
  other: "Autre",
} as const;

export type RequestTypeEnum = keyof typeof RequestType;

export type RequestPriority = "low" | "normal" | "high" | "urgent";
export type GradeType = "CC" | "SN" | null;  // CC = Contrôle Continu, SN = Session Normale

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
  // === INFOS ÉTUDIANT (IMMUABLES APRÈS SOUMISSION) ===
  id: string;
  student_id: string;              // FK → profiles.id
  type: RequestTypeEnum;            // grade_inquiry, absence_justification, etc.
  title: string;                    // IMMUTABLE après soumission
  description: string;              // IMMUTABLE après soumission
  attachment_url: string | null;    // Premier fichier - IMMUTABLE
  created_at: string;               // IMMUTABLE
  
  // === METADATA POUR ROUTAGE INTELLIGENT ===
  course_id: string | null;         // Pour trouver l'enseignant (CC)
  course_name: string | null;       // Ex: "Mathématiques"
  subject_code: string | null;      // Ex: "MATH101"
  grade_type: GradeType;            // CC (Contrôle Continu) vs SN (Session Normale)
  
  // === VALIDATION CONFORMITÉ (ADMIN) ===
  validation_status: ValidationStatus;  // pending → validated / rejected
  rejection_reason: string | null;      // Motif du rejet si non-conforme
  
  // === ROUTAGE (IMMUABLE APRÈS VALIDATION) ===
  routed_to_id: string | null;          // Destinataire: teacher/RP/director/member
  routed_to_role: AppRole | null;       // Rôle du destinataire
  destination_member_id: string | null; // Pour "other" type
  
  // === ASSIGNATION & VALIDATION ===
  assigned_to: string | null;           // Admin qui a validé
  assigned_to_date: string | null;
  
  // === TRAITEMENT (DESTINATAIRE) ===
  status: RequestStatus;                // submitted → validated → processing → completed/rejected
  processing_comment: string | null;    // Commentaire du destinataire pendant traitement
  
  // === RÉSOLUTION ===
  final_status: FinalStatus;            // Résultat: approved / rejected / null
  final_comment: string | null;         // Motif final
  resolved_at: string | null;
  resolved_by: string | null;           // Qui a décidé (teacher/RP/director)
  
  // === METADATA ===
  priority: RequestPriority;
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
  old_value: unknown | null;
  new_value: unknown | null;
  created_at: string;
}

export interface RequestValidation {
  id: string;
  request_id: string;                    // FK → requetes.id
  validated_by: string;                  // Admin ID
  validation_date: string;
  conformity_status: "conforming" | "non_conforming";
  rejection_reason: string | null;
  attachments_checked: number;
  created_at: string;
}

export interface RequestRouting {
  id: string;
  request_id: string;                    // FK → requetes.id
  routed_from_id: string;                // Admin qui a routé
  routed_from_date: string;
  routed_to_id: string;                  // Destinataire
  routed_to_role: AppRole;
  request_type: RequestTypeEnum;
  subcategory: string | null;            // CC, SN, etc.
  routing_reason: string | null;
  response_status: "pending" | "processing" | "completed";
  responder_comment: string | null;
  responder_decision: "approved" | "rejected" | null;
  created_at: string;
  updated_at: string;
}
