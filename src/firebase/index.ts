import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';

/**
 * WarriorERP - Global Firebase Singleton
 * Initializing outside the function scope ensures that during Next.js HMR 
 * (Hot Module Replacement) and Turbopack updates, we don't re-initialize 
 * the SDK and hit bandwidth/assertion limits.
 */

// 1. Core App Instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Auth Instance
const auth = getAuth(app);

// 3. Firestore Instance with Production Config
// We use initializeFirestore once with specific settings for production reliability.
let db: Firestore;
try {
  // In a client-side environment, we attempt to initialize only once.
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  });
} catch (e) {
  // If already initialized, get the existing instance
  db = getFirestore(app);
}

/**
 * Shared entry point for both Client and Server components.
 * Client components should use this via the FirebaseClientProvider.
 */
export function initializeFirebase() {
  return {
    firebaseApp: app,
    auth: auth,
    firestore: db
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