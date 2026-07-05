'use client';

import { useTenant } from '@/context/tenant-context';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'print' | 'download';

/**
 * usePermissions provides granular access control for every module in the ERP.
 * Strictly checks the role permission matrix defined in Firestore.
 * Production Mode is default. Demo constraints are applied strictly to guests.
 */
export function usePermissions() {
  const { userRole, isLoading, settings } = useTenant();

  /**
   * Checks if the current user has a specific permission for a module.
   */
  const can = (moduleKey: string, action: PermissionAction): boolean => {
    if (isLoading) return false;
    
    // Global Demo Constraints
    const isDemoMode = settings?.demoModeEnabled === true;
    const isGuest = userRole?.id === 'guest-admin';
    
    // Hard restrictions for Demo/Guest accounts
    if (isDemoMode && isGuest) {
      // 1. Block all destructive actions
      if (action === 'delete' || action === 'edit') return false;
      
      // 2. Block access to critical administrative modules entirely
      const restrictedModules = ['settings', 'users', 'branches', 'backup'];
      if (restrictedModules.includes(moduleKey)) return false;
    }

    // Super Admin global bypass
    if (userRole?.isSuperAdmin) return true;

    // Standard role-based permission check
    const permissions = userRole?.permissions?.[moduleKey];
    if (!permissions) return false;

    return permissions.includes(action);
  };

  return { can, isLoading, roleName: userRole?.name || 'Authorized User', isDemoMode: settings?.demoModeEnabled };
}
