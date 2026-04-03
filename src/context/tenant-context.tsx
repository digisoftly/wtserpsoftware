
'use client';

import * as React from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface TenantContextType {
  companyId: string | null;
  branchId: string | null;
  isLoading: boolean;
}

const TenantContext = React.createContext<TenantContextType>({
  companyId: null,
  branchId: null,
  isLoading: true,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isInitializing, setIsInitializing] = React.useState(true);

  // Mock IDs for the prototype environment
  const companyId = "warrior-demo-corp";
  const branchId = "dhaka-main";

  React.useEffect(() => {
    if (isUserLoading) return;

    if (user && db) {
      const userRef = doc(db, "companies", companyId, "users", user.uid);
      
      // Check if user record exists, if not create it to satisfy security rules
      getDoc(userRef).then((snap) => {
        if (!snap.exists()) {
          const userData = {
            id: user.uid,
            companyId,
            branchId,
            firstName: "Guest",
            lastName: "Admin",
            email: user.email || "guest@warrior.com",
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          setDocumentNonBlocking(userRef, userData, { merge: true });
        }
        setIsInitializing(false);
      }).catch(() => {
        // Even if the check fails (e.g. initial propagation delay), we unblock the UI
        // since the security rule exception for demo-corp handles the access.
        setIsInitializing(false);
      });
    } else if (!user) {
      setIsInitializing(false);
    }
  }, [user, isUserLoading, db, companyId, branchId]);

  return (
    <TenantContext.Provider value={{ 
      companyId, 
      branchId, 
      isLoading: isUserLoading || isInitializing 
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => React.useContext(TenantContext);
