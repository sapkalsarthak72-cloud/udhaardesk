/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseAppletConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let isConfigured = false;
let configData: FirebaseAppletConfig | null = null;

// Dynamically check for local config or environment setup
try {
  // Check if firebase-applet-config exists or is supplied
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    isConfigured = true;
  }
} catch (e) {
  console.warn('Firebase initialization note: Running in local demo mode until live project connected.', e);
}

export function initFirebaseWithConfig(config: FirebaseAppletConfig): boolean {
  try {
    if (getApps().length > 0) {
      app = getApps()[0];
    } else {
      app = initializeApp(config);
    }
    authInstance = getAuth(app);
    dbInstance = config.firestoreDatabaseId ? getFirestore(app, config.firestoreDatabaseId) : getFirestore(app);
    configData = config;
    isConfigured = true;
    return true;
  } catch (err) {
    console.error('Failed to configure Firebase:', err);
    return false;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuth = authInstance?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.uid || null,
      email: currentAuth?.email || null,
      emailVerified: currentAuth?.emailVerified || null,
      isAnonymous: currentAuth?.isAnonymous || null,
      tenantId: currentAuth?.tenantId || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getFirebaseApp = () => app;
export const getFirebaseAuth = () => authInstance;
export const getFirestoreDb = () => dbInstance;
export const isFirebaseActive = () => isConfigured;
export const getFirebaseConfig = () => configData;
