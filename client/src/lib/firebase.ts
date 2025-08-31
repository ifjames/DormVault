import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, orderBy, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB8kamfXr2-2CZvkgEnEkJiuBfweAbPHFE",
  authDomain: "dormvault-861ee.firebaseapp.com",
  projectId: "dormvault-861ee",
  storageBucket: "dormvault-861ee.firebasestorage.app",
  messagingSenderId: "910518209468",
  appId: "1:910518209468:web:f93ef599a4fe1297b1f9b9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth functions
export const loginWithEmail = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
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