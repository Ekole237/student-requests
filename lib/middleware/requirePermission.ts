import { redirect } from 'next/navigation';
import type { RequestPlatformPermission } from '@/lib/types';
import type { User } from '@/lib/backend-types';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/permissions';

/**
 * Middleware pour vérifier qu'un utilisateur a une permission spécifique
 * Redirige vers /dashboard si pas de permission
 *
 * @param user - Utilisateur à vérifier
 * @param permission - Permission requise
 * @param redirectTo - URL de redirection (défaut: /dashboard)
 */
export function requirePermission(
  user: User | null,
  permission: RequestPlatformPermission,
  redirectTo: string = '/dashboard'
): void {
  if (!user) {
    redirect('/auth/login');
  }

  if (!hasPermission(user, permission)) {
    console.warn(
      `User ${user.email} denied access. Required permission: ${permission}`
    );
    redirect(redirectTo);
  }
}

/**
 * Middleware pour vérifier qu'un utilisateur a AU MOINS UNE permission
 * Redirige vers /dashboard si aucune permission
 *
 * @param user - Utilisateur à vérifier
 * @param permissions - Liste des permissions (OR logic)
 * @param redirectTo - URL de redirection (défaut: /dashboard)
 */
export function requireAnyPermission(
  user: User | null,
  permissions: RequestPlatformPermission[],
  redirectTo: string = '/dashboard'
): void {
  if (!user) {
    redirect('/auth/login');
  }

  if (!hasAnyPermission(user, permissions)) {
    console.warn(
      `User ${user.email} denied access. Required one of: ${permissions.join(', ')}`
    );
    redirect(redirectTo);
  }
}

/**
 * Middleware pour vérifier qu'un utilisateur a TOUTES les permissions
 * Redirige vers /dashboard si manque une permission
 *
 * @param user - Utilisateur à vérifier
 * @param permissions - Liste des permissions (AND logic)
 * @param redirectTo - URL de redirection (défaut: /dashboard)
 */
export function requireAllPermissions(
  user: User | null,
  permissions: RequestPlatformPermission[],
  redirectTo: string = '/dashboard'
): void {
  if (!user) {
    redirect('/auth/login');
  }

  if (!hasAllPermissions(user, permissions)) {
    console.warn(
      `User ${user.email} denied access. Required all of: ${permissions.join(', ')}`
    );
    redirect(redirectTo);
  }
}

/**
 * Middleware pour vérifier que l'utilisateur est admin
 * Redirige vers /dashboard si pas admin
 *
 * @param user - Utilisateur à vérifier
 * @param redirectTo - URL de redirection (défaut: /dashboard)
 */
export function requireAdmin(
  user: User | null,
  redirectTo: string = '/dashboard'
): void {
  if (!user) {
    redirect('/auth/login');
  }

  const isAdmin = user.role?.name === 'admin';
  if (!isAdmin) {
    console.warn(`User ${user.email} denied admin access`);
    redirect(redirectTo);
  }
}

/**
 * Middleware pour vérifier que l'utilisateur appartient à un département
 * Utile pour les RP qui ne peuvent voir que leur département
 */
export function requireDepartment(
  user: User | null,
  departmentCode: string,
  redirectTo: string = '/dashboard'
): void {
  if (!user) {
    redirect('/auth/login');
  }

  if (
    user.departement?.code !== departmentCode &&
    user.role?.name !== 'admin'
  ) {
    console.warn(
      `User ${user.email} denied access to department ${departmentCode}`
    );
    redirect(redirectTo);
  }
}
