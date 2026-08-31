
'use client';

import * as React from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
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
  const [language, setLanguageState] = React.useState<Language>('BN');
  const [branchId, setBranchId] = React.useState<string | null>(null);
  const [allowedBranches, setAllowedBranches] = React.useState<string[]>(['dhaka-main']);
  const [settings, setSettings] = React.useState<any>(null);
  
  const companyId = PRODUCTION_COMPANY_ID;

  const langRef = React.useRef<Language>(language);
  React.useEffect(() => {
    langRef.current = language;
  }, [language]);

  const setLanguage = React.useCallback(async (lang: Language) => {
    setLanguageState(lang);
    if (user && db) {
      try {
        const userRef = doc(db, "companies", companyId, "users", user.uid);
        updateDoc(userRef, { preferredLanguage: lang }).catch(err => {
          console.error("Language sync failed:", err);
        });
      } catch (e) {
        console.error("Language sync prep failed:", e);
      }
    }
  }, [user, db, companyId]);

  React.useEffect(() => {
    let unsubUser: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;

    if (!isUserLoading && !user) {
      setUserRole(null);
      setSettings(null);
      setBranchId(null);
      setIsInitializing(false);
      return;
    }

    if (!isUserLoading && user && db) {
      setIsInitializing(true);

      const configRef = doc(db, "companies", companyId, "system", "config");
      unsubSettings = onSnapshot(configRef, (snap) => {
        if (snap.exists()) setSettings(snap.data());
      }, (err) => {
        console.error("Settings listener failed:", err);
      });

      const userRef = doc(db, "companies", companyId, "users", user.uid);
      unsubUser = onSnapshot(userRef, async (snap) => {
        if (snap.exists()) {
          const userData = snap.data();
          
          if (userData.status === 'suspended') {
            toast({ variant: "destructive", title: "Access Restricted", description: "Account suspended." });
            signOut(auth);
            return;
          }

          if (userData.preferredLanguage && userData.preferredLanguage !== langRef.current) {
            setLanguageState(userData.preferredLanguage as Language);
          }
          
          const currentBranch = userData.branchId || 'dhaka-main';
          setBranchId(currentBranch);
          setAllowedBranches(userData.allowedBranches || ['dhaka-main']);

          const roleId = userData.roleId || "default-user";
          try {
            const roleSnap = await getDoc(doc(db, "companies", companyId, "roles", roleId));
            if (roleSnap.exists()) {
              const roleData = roleSnap.data();
              setUserRole({ 
                id: roleSnap.id, 
                ...roleData, 
                permissions: { ...(roleData.permissions || {}), ...(userData.permissionOverrides || {}) } 
              } as Role);
            }
          } catch (e) {
            console.error("Role fetch failed:", e);
          }
          setIsInitializing(false);
        } else {
          // If no user document exists yet (e.g., first login of owner)
          if (user.email === 'warriortechsystem@gmail.com') {
             setUserRole({
               id: 'super-admin',
               name: 'Super Admin',
               isSuperAdmin: true,
               permissions: {}
             });
             setBranchId('dhaka-main');
             setAllowedBranches(['dhaka-main']);
          }
          setIsInitializing(false);
        }
      }, (err) => {
        console.error("User profile listener failed:", err);
        setIsInitializing(false);
      });
    }

    return () => {
      if (unsubUser) unsubUser();
      if (unsubSettings) unsubSettings();
    };
  }, [user, isUserLoading, db, auth, companyId]);

  const contextValue = React.useMemo(() => ({ 
    companyId, 
    branchId: branchId || 'dhaka-main', 
    setBranchId: (id: string) => setBranchId(id),
    userRole,
    language,
    setLanguage,
    isLoading: isUserLoading || isInitializing,
    settings,
    allowedBranches
  }), [branchId, userRole, language, isUserLoading, isInitializing, companyId, settings, allowedBranches, setLanguage]);

  return <TenantContext.Provider value={contextValue}>{children}</TenantContext.Provider>;
}

export const useTenant = () => React.useContext(TenantContext);
