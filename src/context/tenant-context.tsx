'use client';

import * as React from 'react';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Language } from '@/lib/translations';

interface Role {
  id: string;
  name: string;
  isSuperAdmin?: boolean;
  permissions: Record<string, string[]>;
}

interface TenantContextType {
  companyId: string | null;
  branchId: string | null;
  setBranchId: (id: string) => void;
  userRole: Role | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
}

const TenantContext = React.createContext<TenantContextType>({
  companyId: null,
  branchId: null,
  setBranchId: () => {},
  userRole: null,
  language: 'EN',
  setLanguage: () => {},
  isLoading: true,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [userRole, setUserRole] = React.useState<Role | null>(null);
  const [language, setLanguage] = React.useState<Language>('EN');
  const [branchId, setBranchId] = React.useState<string | null>(null);

  // Use a derived companyId that is only present when a user is authenticated.
  // This prevents hooks from attempting to fetch data before auth is resolved.
  const companyId = user ? "warrior-demo-corp" : null;

  React.useEffect(() => {
    if (isUserLoading) return;

    const initTenant = async () => {
      if (user && db && companyId) {
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
          let activeBranchId = "dhaka-main";

          if (!userSnap.exists()) {
            const userData = {
              id: user.uid,
              companyId,
              branchId: "dhaka-main",
              firstName: "Guest",
              lastName: "Admin",
              email: user.email || "guest@warrior.com",
              roleId: "super-admin",
              isActive: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            
            setDoc(userRef, userData, { merge: true }).catch(async (err) => {
              errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userRef.path,
                operation: 'write',
                requestResourceData: userData
              }));
            });
          } else {
            const data = userSnap.data();
            roleId = data.roleId || "super-admin";
            activeBranchId = data.branchId || "dhaka-main";
            if (data.preferredLanguage) {
              setLanguage(data.preferredLanguage as Language);
            }
          }

          setBranchId(activeBranchId);

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
            const superAdminRole = {
              id: "super-admin",
              name: "Super Administrator",
              isSuperAdmin: true,
              permissions: {} 
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
          // Handled via emitter
        } finally {
          setIsInitializing(false);
        }
      } else if (!user) {
        setIsInitializing(false);
      }
    };

    initTenant();
  }, [user, isUserLoading, db, companyId]);

  const handleSetLanguage = React.useCallback((lang: Language) => {
    setLanguage(lang);
    if (user && db && companyId) {
      const userRef = doc(db, "companies", companyId, "users", user.uid);
      setDoc(userRef, { preferredLanguage: lang }, { merge: true });
    }
  }, [user, db, companyId]);

  const handleSetBranch = React.useCallback((id: string) => {
    setBranchId(id);
    if (user && db && companyId) {
      const userRef = doc(db, "companies", companyId, "users", user.uid);
      setDoc(userRef, { branchId: id }, { merge: true });
    }
  }, [user, db, companyId]);

  const contextValue = React.useMemo(() => ({ 
    companyId, 
    branchId, 
    setBranchId: handleSetBranch,
    userRole,
    language,
    setLanguage: handleSetLanguage,
    isLoading: isUserLoading || isInitializing 
  }), [companyId, branchId, handleSetBranch, userRole, language, handleSetLanguage, isUserLoading, isInitializing]);

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => React.useContext(TenantContext);
