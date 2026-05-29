'use client';

import { Client, Expense, Subscription } from './types';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';

function uid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');
  return user.uid;
}

// Clients Layer
export async function getClients(): Promise<Client[]> {
  const path = 'clients';
  try {
    const q = query(collection(db, path), where('userId', '==', uid()));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Client));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function addClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
  const path = 'clients';
  try {
    const data = { ...client, userId: uid(), createdAt: Date.now() };
    const docRef = await addDoc(collection(db, path), data);
    return { id: docRef.id, ...data } as Client;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateClient(id: string, client: Partial<Client>): Promise<void> {
  const path = `clients/${id}`;
  try {
    await updateDoc(doc(db, 'clients', id), client as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteClient(id: string): Promise<void> {
  const path = `clients/${id}`;
  try {
    await deleteDoc(doc(db, 'clients', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
  try {
    const q = query(collection(db, 'subscriptions'), where('clientId', '==', id));
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, 'subscriptions', d.id))));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'subscriptions');
  }
}

// Subscriptions Layer
export async function getSubscriptions(): Promise<Subscription[]> {
  const path = 'subscriptions';
  try {
    const q = query(collection(db, path), where('userId', '==', uid()));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subscription));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function addSubscription(sub: Omit<Subscription, 'id' | 'createdAt'>): Promise<Subscription> {
  const path = 'subscriptions';
  try {
    const data = { ...sub, userId: uid(), createdAt: Date.now() };
    const docRef = await addDoc(collection(db, path), data);
    return { id: docRef.id, ...data } as Subscription;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateSubscription(id: string, sub: Partial<Subscription>): Promise<void> {
  const path = `subscriptions/${id}`;
  try {
    await updateDoc(doc(db, 'subscriptions', id), sub as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSubscription(id: string): Promise<void> {
  const path = `subscriptions/${id}`;
  try {
    await deleteDoc(doc(db, 'subscriptions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Expenses Layer
export async function getExpenses(): Promise<Expense[]> {
  const path = 'expenses';
  try {
    const q = query(collection(db, path), where('userId', '==', uid()));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
  const path = 'expenses';
  try {
    const data = { ...expense, userId: uid(), createdAt: Date.now() };
    const docRef = await addDoc(collection(db, path), data);
    return { id: docRef.id, ...data } as Expense;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateExpense(id: string, expense: Partial<Expense>): Promise<void> {
  const path = `expenses/${id}`;
  try {
    await updateDoc(doc(db, 'expenses', id), expense as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteExpense(id: string): Promise<void> {
  const path = `expenses/${id}`;
  try {
    await deleteDoc(doc(db, 'expenses', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
