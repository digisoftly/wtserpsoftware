
'use client';

import { useTenant } from '@/context/tenant-context';
import { useUser } from '@/firebase';

export type PermissionAction = 
  | 'view' 
  | 'create' 
  | 'edit' 
  | 'delete' 
  | 'approve' 
  | 'reject' 
  | 'export' 
  | 'print' 
  | 'download' 
  | 'admin';

export type DataScope = 'own' | 'branch' | 'all';

/**
 * usePermissions provides granular, role-based access control (RBAC).
 * Updated with Super Admin hard-coded bypass for the primary owner email.
 */
export function usePermissions() {
  const { userRole, isLoading, branchId } = useTenant();
  const { user } = useUser();

  const isSuperOwner = user?.email === 'warriortechsystem@gmail.com';

  /**
   * Checks if the current user has permission for a specific module action.
   */
  const can = (moduleKey: string, action: PermissionAction = 'view'): boolean => {
    if (isLoading) return false;
    
    // Global bypass for super owner email OR explicit super-admin role
    if (isSuperOwner || userRole?.isSuperAdmin) return true;

    // Check specific module permissions (including manual overrides)
    const modulePerms = userRole?.permissions?.[moduleKey];
    if (!modulePerms || !Array.isArray(modulePerms)) return false;

    return modulePerms.includes(action);
  };

  /**
   * Determines the visibility scope for records in a module.
   */
  const getScope = (moduleKey: string): DataScope => {
    if (isSuperOwner || userRole?.isSuperAdmin) return 'all';
    
    const scope = userRole?.dataScopes?.[moduleKey] as DataScope;
    return scope || 'own'; 
  };

  /**
   * Validates if a specific record is accessible based on branch and ownership.
   */
  const isAccessible = (record: any, moduleKey: string): boolean => {
    if (isSuperOwner || userRole?.isSuperAdmin) return true;

    const scope = getScope(moduleKey);

    if (scope === 'all') return true;
    
    if (scope === 'branch') {
      return record.branchId === branchId;
    }

    if (scope === 'own') {
      return record.createdBy === userRole?.id || record.userId === userRole?.id;
    }

    return false;
  };

  return { 
    can, 
    getScope, 
    isAccessible,
    isLoading, 
    roleName: userRole?.name || 'Authorized Terminal',
    isSuperAdmin: isSuperOwner || !!userRole?.isSuperAdmin
  };
}
