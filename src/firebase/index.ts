import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';

/**
 * Shared instance cache to ensure singletons across the application.
 * This prevents "Internal Assertion Failed" errors caused by multiple 
 * initializations during Next.js Hot Module Replacement (HMR).
 */
let memoizedSdks: { firebaseApp: FirebaseApp, auth: Auth, firestore: Firestore } | null = null;

/**
 * Robust Firebase initialization for Next.js (Client & Server).
 * Ensures the config object is used and prevents multiple SDK initializations.
 */
export function initializeFirebase() {
  // Return cached instances if already initialized in this JS context
  if (memoizedSdks) return memoizedSdks;

  let firebaseApp: FirebaseApp;

  if (getApps().length > 0) {
    firebaseApp = getApp();
  } else {
    // Explicitly check for config to avoid opaque 'no-options' errors
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "undefined") {
      console.warn('Firebase configuration is missing. Ensure NEXT_PUBLIC_FIREBASE_* env vars are set.');
    }
    
    firebaseApp = initializeApp(firebaseConfig);
  }

  const auth = getAuth(firebaseApp);
  let firestore: Firestore;
  
  try {
    // Attempt to initialize Firestore with custom settings
    // This must only be called once per App instance
    firestore = initializeFirestore(firebaseApp, {
      ignoreUndefinedProperties: true
    });
  } catch (e: any) {
    // Fallback if already initialized (e.g. during HMR or multiple calls)
    firestore = getFirestore(firebaseApp);
  }

  memoizedSdks = {
    firebaseApp,
    auth,
    firestore
  };

  return memoizedSdks;
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
