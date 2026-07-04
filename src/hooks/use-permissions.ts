
'use client';

import { useTenant } from '@/context/tenant-context';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'print' | 'download';

/**
 * usePermissions provides granular access control for every module in the ERP.
 * Strictly checks the role permission matrix defined in Firestore.
 */
export function usePermissions() {
  const { userRole, isLoading, settings } = useTenant();

  /**
   * Checks if the current user has a specific permission for a module.
   */
  const can = (moduleKey: string, action: PermissionAction): boolean => {
    if (isLoading) return false;
    
    // Global Demo Restrictions
    const isDemoMode = settings?.demoModeEnabled === true;
    const isGuest = userRole?.id === 'guest-admin';
    
    // Block destructive actions for guests in demo mode
    if (isDemoMode && isGuest && (action === 'delete' || action === 'edit')) {
      return false;
    }

    // Super Admin bypass
    if (userRole?.isSuperAdmin) return true;

    // Standard permission check
    const permissions = userRole?.permissions?.[moduleKey];
    if (!permissions) return false;

    return permissions.includes(action);
  };

  return { can, isLoading, roleName: userRole?.name || 'Guest', isDemoMode: settings?.demoModeEnabled };
}
