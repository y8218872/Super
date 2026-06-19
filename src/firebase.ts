/**
 * Firebase Firestore Integration for Debt Ledger
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, doc, getDoc, setDoc, deleteDoc, 
  collection, getDocs, writeBatch 
} from 'firebase/firestore';
import { Customer, Transaction, User } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Get Firestore instance (with custom database ID from config if defined)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

export function isFirebaseConfigured(): boolean {
  return !!(firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey);
}

const FIREBASE_SYNC_META_KEY = 'debt_app_firebase_sync_meta_v1';

export interface FirebaseSyncMeta {
  connected: boolean;
  autoSyncEnabled: boolean;
  lastSyncAt?: string;
}

export function getFirebaseSyncMeta(): FirebaseSyncMeta {
  try {
    const data = localStorage.getItem(FIREBASE_SYNC_META_KEY);
    if (!data) {
      const defaultState: FirebaseSyncMeta = {
        connected: false,
        autoSyncEnabled: false
      };
      localStorage.setItem(FIREBASE_SYNC_META_KEY, JSON.stringify(defaultState));
      return defaultState;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading firebase sync metadata', err);
    return { connected: false, autoSyncEnabled: false };
  }
}

export function saveFirebaseSyncMeta(meta: FirebaseSyncMeta): void {
  try {
    localStorage.setItem(FIREBASE_SYNC_META_KEY, JSON.stringify(meta));
  } catch (err) {
    console.error('Error saving firebase sync metadata', err);
  }
}

/**
 * Push all local data to Firestore
 */
export async function pushDataToFirestore(
  customers: Customer[], 
  transactions: Transaction[],
  users: User[]
): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error('لم يتم تكوين إعدادات Firebase بشكل صحيح في هذا التطبيق.');
  }

  // Use batches for atomic updates
  const batch = writeBatch(db);

  // 1. Upload Customers
  for (const customer of customers) {
    const customerRef = doc(db, 'customers', customer.id);
    batch.set(customerRef, customer);
  }

  // 2. Upload Transactions
  for (const tx of transactions) {
    const txRef = doc(db, 'transactions', tx.id);
    batch.set(txRef, tx);
  }

  // 3. Upload Users
  for (const u of users) {
    const userRef = doc(db, 'users', u.id);
    batch.set(userRef, u);
  }

  await batch.commit();
}

/**
 * Pull all data from Firestore
 */
export async function pullDataFromFirestore(): Promise<{
  customers: Customer[];
  transactions: Transaction[];
  users: User[];
}> {
  if (!isFirebaseConfigured()) {
    throw new Error('لم يتم تكوين إعدادات Firebase بشكل صحيح في هذا التطبيق.');
  }

  // 1. Fetch Customers
  const custSnap = await getDocs(collection(db, 'customers'));
  const customers: Customer[] = [];
  custSnap.forEach((doc) => {
    customers.push(doc.data() as Customer);
  });

  // 2. Fetch Transactions
  const txSnap = await getDocs(collection(db, 'transactions'));
  const transactions: Transaction[] = [];
  txSnap.forEach((doc) => {
    transactions.push(doc.data() as Transaction);
  });

  // 3. Fetch Users
  const userSnap = await getDocs(collection(db, 'users'));
  const users: User[] = [];
  userSnap.forEach((doc) => {
    users.push(doc.data() as User);
  });

  return { customers, transactions, users };
}

/**
 * Save single document in Firestore (for reactive auto-sync)
 */
export async function saveDocFirestore(collectionName: string, id: string, data: any): Promise<void> {
  const meta = getFirebaseSyncMeta();
  if (!meta.connected || !meta.autoSyncEnabled) return;
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data);
  } catch (err) {
    console.error(`Failed to auto-save to Firestore collection [${collectionName}]:`, err);
  }
}

/**
 * Delete single document in Firestore (for reactive auto-sync)
 */
export async function deleteDocFirestore(collectionName: string, id: string): Promise<void> {
  const meta = getFirebaseSyncMeta();
  if (!meta.connected || !meta.autoSyncEnabled) return;
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Failed to auto-delete from Firestore collection [${collectionName}]:`, err);
  }
}
