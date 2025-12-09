import type { User } from '@/lib/backend-types';
import type { RequestPlatformPermission } from '@/lib/types';

/**
 * Vérifier si un utilisateur a une permission spécifique
 * @param user - Utilisateur avec ses permissions
 * @param requiredPermission - Permission à vérifier
 * @returns true si l'utilisateur a la permission
 */
export function hasPermission(
  user: User | null,
  requiredPermission: RequestPlatformPermission
): boolean {
  if (!user) return false;

  // À implémenter: récupérer permissions depuis Supabase
  // Pour maintenant, basé sur le rôle Adonis
  const adonisRole = user.role?.name || 'etudiant';

  // Mapping temporaire Adonis role → permissions
  const rolePermissions: Record<string, RequestPlatformPermission[]> = {
    etudiant: ['requetes:create', 'requetes:view-own'],
    enseignant: [
      'requetes:view-own',
      'requetes:view-routed-to-me',
      'requetes:resolve',
    ],
    responsable_pedagogique: [
      'requetes:view-own',
      'requetes:view-routed-to-me',
      'requetes:view-department',
      'requetes:validate',
      'requetes:route',
      'requetes:resolve',
    ],
    directeur: [
      'requetes:view-own',
      'requetes:view-routed-to-me',
      'requetes:view-department',
      'requetes:validate',
      'requetes:route',
      'requetes:resolve',
      'requetes:view-all',
    ],
    admin: ['*'],
  };

  const userPermissions = rolePermissions[adonisRole] || [];

  // Check wildcard (admin)
  if (userPermissions.includes('*')) {
    return true;
  }

  // Check specific permission
  return userPermissions.includes(requiredPermission);
}

/**
 * Vérifier si utilisateur a AU MOINS UNE des permissions données
 * @param user - Utilisateur
 * @param permissions - Liste des permissions (OR logic)
 * @returns true si l'utilisateur a au moins une permission
 */
export function hasAnyPermission(
  user: User | null,
  permissions: RequestPlatformPermission[]
): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Vérifier si utilisateur a TOUTES les permissions données
 * @param user - Utilisateur
 * @param permissions - Liste des permissions (AND logic)
 * @returns true si l'utilisateur a toutes les permissions
 */
export function hasAllPermissions(
  user: User | null,
  permissions: RequestPlatformPermission[]
): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Obtenir la liste des permissions pour un utilisateur
 * @param user - Utilisateur
 * @returns Liste des permissions
 */
export function getUserPermissions(user: User | null): RequestPlatformPermission[] {
  if (!user) return [];

  const adonisRole = user.role?.name || 'etudiant';

  const rolePermissions: Record<string, RequestPlatformPermission[]> = {
    etudiant: ['requetes:create', 'requetes:view-own'],
    enseignant: [
      'requetes:view-own',
      'requetes:view-routed-to-me',
      'requetes:resolve',
    ],
    responsable_pedagogique: [
      'requetes:view-own',
      'requetes:view-routed-to-me',
      'requetes:view-department',
      'requetes:validate',
      'requetes:route',
      'requetes:resolve',
    ],
    directeur: [
      'requetes:view-own',
      'requetes:view-routed-to-me',
      'requetes:view-department',
      'requetes:validate',
      'requetes:route',
      'requetes:resolve',
      'requetes:view-all',
    ],
    admin: ['*'],
  };

  return rolePermissions[adonisRole] || [];
}

/**
 * Types de permissions helpers
 */
export const PERMISSION_GROUPS = {
  CREATION: ['requetes:create'] as const,
  VIEWING: [
    'requetes:view-own',
    'requetes:view-routed-to-me',
    'requetes:view-department',
    'requetes:view-all',
  ] as const,
  MANAGEMENT: [
    'requetes:validate',
    'requetes:route',
    'requetes:resolve',
  ] as const,
  ADMIN: ['system:manage'] as const,
} as const;
