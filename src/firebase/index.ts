import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore, terminate } from 'firebase/firestore';

/**
 * Global singletons to survive HMR and avoid "INTERNAL ASSERTION FAILED"
 */
let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;

/**
 * Robust Firebase initialization for Next.js.
 * Ensures services are initialized only once per life-cycle.
 */
export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    // 1. App Initialization
    if (!firebaseApp) {
      const apps = getApps();
      if (apps.length > 0) {
        firebaseApp = apps[0];
      } else {
        firebaseApp = initializeApp(firebaseConfig);
      }
    }

    // 2. Auth Initialization
    if (!auth) {
      auth = getAuth(firebaseApp);
    }

    // 3. Firestore Initialization
    if (!firestore) {
      try {
        // Attempt to get existing instance first to avoid multi-init error
        firestore = getFirestore(firebaseApp);
      } catch (e) {
        // Only initialize if it really doesn't exist
        firestore = initializeFirestore(firebaseApp, {
          ignoreUndefinedProperties: true,
        });
      }
    }
  } else {
    // SSR Fallback (Non-cached for safety in different requests)
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app)
    };
  }

  return {
    firebaseApp: firebaseApp!,
    auth: auth!,
    firestore: firestore!
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
