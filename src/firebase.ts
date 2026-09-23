import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { CreationItem } from './types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network connection.");
    }
  }
}

// Test connection on startup
testConnection();

// Persistence helpers
export async function saveCreationToFirestore(creation: CreationItem, userId?: string) {
  const effectiveUid = userId || auth.currentUser?.uid;
  if (!effectiveUid) return;

  const path = `creations/${creation.id}`;
  try {
    await setDoc(doc(db, 'creations', creation.id), {
      ...creation,
      userId: effectiveUid,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadUserCreationsFromFirestore(userId: string): Promise<CreationItem[]> {
  const path = 'creations';
  try {
    const q = query(collection(db, 'creations'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const items: CreationItem[] = [];
    snap.forEach((d) => {
      items.push(d.data() as CreationItem);
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function deleteCreationFromFirestore(creationId: string) {
  const path = `creations/${creationId}`;
  try {
    await deleteDoc(doc(db, 'creations', creationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteMultipleCreationsFromFirestore(creationIds: string[]) {
  await Promise.all(
    creationIds.map((id) => deleteCreationFromFirestore(id).catch((err) => console.warn(`Failed to delete ${id} from Firestore:`, err)))
  );
}

export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };
