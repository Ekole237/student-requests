'use client';

import { ReactNode } from 'react';
import { useUserStore } from '@/stores/user';
import type { RequestPlatformPermission } from '@/lib/types';

interface PermissionGateProps {
  permission?: RequestPlatformPermission;
  permissions?: RequestPlatformPermission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Composant pour afficher/cacher du contenu basé sur permissions
 * 
 * Usage:
 * <PermissionGate permission="requetes:validate">
 *   <Button>Valider requête</Button>
 * </PermissionGate>
 * 
 * Avec multiple permissions (OR):
 * <PermissionGate permissions={["requetes:validate", "requetes:route"]}>
 *   <AdminPanel />
 * </PermissionGate>
 * 
 * Avec multiple permissions (AND):
 * <PermissionGate permissions={["requetes:validate", "requetes:view-department"]} requireAll>
 *   <AdminPanel />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  permissions = [],
  requireAll = false,
  fallback,
  children,
}: PermissionGateProps) {
  const { hasPermission: checkPermission } = useUserStore();

  // Déterminer si l'utilisateur a accès
  let hasAccess = false;

  if (permission) {
    hasAccess = checkPermission(permission);
  } else if (permissions.length > 0) {
    if (requireAll) {
      // Vérifier que l'utilisateur a TOUTES les permissions
      hasAccess = permissions.every(p => checkPermission(p));
    } else {
      // Vérifier que l'utilisateur a AU MOINS UNE permission
      hasAccess = permissions.some(p => checkPermission(p));
    }
  }

  if (!hasAccess) {
    return fallback || null;
  }

  return <>{children}</>;
}

interface IfCanProps {
  create?: boolean;
  view?: 'own' | 'routed-to-me' | 'department' | 'all';
  validate?: boolean;
  route?: boolean;
  resolve?: boolean;
  manage?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Composant simplifié avec des props lisibles
 * 
 * Usage:
 * <IfCan validate>
 *   <Button>Valider</Button>
 * </IfCan>
 * 
 * <IfCan view="department">
 *   <RequeteList />
 * </IfCan>
 */
export function IfCan({
  create,
  view,
  validate,
  route,
  resolve,
  manage,
  fallback,
  children,
}: IfCanProps) {
  const { hasPermission: checkPermission } = useUserStore();

  const checks = [];

  if (create) checks.push(checkPermission('requetes:create'));
  if (view === 'own') checks.push(checkPermission('requetes:view-own'));
  if (view === 'routed-to-me') checks.push(checkPermission('requetes:view-routed-to-me'));
  if (view === 'department') checks.push(checkPermission('requetes:view-department'));
  if (view === 'all') checks.push(checkPermission('requetes:view-all'));
  if (validate) checks.push(checkPermission('requetes:validate'));
  if (route) checks.push(checkPermission('requetes:route'));
  if (resolve) checks.push(checkPermission('requetes:resolve'));
  if (manage) checks.push(checkPermission('system:manage'));

  const hasAccess = checks.length > 0 && checks.every(c => c);

  if (!hasAccess) {
    return fallback || null;
  }

  return <>{children}</>;
}
