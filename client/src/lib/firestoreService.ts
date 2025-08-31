import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from "firebase/firestore";
import { db, COLLECTIONS } from "./firebase";

// Dormer operations
export const dormersService = {
  async getAll() {
    const q = query(collection(db, COLLECTIONS.DORMERS), orderBy("room"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getById(id: string) {
    const docRef = doc(db, COLLECTIONS.DORMERS, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  async create(dormerData: any) {
    const docRef = await addDoc(collection(db, COLLECTIONS.DORMERS), {
      ...dormerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...dormerData };
  },

  async update(id: string, updates: any) {
    const docRef = doc(db, COLLECTIONS.DORMERS, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { id, ...updates };
  },

  async delete(id: string) {
    const docRef = doc(db, COLLECTIONS.DORMERS, id);
    await deleteDoc(docRef);
  }
};

// Bill operations
export const billsService = {
  async getAll() {
    const q = query(collection(db, COLLECTIONS.BILLS), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async create(billData: any) {
    const docRef = await addDoc(collection(db, COLLECTIONS.BILLS), {
      ...billData,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...billData };
  },

  async getShares(billId: string) {
    const q = query(collection(db, COLLECTIONS.BILL_SHARES), where("billId", "==", billId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async createShare(shareData: any) {
    const docRef = await addDoc(collection(db, COLLECTIONS.BILL_SHARES), {
      ...shareData,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...shareData };
  }
};

// Payment operations
export const paymentsService = {
  async getAll() {
    const q = query(collection(db, COLLECTIONS.PAYMENTS), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getByDormer(dormerId: string) {
    const q = query(collection(db, COLLECTIONS.PAYMENTS), where("dormerId", "==", dormerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async create(paymentData: any) {
    const docRef = await addDoc(collection(db, COLLECTIONS.PAYMENTS), {
      ...paymentData,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...paymentData };
  },

  async update(id: string, updates: any) {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, id);
    await updateDoc(docRef, updates);
    return { id, ...updates };
  },

  async delete(id: string) {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, id);
    await deleteDoc(docRef);
  }
};