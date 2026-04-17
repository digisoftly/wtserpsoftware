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
  language: 'BN', // Defaulting to Bangla as per requirements
  setLanguage: () => {},
  isLoading: true,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [userRole, setUserRole] = React.useState<Role | null>(null);
  const [language, setLanguage] = React.useState<Language>('BN'); // Start with Bangla
  const [branchId, setBranchId] = React.useState<string | null>(null);

  const companyId = user ? "warrior-demo-corp" : null;

  React.useEffect(() => {
    if (isUserLoading) return;

    const initTenant = async () => {
      if (user && db && companyId) {
        try {
          // 1. Fetch System-wide settings first to check for default language
          const settingsRef = doc(db, "companies", companyId, "system", "config");
          const settingsSnap = await getDoc(settingsRef);
          let systemDefaultLang: Language = 'BN';
          
          if (settingsSnap.exists()) {
            const settingsData = settingsSnap.data();
            if (settingsData.systemDefaultLanguage) {
              systemDefaultLang = settingsData.systemDefaultLanguage as Language;
            }
          }

          // 2. Fetch User profile
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
            // New User Setup: Use System Default Language
            const userData = {
              id: user.uid,
              companyId,
              branchId: "dhaka-main",
              firstName: "User",
              lastName: user.uid.slice(-4),
              email: user.email || `${user.uid}@warrior.com`,
              roleId: "super-admin",
              isActive: true,
              preferredLanguage: systemDefaultLang,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            
            setDoc(userRef, userData, { merge: true });
            setLanguage(systemDefaultLang);
          } else {
            const data = userSnap.data();
            roleId = data.roleId || "super-admin";
            activeBranchId = data.branchId || "dhaka-main";
            // Prefer user choice, fallback to system default
            setLanguage((data.preferredLanguage || systemDefaultLang) as Language);
          }

          setBranchId(activeBranchId);

          // 3. Fetch Role
          const roleRef = doc(db, "companies", companyId, "roles", roleId);
          const roleSnap = await getDoc(roleRef);

          if (roleSnap.exists()) {
            setUserRole({ id: roleSnap.id, ...roleSnap.data() } as Role);
          } else if (roleId === "super-admin") {
            const superAdminRole = {
              id: "super-admin",
              name: "Super Administrator",
              isSuperAdmin: true,
              permissions: {} 
            };
            setDoc(roleRef, superAdminRole);
            setUserRole(superAdminRole);
          }
        } catch (error) {
          console.error("Initialization Error:", error);
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
