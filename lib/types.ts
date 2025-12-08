export type AppRole = "admin" | "student" | "department_head" | "teacher";

export type RequestPlatformPermission =
  | "requetes:create"
  | "requetes:view-own"
  | "requetes:view-routed-to-me"
  | "requetes:view-department"
  | "requetes:validate"
  | "requetes:route"
  | "requetes:resolve"
  | "requetes:view-all"
  | "system:manage"
  | "*";

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

export interface RequestPlatformRole {
  id: string;
  adonis_role: string;
  name: string;
  permissions: RequestPlatformPermission[];
  description: string | null;
  created_at: string;
  updated_at: string;
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
  // === IDENTIFIANTS ===
  id: string;
  created_by: string;                    // FK → users.id (l'étudiant qui a créé)
  assigned_to: string | null;            // FK → users.id (admin assigné)
  routed_to: string | null;              // FK → users.id (destinataire du routage)
  resolved_by: string | null;            // FK → users.id (qui a résolu)
  
  // === CONTENU ===
  title: string;                         // Titre de la requête
  description: string;                   // Description détaillée
  request_type: RequestTypeEnum;         // grade_inquiry, absence_justification, etc.
  priority: RequestPriority;             // low, normal, high, urgent
  
  // === CONTEXTE ACADÉMIQUE ===
  department_code: string;               // Code du département (Adonis)
  promotion_code: string | null;         // Code de la promotion (optionnel)
  subject: string | null;                // Sujet ou cours concerné
  grade_type: GradeType;                 // CC ou SN (si applicable)
  grade_value: number | null;            // Valeur de la note (si applicable)
  
  // === STATUTS ===
  status: RequestStatus;                 // submitted, validated, assigned, processing, completed, rejected
  validation_status: ValidationStatus;   // pending, validated, rejected
  final_status: FinalStatus;             // approved, rejected, ou null
  
  // === NOTES ET RAISONS ===
  internal_notes: string | null;         // Notes internes
  rejection_reason: string | null;       // Raison du rejet de validation
  final_comment: string | null;          // Commentaire final après résolution
  
  // === ROUTAGE (ENRICHISSEMENT) ===
  routed_to_role: AppRole | null;        // Rôle du destinataire (enrichissement)
  
  // === TRAITEMENT (ENRICHISSEMENT) ===
  processing_comment: string | null;     // Commentaire pendant le traitement
  
  // === ATTACHMENTS (LEGACY FIELD) ===
  attachment_url: string | null;         // URL du premier attachment (legacy)
  
  // === TIMESTAMPS ===
  submitted_at: string;
  validated_at: string | null;
  assigned_at: string | null;
  routed_at: string | null;
  resolved_at: string | null;
  completed_at: string | null;
  // === TRAITEMENT (DESTINATAIRE) ===
  // Statuts et commentaires gérés via status et autres champs ci-dessus
  
  // === MÉTADONNÉES ===
  created_at: string;                    // Quand a été créée
  updated_at: string;                    // Dernière mise à jour
}

export interface RequeteComplete extends Requete {
  // Informations de l'étudiant (enrichissement)
  student_first_name: string | null;
  student_last_name: string | null;
  student_email: string | null;
  student_phone: string | null;
  matricule: string | null;
  promotion: string | null;
  filiere: string | null;
  
  // Informations de l'assigné (enrichissement)
  assigned_first_name: string | null;
  assigned_last_name: string | null;
  assigned_email: string | null;
  
  // Compteurs
  message_count: number;
  attachment_count: number;
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
