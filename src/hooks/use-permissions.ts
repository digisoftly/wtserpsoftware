
'use client';

import { useTenant } from '@/context/tenant-context';

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
 * It validates if a user can perform an action and what data they can see.
 */
export function usePermissions() {
  const { userRole, isLoading, settings, branchId } = useTenant();

  /**
   * Checks if the current user has permission for a specific module action.
   */
  const can = (moduleKey: string, action: PermissionAction = 'view'): boolean => {
    if (isLoading) return false;
    
    // Super Admin global bypass
    if (userRole?.isSuperAdmin) return true;

    // Check specific module permissions
    const modulePerms = userRole?.permissions?.[moduleKey];
    if (!modulePerms || !Array.isArray(modulePerms)) return false;

    return modulePerms.includes(action);
  };

  /**
   * Determines the visibility scope for records in a module.
   */
  const getScope = (moduleKey: string): DataScope => {
    if (userRole?.isSuperAdmin) return 'all';
    
    const scope = userRole?.dataScopes?.[moduleKey] as DataScope;
    return scope || 'own'; // Default to most restrictive
  };

  /**
   * Validates if a specific record is accessible based on branch and ownership.
   */
  const isAccessible = (record: any, moduleKey: string): boolean => {
    if (userRole?.isSuperAdmin) return true;

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
    roleName: userRole?.name || 'Authorized User',
    isSuperAdmin: !!userRole?.isSuperAdmin
  };
}
