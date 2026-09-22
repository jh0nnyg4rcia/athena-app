import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

function createAuth() {
  if (typeof window === 'undefined') {
    return getAuth(app);
  }
  try {
    return initializeAuth(app, {
      persistence: Capacitor.isNativePlatform() ? indexedDBLocalPersistence : browserLocalPersistence,
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

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
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function cleanData(data: any): any {
  if (data === undefined) return null;
  if (data === null) return null;
  if (Array.isArray(data)) return data.map(cleanData);
  if (typeof data === 'object' && data !== null) {
    const clean: any = {};
    Object.keys(data).forEach(key => {
      const val = cleanData(data[key]);
      if (val !== undefined && val !== null) {
        clean[key] = val;
      }
    });
    return clean;
  }
  return data;
}

export function isQuotaExceededError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    (error as any)?.code === 'resource-exhausted'
  );
}

let quotaExceededCached = false;
try {
  if (typeof window !== 'undefined') {
    quotaExceededCached = sessionStorage.getItem('firestore_quota_exhausted') === 'true';
  }
} catch (e) {}

export function isQuotaExhausted(): boolean {
  return quotaExceededCached;
}

export function setQuotaExhausted(val: boolean) {
  quotaExceededCached = val;
  try {
    if (typeof window !== 'undefined') {
      if (val) {
        sessionStorage.setItem('firestore_quota_exhausted', 'true');
      } else {
        sessionStorage.removeItem('firestore_quota_exhausted');
      }
    }
  } catch (e) {}
}

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (isQuotaExceededError(event.reason)) {
      event.preventDefault(); // Prevent uncaught promise rejection in browser
      setQuotaExhausted(true);
      window.dispatchEvent(new CustomEvent('firestore-quota-exceeded', { detail: { error: event.reason } }));
    }
  });
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const isQuota = isQuotaExceededError(error);
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (isQuota) {
    setQuotaExhausted(true);
    console.warn(`[Firestore Quota Exceeded] Path: ${path}, Op: ${operationType}. Using local offline fallback.`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firestore-quota-exceeded', { detail: { path, operationType } }));
    }
    return;
  }

  console.warn(`[Firestore Resilient Fallback] Path: ${path}, Op: ${operationType}. Message:`, errInfo.error);
  // Do NOT throw error: allow local persistence / offline state to keep the application 100% functional without crashes
}

export const logOut = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await FirebaseAuthentication.signOut();
    } catch (e) {
      console.warn("[Native SignOut Warning]:", e);
    }
  }
  return await signOut(auth);
};

