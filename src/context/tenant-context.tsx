
'use client';

import * as React from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, serverTimestamp, setDoc, onSnapshot } from 'firebase/firestore';
import { Language } from '@/lib/translations';

interface Role {
  id: string;
  name: string;
  isSuperAdmin?: boolean;
  permissions: Record<string, string[]>;
  dataScopes?: Record<string, string>;
  approvalLimits?: Record<string, number>;
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
  allowedBranches: string[];
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
  allowedBranches: [],
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [userRole, setUserRole] = React.useState<Role | null>(null);
  const [language, setLanguage] = React.useState<Language>('BN');
  const [branchId, setBranchId] = React.useState<string | null>(null);
  const [allowedBranches, setAllowedBranches] = React.useState<string[]>([]);
  const [settings, setSettings] = React.useState<any>(null);
  
  const companyId = "warrior-demo-corp";

  React.useEffect(() => {
    let unsubUser: any;
    let unsubRole: any;
    let unsubSettings: any;

    const initTenant = async () => {
      if (!isUserLoading && !user) {
        setIsInitializing(false);
        return;
      }

      if (!isUserLoading && user && db) {
        try {
          // 1. Subscribe to System Settings
          unsubSettings = onSnapshot(doc(db, "companies", companyId, "system", "config"), (snap) => {
            if (snap.exists()) {
              setSettings(snap.data());
            }
          });

          // 2. Subscribe to User Profile
          unsubUser = onSnapshot(doc(db, "companies", companyId, "users", user.uid), async (userSnap) => {
            if (userSnap.exists()) {
              const userData = userSnap.data();
              const roleId = userData.roleId || "guest";
              
              setLanguage(userData.preferredLanguage || 'BN');
              setBranchId(userData.branchId || 'dhaka-main');
              setAllowedBranches(userData.allowedBranches || [userData.branchId || 'dhaka-main']);

              // 3. Fetch Role Data
              const roleRef = doc(db, "companies", companyId, "roles", roleId);
              const roleSnap = await getDoc(roleRef);
              
              if (roleSnap.exists()) {
                setUserRole({ id: roleSnap.id, ...roleSnap.data() } as Role);
              } else if (roleId === 'super-admin') {
                setUserRole({ id: 'super-admin', name: 'Super Admin', isSuperAdmin: true, permissions: {} });
              }
            } else {
              // Provision first user as Super Admin if database is empty or user not found
              const initialUser = {
                id: user.uid,
                email: user.email,
                roleId: 'super-admin',
                branchId: 'dhaka-main',
                allowedBranches: ['dhaka-main'],
                isActive: true,
                createdAt: serverTimestamp()
              };
              await setDoc(doc(db, "companies", companyId, "users", user.uid), initialUser);
            }
            setIsInitializing(false);
          });

        } catch (error) {
          console.error("Identity Engine Error:", error);
          setIsInitializing(false);
        }
      }
    };

    initTenant();
    return () => {
      unsubUser?.();
      unsubRole?.();
      unsubSettings?.();
    };
  }, [user, isUserLoading, db]);

  const contextValue = React.useMemo(() => ({ 
    companyId, 
    branchId: branchId || 'dhaka-main', 
    setBranchId,
    userRole,
    language,
    setLanguage,
    isLoading: isUserLoading || isInitializing,
    settings,
    allowedBranches
  }), [branchId, userRole, language, isUserLoading, isInitializing, companyId, settings, allowedBranches]);

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => React.useContext(TenantContext);
