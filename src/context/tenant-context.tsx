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

/**
 * TenantProvider handles the global ERP context including company identity,
 * active branch, user roles, and system-wide localization.
 */
export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [userRole, setUserRole] = React.useState<Role | null>(null);
  const [language, setLanguage] = React.useState<Language>('BN');
  const [branchId, setBranchId] = React.useState<string | null>('dhaka-main');

  const companyId = "warrior-demo-corp";

  React.useEffect(() => {
    // Safety failsafe to ensure UI loads even if initialization hangs
    const failsafe = setTimeout(() => {
      if (isInitializing) {
        console.warn("Tenant initialization timeout. Proceeding with safe defaults.");
        setIsInitializing(false);
      }
    }, 3000);

    const initTenant = async () => {
      // If user is not logged in, initialization is done immediately (for login page)
      if (!isUserLoading && !user) {
        setIsInitializing(false);
        return;
      }

      if (!isUserLoading && user && db) {
        try {
          // 1. Fetch System Settings (fallback if permission fails)
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
            // Register new user profile automatically
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
              console.error("User profile sync failed:", err);
            });
            setLanguage(systemDefaultLang);
          } else if (userSnap) {
            const data = userSnap.data();
            roleId = data?.roleId || "super-admin";
            activeBranchId = data?.branchId || "dhaka-main";
            setLanguage((data?.preferredLanguage || systemDefaultLang) as Language);
          }

          setBranchId(activeBranchId);

          // 3. Fetch Role Permissions
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
          console.error("Tenant configuration error:", error);
        } finally {
          setIsInitializing(false);
          clearTimeout(failsafe);
        }
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
  }, [user, db, companyId]);

  const handleSetBranch = React.useCallback((id: string) => {
    setBranchId(id);
    if (user && db) {
      const userRef = doc(db, "companies", companyId, "users", user.uid);
      setDoc(userRef, { branchId: id }, { merge: true }).catch(console.error);
    }
  }, [user, db, companyId]);

  const contextValue = React.useMemo(() => ({ 
    companyId, 
    branchId: branchId || 'dhaka-main', 
    setBranchId: handleSetBranch,
    userRole,
    language,
    setLanguage: handleSetLanguage,
    isLoading: isUserLoading || isInitializing 
  }), [branchId, handleSetBranch, userRole, language, handleSetLanguage, isUserLoading, isInitializing, companyId]);

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => React.useContext(TenantContext);
