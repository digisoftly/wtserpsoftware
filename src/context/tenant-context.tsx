'use client';

import * as React from 'react';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

interface Role {
  id: string;
  name: string;
  isSuperAdmin?: boolean;
  permissions: Record<string, string[]>;
}

interface TenantContextType {
  companyId: string | null;
  branchId: string | null;
  userRole: Role | null;
  isLoading: boolean;
}

const TenantContext = React.createContext<TenantContextType>({
  companyId: null,
  branchId: null,
  userRole: null,
  isLoading: true,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [userRole, setUserRole] = React.useState<Role | null>(null);

  // Mock IDs for the prototype environment
  const companyId = "warrior-demo-corp";
  const branchId = "dhaka-main";

  React.useEffect(() => {
    if (isUserLoading) return;

    const initTenant = async () => {
      if (user && db) {
        try {
          const userRef = doc(db, "companies", companyId, "users", user.uid);
          const userSnap = await getDoc(userRef).catch(async (err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: userRef.path,
              operation: 'get'
            }));
            throw err;
          });
          
          let roleId = "super-admin";

          if (!userSnap.exists()) {
            const userData = {
              id: user.uid,
              companyId,
              branchId,
              firstName: "Guest",
              lastName: "Admin",
              email: user.email || "guest@warrior.com",
              roleId: "super-admin",
              isActive: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            
            // Non-blocking setDoc
            setDoc(userRef, userData, { merge: true }).catch(async (err) => {
              errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userRef.path,
                operation: 'write',
                requestResourceData: userData
              }));
            });
          } else {
            roleId = userSnap.data().roleId || "super-admin";
          }

          // Fetch Role Permissions
          const roleRef = doc(db, "companies", companyId, "roles", roleId);
          const roleSnap = await getDoc(roleRef).catch(async (err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: roleRef.path,
              operation: 'get'
            }));
            throw err;
          });

          if (roleSnap.exists()) {
            setUserRole({ id: roleSnap.id, ...roleSnap.data() } as Role);
          } else if (roleId === "super-admin") {
            // Auto-create Super Admin role if missing
            const superAdminRole = {
              id: "super-admin",
              name: "Super Administrator",
              isSuperAdmin: true,
              permissions: {} // Super admins bypass check
            };
            
            setDoc(roleRef, superAdminRole).catch(async (err) => {
              errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: roleRef.path,
                operation: 'create',
                requestResourceData: superAdminRole
              }));
            });
            
            setUserRole(superAdminRole);
          }
        } catch (error) {
          // Standard error logging is handled by contextual emitter above
        } finally {
          setIsInitializing(false);
        }
      } else if (!user) {
        setIsInitializing(false);
      }
    };

    initTenant();
  }, [user, isUserLoading, db, companyId, branchId]);

  return (
    <TenantContext.Provider value={{ 
      companyId, 
      branchId, 
      userRole,
      isLoading: isUserLoading || isInitializing 
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => React.useContext(TenantContext);