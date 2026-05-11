
'use client';

import * as React from 'react';
import { useUser, useFirestore } from '@/firebase';
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
  companyId: 'warrior-demo-corp',
  branchId: 'dhaka-main',
  setBranchId: () => {},
  userRole: null,
  language: 'BN',
  setLanguage: () => {},
  isLoading: true,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [userRole, setUserRole] = React.useState<Role | null>(null);
  const [language, setLanguage] = React.useState<Language>('BN');
  const [branchId, setBranchId] = React.useState<string | null>('dhaka-main');

  const companyId = "warrior-demo-corp";

  React.useEffect(() => {
    const failsafe = setTimeout(() => {
      if (isInitializing) {
        console.warn("Tenant initialization taking too long. Proceeding with defaults.");
        setIsInitializing(false);
      }
    }, 5000);

    const initTenant = async () => {
      if (!isUserLoading && user && db) {
        try {
          // 1. Fetch System Settings (Always fallback if permission fails)
          const settingsRef = doc(db, "companies", companyId, "system", "config");
          const settingsSnap = await getDoc(settingsRef).catch(() => null);
          let systemDefaultLang: Language = 'BN';
          
          if (settingsSnap?.exists()) {
            const settingsData = settingsSnap.data();
            if (settingsData.systemDefaultLanguage) {
              systemDefaultLang = settingsData.systemDefaultLanguage as Language;
            }
          }

          // 2. Fetch User Profile
          const userRef = doc(db, "companies", companyId, "users", user.uid);
          const userSnap = await getDoc(userRef).catch(() => null);
          
          let roleId = "super-admin";
          let activeBranchId = "dhaka-main";

          if (userSnap && !userSnap.exists()) {
            // New user registration
            const userData = {
              id: user.uid,
              companyId,
              branchId: "dhaka-main",
              firstName: user.email?.split('@')[0] || "User",
              lastName: user.uid.slice(-4),
              email: user.email || `${user.uid}@warrior.com`,
              roleId: "super-admin",
              isActive: true,
              preferredLanguage: systemDefaultLang,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            
            await setDoc(userRef, userData, { merge: true }).catch(err => {
              console.error("Failed to sync user profile:", err);
            });
            setLanguage(systemDefaultLang);
          } else if (userSnap) {
            const data = userSnap.data();
            roleId = data?.roleId || "super-admin";
            activeBranchId = data?.branchId || "dhaka-main";
            setLanguage((data?.preferredLanguage || systemDefaultLang) as Language);
          }

          setBranchId(activeBranchId);

          // 3. Fetch Role
          const roleRef = doc(db, "companies", companyId, "roles", roleId);
          const roleSnap = await getDoc(roleRef).catch(() => null);

          if (roleSnap?.exists()) {
            setUserRole({ id: roleSnap.id, ...roleSnap.data() } as Role);
          } else if (roleId === "super-admin") {
            setUserRole({
              id: "super-admin",
              name: "Super Administrator",
              isSuperAdmin: true,
              permissions: {} 
            });
          }
        } catch (error) {
          console.error("Critical Tenant initialization error:", error);
        } finally {
          setIsInitializing(false);
          clearTimeout(failsafe);
        }
      } else if (!isUserLoading) {
        setIsInitializing(false);
        clearTimeout(failsafe);
      }
    };

    initTenant();
    return () => clearTimeout(failsafe);
  }, [user, isUserLoading, db]);

  const handleSetLanguage = React.useCallback((lang: Language) => {
    setLanguage(lang);
    if (user && db) {
      const userRef = doc(db, "companies", companyId, "users", user.uid);
      setDoc(userRef, { preferredLanguage: lang }, { merge: true }).catch(console.error);
    }
  }, [user, db]);

  const handleSetBranch = React.useCallback((id: string) => {
    setBranchId(id);
    if (user && db) {
      const userRef = doc(db, "companies", companyId, "users", user.uid);
      setDoc(userRef, { branchId: id }, { merge: true }).catch(console.error);
    }
  }, [user, db]);

  const contextValue = React.useMemo(() => ({ 
    companyId, 
    branchId: branchId || 'dhaka-main', 
    setBranchId: handleSetBranch,
    userRole,
    language,
    setLanguage: handleSetLanguage,
    isLoading: isUserLoading || isInitializing 
  }), [branchId, handleSetBranch, userRole, language, handleSetLanguage, isUserLoading, isInitializing]);

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => React.useContext(TenantContext);
