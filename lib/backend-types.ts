/**
 * Types aligned with the Adonis backend
 * These types mirror the backend models to ensure type safety
 */

/**
 * Role type - mirrors backend Role model
 */
export interface Role {
  id: number;
  name: 'etudiant' | 'enseignant' | 'responsable_pedagogique' | 'directeur' | 'admin';
  permissions: string[];
  description?: string | null;
  createdAt: string;
}

/**
 * Promotion type - mirrors backend Promotion model
 */
export interface Promotion {
  id: number;
  code: string;
  niveau: string;
  isTroncCommun: boolean;
}

/**
 * User type - mirrors backend User model
 */
export interface User {
  id: number;
  matricule: string;
  email: string;
  personalEmail: string | null;
  emailVerifiedAt: string | null;
  roleId: number;
  departementId: number | null;
  promotionId: number | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  photoUrl: string | null;
  twoFactorEnabled: boolean;
  isActive: boolean;
  lastLogin: string | null;
  lastIp: string | null;
  createdAt: string;
  updatedAt: string | null;
  // Relations
  role: Role;
  departement?: {
    id: number;
    code: string;
    name: string;
  } | null;
  promotion?: Promotion | null;
}

/**
 * Login response type
 */
export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Token verification response type
 */
export interface VerifyTokenResponse {
  valid: boolean;
  user: {
    id: number;
    matricule: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
    departement?: string;
    promotion?: Promotion | null;
  };
}

/**
 * Authenticated user context (simplified for frontend use)
 */
export interface AuthenticatedUser {
  id: number;
  matricule: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  departement: {
    id: number;
    code: string;
    name: string;
  } | null;
  promotion?: Promotion | null;
}
