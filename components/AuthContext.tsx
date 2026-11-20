'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testConnection,
} from '@/lib/firebase';
import type {
  Campaign,
  Customer,
  Product,
  StockLog,
  StoreProfile,
  Transaction,
} from '@/lib/types';

interface AppDataContextValue {
  user: User | null;
  authReady: boolean;
  authError: string | null;
  signingIn: boolean;
  dataLoading: boolean;
  storeProfile: StoreProfile | null;
  products: Product[];
  stockLogs: StockLog[];
  customers: Customer[];
  campaigns: Campaign[];
  transactions: Transaction[];
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function sortByTimestampDesc<T extends { createdAt?: { toMillis?: () => number } }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ta = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : Date.now();
    const tb = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : Date.now();
    return tb - ta;
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  useEffect(() => {
    testConnection();
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        setStoreProfile(null);
        setProducts([]);
        setStockLogs([]);
        setCustomers([]);
        setCampaigns([]);
        setTransactions([]);
        setLoadedUid(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;

    const uid = user.uid;
    let loadedMask = 0;
    const markLoaded = (bit: number) => {
      loadedMask |= bit;
      if (loadedMask === 63) {
        setLoadedUid(uid);
      }
    };

    const captureError = (err: unknown, op: OperationType, path: string) => {
      try {
        handleFirestoreError(err, op, path);
      } catch (wrapped) {
        setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    };

    // 1. Store Profile
    const unsubStore = onSnapshot(
      doc(db, 'stores', uid),
      (snap) => {
        if (snap.exists()) {
          setStoreProfile(snap.data() as StoreProfile);
        } else {
          setStoreProfile(null);
        }
        markLoaded(1);
      },
      (err) => captureError(err, OperationType.GET, `stores/${uid}`)
    );

    // 2. Products
    const unsubProducts = onSnapshot(
      query(collection(db, 'products'), where('ownerId', '==', uid)),
      (snap) => {
        const list: Product[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Product, 'id'>),
        }));
        setProducts(sortByTimestampDesc(list));
        markLoaded(2);
      },
      (err) => captureError(err, OperationType.LIST, 'products')
    );

    // 3. Stock Logs
    const unsubLogs = onSnapshot(
      query(collection(db, 'stockLogs'), where('ownerId', '==', uid)),
      (snap) => {
        const list: StockLog[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<StockLog, 'id'>),
        }));
        setStockLogs(sortByTimestampDesc(list));
        markLoaded(4);
      },
      (err) => captureError(err, OperationType.LIST, 'stockLogs')
    );

    // 4. Customers
    const unsubCustomers = onSnapshot(
      query(collection(db, 'customers'), where('ownerId', '==', uid)),
      (snap) => {
        const list: Customer[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Customer, 'id'>),
        }));
        setCustomers(sortByTimestampDesc(list));
        markLoaded(8);
      },
      (err) => captureError(err, OperationType.LIST, 'customers')
    );

    // 5. Campaigns
    const unsubCampaigns = onSnapshot(
      query(collection(db, 'campaigns'), where('ownerId', '==', uid)),
      (snap) => {
        const list: Campaign[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Campaign, 'id'>),
        }));
        setCampaigns(sortByTimestampDesc(list));
        markLoaded(16);
      },
      (err) => captureError(err, OperationType.LIST, 'campaigns')
    );

    // 6. Transactions
    const unsubTransactions = onSnapshot(
      query(collection(db, 'transactions'), where('ownerId', '==', uid)),
      (snap) => {
        const list: Transaction[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Transaction, 'id'>),
        }));
        setTransactions(sortByTimestampDesc(list));
        markLoaded(32);
      },
      (err) => captureError(err, OperationType.LIST, 'transactions')
    );

    return () => {
      unsubStore();
      unsubProducts();
      unsubLogs();
      unsubCustomers();
      unsubCampaigns();
      unsubTransactions();
    };
  }, [authReady, user]);

  if (fatalError) {
    throw fatalError;
  }

  const signInWithGoogle = async () => {
    setAuthError(null);
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const code = (error as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Jendela login ditutup sebelum selesai. Silakan coba masuk kembali.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Browser memblokir jendela login. Izinkan pop-up untuk melanjutkan.');
      } else {
        setAuthError('Gagal masuk dengan Google. Periksa koneksi Anda dan coba lagi.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const dataLoading = Boolean(user && loadedUid !== user.uid);

  return (
    <AppDataContext.Provider
      value={{
        user,
        authReady,
        authError,
        signingIn,
        dataLoading,
        storeProfile,
        products,
        stockLogs,
        customers,
        campaigns,
        transactions,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used inside AuthProvider');
  }
  return ctx;
}
