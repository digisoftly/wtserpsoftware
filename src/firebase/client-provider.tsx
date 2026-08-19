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
  // Use useState with a factory function to ensure initializeFirebase is called 
  // exactly once during the initial mount of the provider.
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
