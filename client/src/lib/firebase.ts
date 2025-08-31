import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, orderBy, where } from "firebase/firestore";

import { firebaseConfig } from "../config/firebase.config";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth functions
export const loginWithEmail = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const createUserWithEmail = async (email: string, password: string) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

export const createUserWithoutSignIn = async (email: string, password: string) => {
  // Create a secondary app instance to avoid affecting current auth state
  const secondaryApp = initializeApp(firebaseConfig, "secondary");
  const secondaryAuth = getAuth(secondaryApp);
  
  try {
    // Create user with secondary auth instance
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    
    // Sign out from secondary auth to prevent any session conflicts
    await signOut(secondaryAuth);
    
    // Clean up the secondary app
    await deleteApp(secondaryApp);
    
    return userCredential;
  } catch (error) {
    // Clean up secondary app even if there's an error
    await deleteApp(secondaryApp);
    throw error;
  }
};

export const logout = async () => {
  return await signOut(auth);
};

// Firestore collections
export const COLLECTIONS = {
  DORMERS: 'dormers',
  BILLS: 'bills',
  BILL_SHARES: 'billShares',
  PAYMENTS: 'payments'
} as const;