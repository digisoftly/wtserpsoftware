import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';

/**
 * Robust Firebase initialization for Next.js (Client & Server).
 * Ensures the config object is used and prevents multiple SDK initializations
 * which often lead to "Internal Assertion Failed" errors in development.
 */
export function initializeFirebase() {
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
  
  /**
   * IMPORTANT: We must be extremely careful with initializeFirestore.
   * Calling it more than once on the same App instance throws an error.
   * However, in Next.js development (HMR), we might attempt to re-initialize.
   */
  let firestore: Firestore;
  
  try {
    // We attempt to initialize with settings.
    // If it's already initialized, this will throw, and we'll catch it.
    firestore = initializeFirestore(firebaseApp, {
      ignoreUndefinedProperties: true,
      // We explicitly avoid adding persistence settings here to minimize "Unexpected state" errors
    });
  } catch (e: any) {
    // Fallback: get the existing instance if initialization already happened
    firestore = getFirestore(firebaseApp);
  }

  return {
    firebaseApp,
    auth,
    firestore
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
