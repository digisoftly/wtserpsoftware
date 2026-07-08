
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
  settings: any;
}

const TenantContext = React.createContext<TenantContextType>({
  companyId: 'warrior-demo-corp',
  branchId: 'dhaka-main',
  setBranchId: () => {},
  userRole: null,
  language: 'BN',
  setLanguage: () => {},
  isLoading: true,
  settings: null,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [userRole, setUserRole] = React.useState<Role | null>(null);
  const [language, setLanguage] = React.useState<Language>('BN');
  const [branchId, setBranchId] = React.useState<string | null>('dhaka-main');
  const [settings, setSettings] = React.useState<any>(null);
  
  // Guard to prevent multiple simultaneous seeding attempts
  const seedingInProgress = React.useRef(false);

  const companyId = "warrior-demo-corp";

  React.useEffect(() => {
    const failsafe = setTimeout(() => {
      if (isInitializing) {
        setIsInitializing(false);
      }
    }, 8000);

    const initTenant = async () => {
      if (!isUserLoading && !user) {
        setIsInitializing(false);
        return;
      }

      if (!isUserLoading && user && db) {
        try {
          // 1. Fetch System Settings
          const settingsRef = doc(db, "companies", companyId, "system", "config");
          const settingsSnap = await getDoc(settingsRef).catch(() => null);
          let systemDefaultLang: Language = 'BN';
          let isSeeded = false;
          
          if (settingsSnap?.exists()) {
            const settingsData = settingsSnap.data();
            setSettings(settingsData);
            systemDefaultLang = (settingsData.systemDefaultLanguage as Language) || 'BN';
            isSeeded = !!settingsData.isMasterDataSeeded;
          }

          // 2. Fetch User Profile
          const userRef = doc(db, "companies", companyId, "users", user.uid);
          const userSnap = await getDoc(userRef).catch(() => null);
          
          let roleId = "guest-admin";
          let activeBranchId = "dhaka-main";

          if (userSnap?.exists()) {
            const data = userSnap.data();
            roleId = data?.roleId || "guest-admin";
            activeBranchId = data?.branchId || "dhaka-main";
            setLanguage((data?.preferredLanguage || systemDefaultLang) as Language);
          } else {
            // New user detection: If no user doc exists, the first user becomes super-admin
            roleId = "super-admin";
            // Provision initial user doc if missing
            await setDoc(userRef, {
              id: user.uid,
              email: user.email,
              roleId: "super-admin",
              branchId: "dhaka-main",
              isActive: true,
              createdAt: serverTimestamp()
            }, { merge: true }).catch(console.error);
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
          } else {
            setUserRole({
              id: "guest-admin",
              name: "Guest Administrator",
              permissions: { dashboard: ['view'], inventory: ['view'] }
            });
          }

          // 4. Seeding Logic with Concurrency Guard
          if (roleId === "super-admin" && !isSeeded && !seedingInProgress.current) {
            seedingInProgress.current = true;
            try {
              const { seedMasterData } = await import('@/lib/seed-data');
              await seedMasterData(db, companyId);
              
              // Refresh settings after seeding
              const freshSettingsSnap = await getDoc(settingsRef);
              if (freshSettingsSnap.exists()) {
                setSettings(freshSettingsSnap.data());
              }
            } catch (seedErr) {
              console.error("Seeding failed:", seedErr);
            } finally {
              seedingInProgress.current = false;
            }
          }

        } catch (error) {
          console.error("Identity Engine Error:", error);
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
      setDoc(userRef, { preferredLanguage: lang }, { merge: true }).catch(() => {});
    }
  }, [user, db, companyId]);

  const handleSetBranch = React.useCallback((id: string) => {
    setBranchId(id);
    if (user && db) {
      const userRef = doc(db, "companies", companyId, "users", user.uid);
      setDoc(userRef, { branchId: id }, { merge: true }).catch(() => {});
    }
  }, [user, db, companyId]);

  const contextValue = React.useMemo(() => ({ 
    companyId, 
    branchId: branchId || 'dhaka-main', 
    setBranchId: handleSetBranch,
    userRole,
    language,
    setLanguage: handleSetLanguage,
    isLoading: isUserLoading || isInitializing,
    settings
  }), [branchId, handleSetBranch, userRole, language, handleSetLanguage, isUserLoading, isInitializing, companyId, settings]);

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => React.useContext(TenantContext);
