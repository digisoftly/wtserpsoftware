import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';

/**
 * WarriorERP - Global Firebase Singleton
 * Initializing outside the function scope ensures stability during HMR.
 */

// 1. Core App Instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Auth Instance
const auth = getAuth(app);

// 3. Firestore Instance with Connectivity Fix
let db: Firestore;
try {
  // Enabling experimentalForceLongPolling to fix connection timeouts in workstation/proxy environments
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    experimentalForceLongPolling: true, 
  });
} catch (e) {
  db = getFirestore(app);
}

/**
 * Shared entry point for both Client and Server components.
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
