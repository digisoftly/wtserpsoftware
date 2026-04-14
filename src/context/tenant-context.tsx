
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
  userRole: Role | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
}

const TenantContext = React.createContext<TenantContextType>({
  companyId: null,
  branchId: null,
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
            if (data.preferredLanguage) {
              setLanguage(data.preferredLanguage as Language);
            }
          }

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
  }, [user, isUserLoading, db, companyId, branchId]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    // Optionally persist to Firestore user profile
    if (user && db) {
      const userRef = doc(db, "companies", companyId, "users", user.uid);
      setDoc(userRef, { preferredLanguage: lang }, { merge: true });
    }
  };

  return (
    <TenantContext.Provider value={{ 
      companyId, 
      branchId, 
      userRole,
      language,
      setLanguage: handleSetLanguage,
      isLoading: isUserLoading || isInitializing 
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => React.useContext(TenantContext);
