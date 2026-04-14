
'use client';

import { useTenant } from '@/context/tenant-context';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export';

export function usePermissions() {
  const { userRole, isLoading } = useTenant();

  /**
   * Checks if the current user has a specific permission for a module.
   * Defaults to TRUE if the user is a Super Admin or if roles aren't initialized yet (for prototype ease).
   */
  const can = (moduleKey: string, action: PermissionAction): boolean => {
    if (isLoading) return false;
    
    // Super Admin bypass
    if (userRole?.isSuperAdmin) return true;

    // Standard permission check
    const permissions = userRole?.permissions?.[moduleKey];
    if (!permissions) return false;

    return permissions.includes(action);
  };

  return { can, isLoading, roleName: userRole?.name || 'Guest' };
}
