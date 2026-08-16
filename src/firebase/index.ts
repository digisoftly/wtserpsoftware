import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';

/**
 * Robust Firebase initialization for Next.js (Client & Server).
 * Ensures the config object is used to prevent 'app/no-options' errors on Vercel.
 * Prevents multiple Firestore initializations during SSR/Build.
 */
export function initializeFirebase() {
  let app: FirebaseApp;

  if (getApps().length > 0) {
    app = getApp();
  } else {
    // Explicitly check for config to avoid opaque 'no-options' errors
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "undefined") {
      console.warn('Firebase configuration is missing. Ensure NEXT_PUBLIC_FIREBASE_* env vars are set.');
    }
    
    // Always provide config object. Zero-config initializeApp() is only for Firebase App Hosting.
    app = initializeApp(firebaseConfig);
  }

  return getSdks(app);
}

/**
 * Retrieves and configures SDK instances for a given Firebase App.
 */
export function getSdks(firebaseApp: FirebaseApp) {
  let firestore: Firestore;
  
  try {
    // Attempt to initialize Firestore with custom settings
    firestore = initializeFirestore(firebaseApp, {
      ignoreUndefinedProperties: true
    });
  } catch (e: any) {
    // Fallback if already initialized (e.g. during Next.js static generation or HMR)
    firestore = getFirestore(firebaseApp);
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
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
