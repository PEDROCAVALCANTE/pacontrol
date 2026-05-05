'use client';

import { Client, Expense, Subscription } from './types';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

// Clients Layer
export async function getClients(): Promise<Client[]> {
  const path = 'clients';
  try {
    const q = collection(db, path);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

export async function addClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
  const path = 'clients';
  try {
    const newClientData = { ...client, createdAt: Date.now() };
    const docRef = await addDoc(collection(db, path), newClientData);
    return { id: docRef.id, ...newClientData } as Client;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateClient(id: string, client: Partial<Client>): Promise<void> {
  const path = `clients/${id}`;
  try {
    const clientRef = doc(db, 'clients', id);
    await updateDoc(clientRef, client as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function deleteClient(id: string): Promise<void> {
  const path = `clients/${id}`;
  try {
    await deleteDoc(doc(db, 'clients', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
  // cascades: delete subscriptions
  try {
    const q = query(collection(db, 'subscriptions'), where('clientId', '==', id));
    const snapshot = await getDocs(q);
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, 'subscriptions', d.id));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'subscriptions');
    throw error;
  }
}

// Subscriptions Layer
export async function getSubscriptions(): Promise<Subscription[]> {
  const path = 'subscriptions';
  try {
    const q = collection(db, path);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

export async function addSubscription(sub: Omit<Subscription, 'id' | 'createdAt'>): Promise<Subscription> {
  const path = 'subscriptions';
  try {
    const newSubData = { ...sub, createdAt: Date.now() };
    const docRef = await addDoc(collection(db, path), newSubData);
    return { id: docRef.id, ...newSubData } as Subscription;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateSubscription(id: string, sub: Partial<Subscription>): Promise<void> {
  const path = `subscriptions/${id}`;
  try {
    const subRef = doc(db, 'subscriptions', id);
    await updateDoc(subRef, sub as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// Expenses Layer
export async function getExpenses(): Promise<Expense[]> {
  const path = 'expenses';
  try {
    const q = collection(db, path);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

export async function addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
  const path = 'expenses';
  try {
    const newExpenseData = { ...expense, createdAt: Date.now() };
    const docRef = await addDoc(collection(db, path), newExpenseData);
    return { id: docRef.id, ...newExpenseData } as Expense;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateExpense(id: string, expense: Partial<Expense>): Promise<void> {
  const path = `expenses/${id}`;
  try {
    const expenseRef = doc(db, 'expenses', id);
    await updateDoc(expenseRef, expense as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function deleteExpense(id: string): Promise<void> {
  const path = `expenses/${id}`;
  try {
    await deleteDoc(doc(db, 'expenses', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}
