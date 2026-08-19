
'use client';

import * as React from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, getDoc, serverTimestamp, setDoc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Language } from '@/lib/translations';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';

interface Role {
  id: string;
  name: string;
  isSuperAdmin?: boolean;
  permissions: Record<string, string[]>;
  dataScopes?: Record<string, string>;
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

// PRODUCTION CONFIG: Changed from demo-corp to tech-system
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
  const [branchId, setBranchId] = React.useState<string | null>(null);
  const [allowedBranches, setAllowedBranches] = React.useState<string[]>([]);
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
      // Listen to Global Settings
      unsubSettings = onSnapshot(doc(db, "companies", companyId, "system", "config"), (snap) => {
        if (snap.exists()) setSettings(snap.data());
      });

      // Listen to User Identity
      unsubUser = onSnapshot(doc(db, "companies", companyId, "users", user.uid), async (snap) => {
        if (snap.exists()) {
          const userData = snap.data();
          
          // Access Guard for Suspended Accounts
          if (userData.status === 'suspended' || userData.status === 'inactive') {
            toast({ 
              variant: "destructive", 
              title: "Terminal Suspended", 
              description: "Unauthorized access attempt blocked by Security Protocol." 
            });
            signOut(auth);
            return;
          }

          setLanguage(userData.preferredLanguage || 'BN');
          setBranchId(userData.branchId || 'dhaka-main');
          setAllowedBranches(userData.allowedBranches || []);

          // Fetch Role Hierarchy
          const roleRef = doc(db, "companies", companyId, "roles", userData.roleId || "default-user");
          const roleSnap = await getDoc(roleRef);
          
          if (roleSnap.exists()) {
            const roleData = roleSnap.data();
            // Merge Role permissions with direct user overrides
            const finalPermissions = { 
              ...(roleData.permissions || {}), 
              ...(userData.permissionOverrides || {}) 
            };
            setUserRole({ 
              id: roleSnap.id, 
              ...roleData, 
              permissions: finalPermissions 
            } as Role);
          }
        } else {
          // No profile found - possible bootstrap requirement
          console.warn("No terminal profile found for UID:", user.uid);
        }
        setIsInitializing(false);
      });
    }

    return () => {
      unsubUser?.();
      unsubSettings?.();
    };
  }, [user, isUserLoading, db, auth]);

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

  return <TenantContext.Provider value={contextValue}>{children}</TenantContext.Provider>;
}

export const useTenant = () => React.useContext(TenantContext);
