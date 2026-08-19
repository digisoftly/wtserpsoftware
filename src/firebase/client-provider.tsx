'use client';

import React, { useState, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * FirebaseClientProvider ensures Firebase is initialized only once on the client.
 * It wraps the core FirebaseProvider with stable SDK instances.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  /**
   * We use a lazy initialization pattern within useState.
   * This guarantees that initializeFirebase is called exactly once 
   * for the lifetime of this component's mount.
   */
  const [firebaseServices] = useState(() => initializeFirebase());

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
