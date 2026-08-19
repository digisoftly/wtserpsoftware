import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';

/**
 * Global singleton state to survive Hot Module Replacement (HMR) in Next.js development.
 * This prevents the "INTERNAL ASSERTION FAILED: Unexpected state" error caused by
 * multiple Firestore instances competing for the same internal state.
 */
let cachedFirebaseApp: FirebaseApp | undefined;
let cachedAuth: Auth | undefined;
let cachedFirestore: Firestore | undefined;

/**
 * Robust Firebase initialization for Next.js (Client & Server).
 * Implements a strict singleton pattern to avoid multiple SDK initializations.
 */
export function initializeFirebase() {
  // 1. Initialize Firebase App
  if (!cachedFirebaseApp) {
    if (getApps().length > 0) {
      cachedFirebaseApp = getApp();
    } else {
      // Explicitly check for config to avoid opaque 'no-options' errors
      if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "undefined") {
        console.warn('Firebase configuration is missing. Ensure NEXT_PUBLIC_FIREBASE_* env vars are set.');
      }
      cachedFirebaseApp = initializeApp(firebaseConfig);
    }
  }

  // 2. Initialize Auth
  if (!cachedAuth) {
    cachedAuth = getAuth(cachedFirebaseApp);
  }

  // 3. Initialize Firestore
  if (!cachedFirestore) {
    try {
      /**
       * IMPORTANT: We call initializeFirestore ONLY ONCE. 
       * Subsequent calls or calls on an already used app instance 
       * can trigger internal assertion failures.
       */
      cachedFirestore = initializeFirestore(cachedFirebaseApp, {
        ignoreUndefinedProperties: true,
      });
    } catch (e: any) {
      // Fallback: get the existing instance if initialization already happened
      cachedFirestore = getFirestore(cachedFirebaseApp);
    }
  }

  return {
    firebaseApp: cachedFirebaseApp,
    auth: cachedAuth,
    firestore: cachedFirestore
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
