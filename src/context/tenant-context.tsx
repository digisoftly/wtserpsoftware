'use client';

import * as React from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, getDoc, serverTimestamp, setDoc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Language } from '@/lib/translations';
import { toast } from '@/hooks/use-toast';

interface Role {
  id: string;
  name: string;
  isSuperAdmin?: boolean;
  permissions: Record<string, string[]>;
  dataScopes?: Record<string, string>;
}

interface TenantContextType {
  companyId: string;
  branchId: string | null;
  setBranchId: (id: string) => void;
  userRole: Role | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
  settings: any;
  allowedBranches: string[];
}

// CONSISTENT PRODUCTION ID
const PRODUCTION_COMPANY_ID = "warrior-tech-system";

const TenantContext = React.createContext<TenantContextType>({
  companyId: PRODUCTION_COMPANY_ID,
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
  const auth = useAuth();
  const db = useFirestore();
  
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [userRole, setUserRole] = React.useState<Role | null>(null);
  const [language, setLanguage] = React.useState<Language>('BN');
  const [branchId, setBranchId] = React.useState<string | null>('dhaka-main');
  const [allowedBranches, setAllowedBranches] = React.useState<string[]>(['dhaka-main']);
  const [settings, setSettings] = React.useState<any>(null);
  
  const companyId = PRODUCTION_COMPANY_ID;

  React.useEffect(() => {
    let unsubUser: any;
    let unsubSettings: any;

    if (!isUserLoading && !user) {
      setIsInitializing(false);
      return;
    }

    if (!isUserLoading && user && db) {
      // 1. Fetch System Assets
      unsubSettings = onSnapshot(doc(db, "companies", companyId, "system", "config"), (snap) => {
        if (snap.exists()) setSettings(snap.data());
      });

      // 2. Fetch User Authority
      const userRef = doc(db, "companies", companyId, "users", user.uid);
      unsubUser = onSnapshot(userRef, async (snap) => {
        if (snap.exists()) {
          const userData = snap.data();
          
          if (userData.status !== 'active') {
            toast({ variant: "destructive", title: "Access Restricted", description: "Account suspended." });
            signOut(auth);
            return;
          }

          setLanguage(userData.preferredLanguage || 'BN');
          setBranchId(userData.branchId || 'dhaka-main');
          setAllowedBranches(userData.allowedBranches || ['dhaka-main']);

          // Fetch Attached Role
          const roleSnap = await getDoc(doc(db, "companies", companyId, "roles", userData.roleId || "default-user"));
          if (roleSnap.exists()) {
            const roleData = roleSnap.data();
            setUserRole({ 
              id: roleSnap.id, 
              ...roleData, 
              permissions: { ...(roleData.permissions || {}), ...(userData.permissionOverrides || {}) } 
            } as Role);
          }
        }
        setIsInitializing(false);
      }, (err) => {
        console.error("Authority fetch failed:", err);
        setIsInitializing(false);
      });
    }

    return () => {
      unsubUser?.();
      unsubSettings?.();
    };
  }, [user, isUserLoading, db, auth, companyId]);

  const contextValue = React.useMemo(() => ({ 
    companyId, 
    branchId, 
    setBranchId: (id: string) => setBranchId(id),
    userRole,
    language,
    setLanguage: (lang: Language) => setLanguage(lang),
    isLoading: isUserLoading || isInitializing,
    settings,
    allowedBranches
  }), [branchId, userRole, language, isUserLoading, isInitializing, companyId, settings, allowedBranches]);

  return <TenantContext.Provider value={contextValue}>{children}</TenantContext.Provider>;
}

export const useTenant = () => React.useContext(TenantContext);
