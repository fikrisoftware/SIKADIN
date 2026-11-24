'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
import { ensureUserRoleProfile } from '@/lib/firestore-service';
import {
  BOOTSTRAP_SUPER_ADMIN_EMAIL,
  getRolePermissions,
  type Campaign,
  type Customer,
  type PaymentGatewayConfig,
  type PaymentReconciliation,
  type PayoutRecord,
  type Product,
  type RoleAuditLog,
  type RoleInvite,
  type RolePermissions,
  type StockLog,
  type StoreProfile,
  type Transaction,
  type UserRole,
  type UserRoleProfile,
} from '@/lib/types';

interface AppDataContextValue {
  user: User | null;
  authReady: boolean;
  authError: string | null;
  signingIn: boolean;
  dataLoading: boolean;
  roleProfile: UserRoleProfile | null;
  actualRole: UserRole;
  effectiveRole: UserRole;
  previewRole: UserRole | null;
  setPreviewRole: (role: UserRole | null) => void;
  permissions: RolePermissions;
  isAccountDisabled: boolean;
  activeWorkspaceId: string;
  setSelectedWorkspaceId: (ownerId: string | null) => void;
  storeProfile: StoreProfile | null;
  products: Product[];
  stockLogs: StockLog[];
  customers: Customer[];
  campaigns: Campaign[];
  transactions: Transaction[];
  paymentConfig: PaymentGatewayConfig | null;
  reconciliations: PaymentReconciliation[];
  payouts: PayoutRecord[];
  allStores: StoreProfile[];
  hqTransactions: Transaction[];
  roleProfiles: UserRoleProfile[];
  roleInvites: RoleInvite[];
  roleAuditLogs: RoleAuditLog[];
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

  const [roleProfile, setRoleProfile] = useState<UserRoleProfile | null>(null);
  const [roleLoadedUid, setRoleLoadedUid] = useState<string | null>(null);
  const [previewRole, setPreviewRoleState] = useState<UserRole | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceIdState] = useState<string | null>(null);

  const [loadedWorkspaceKey, setLoadedWorkspaceKey] = useState<string | null>(null);
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig | null>(null);
  const [reconciliations, setReconciliations] = useState<PaymentReconciliation[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);

  const [allStores, setAllStores] = useState<StoreProfile[]>([]);
  const [hqTransactions, setHqTransactions] = useState<Transaction[]>([]);
  const [roleProfiles, setRoleProfiles] = useState<UserRoleProfile[]>([]);
  const [roleInvites, setRoleInvites] = useState<RoleInvite[]>([]);
  const [roleAuditLogs, setRoleAuditLogs] = useState<RoleAuditLog[]>([]);

  const [fatalError, setFatalError] = useState<Error | null>(null);

  useEffect(() => {
    testConnection();
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        setRoleProfile(null);
        setRoleLoadedUid(null);
        setPreviewRoleState(null);
        setSelectedWorkspaceIdState(null);
        setLoadedWorkspaceKey(null);
        setStoreProfile(null);
        setProducts([]);
        setStockLogs([]);
        setCustomers([]);
        setCampaigns([]);
        setTransactions([]);
        setPaymentConfig(null);
        setReconciliations([]);
        setPayouts([]);
        setAllStores([]);
        setHqTransactions([]);
        setRoleProfiles([]);
        setRoleInvites([]);
        setRoleAuditLogs([]);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;
    let active = true;
    const uid = user.uid;
    const email = user.email || '';
    const displayName = user.displayName || '';

    ensureUserRoleProfile({ uid, email, displayName }).catch((err) => {
      if (!active) return;
      setFatalError(err instanceof Error ? err : new Error(String(err)));
    });

    const unsubRole = onSnapshot(
      doc(db, 'userRoles', uid),
      (snap) => {
        if (!active) return;
        if (snap.exists()) {
          setRoleProfile(snap.data() as UserRoleProfile);
          setRoleLoadedUid(uid);
        }
      },
      (err) => {
        if (!active) return;
        try {
          handleFirestoreError(err, OperationType.GET, `userRoles/${uid}`);
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );

    return () => {
      active = false;
      unsubRole();
    };
  }, [authReady, user]);

  const isBootstrapSuper =
    Boolean(user?.email) && user!.email!.toLowerCase() === BOOTSTRAP_SUPER_ADMIN_EMAIL;

  const actualRole: UserRole = roleProfile?.role
    ? roleProfile.role
    : isBootstrapSuper
      ? 'super_admin_pusat'
      : 'pemilik';

  const isAccountDisabled = Boolean(
    roleProfile && roleProfile.status === 'Nonaktif' && !isBootstrapSuper
  );

  const activePreviewRole = actualRole === 'super_admin_pusat' ? previewRole : null;
  const effectiveRole: UserRole = activePreviewRole ?? actualRole;
  const permissions = useMemo(() => getRolePermissions(effectiveRole), [effectiveRole]);

  const isActualHqAdmin = actualRole === 'admin_pusat' || actualRole === 'super_admin_pusat';

  const activeWorkspaceId = useMemo(() => {
    if (!user) return '';
    if (actualRole === 'kasir') {
      return roleProfile?.workspaceOwnerId || user.uid;
    }
    if (isActualHqAdmin && selectedWorkspaceId) {
      return selectedWorkspaceId;
    }
    return roleProfile?.workspaceOwnerId || user.uid;
  }, [actualRole, isActualHqAdmin, roleProfile?.workspaceOwnerId, selectedWorkspaceId, user]);

  const isRoleReady = Boolean(user && roleLoadedUid === user.uid);

  useEffect(() => {
    if (!isRoleReady || !user || !activeWorkspaceId || isAccountDisabled) return;

    const workspaceKey = `${user.uid}:${activeWorkspaceId}`;
    let loadedMask = 0;
    const markLoaded = (bit: number) => {
      loadedMask |= bit;
      if (loadedMask === 63) {
        setLoadedWorkspaceKey(workspaceKey);
      }
    };

    const captureError = (err: unknown, op: OperationType, path: string) => {
      try {
        handleFirestoreError(err, op, path);
      } catch (wrapped) {
        setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    };

    const unsubStore = onSnapshot(
      doc(db, 'stores', activeWorkspaceId),
      (snap) => {
        setStoreProfile(snap.exists() ? (snap.data() as StoreProfile) : null);
        markLoaded(1);
      },
      (err) => captureError(err, OperationType.GET, `stores/${activeWorkspaceId}`)
    );

    const unsubProducts = onSnapshot(
      query(collection(db, 'products'), where('ownerId', '==', activeWorkspaceId)),
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

    const unsubLogs = onSnapshot(
      query(collection(db, 'stockLogs'), where('ownerId', '==', activeWorkspaceId)),
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

    const unsubCustomers = onSnapshot(
      query(collection(db, 'customers'), where('ownerId', '==', activeWorkspaceId)),
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

    const unsubCampaigns = onSnapshot(
      query(collection(db, 'campaigns'), where('ownerId', '==', activeWorkspaceId)),
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

    const unsubTransactions = onSnapshot(
      query(collection(db, 'transactions'), where('ownerId', '==', activeWorkspaceId)),
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

    const unsubPaymentConfig = onSnapshot(
      doc(db, 'paymentConfigs', activeWorkspaceId),
      (snap) => {
        setPaymentConfig(snap.exists() ? (snap.data() as PaymentGatewayConfig) : null);
      },
      (err) => captureError(err, OperationType.GET, `paymentConfigs/${activeWorkspaceId}`)
    );

    let unsubReconciliations: (() => void) | null = null;
    let unsubPayouts: (() => void) | null = null;

    if (actualRole !== 'kasir') {
      unsubReconciliations = onSnapshot(
        query(
          collection(db, 'paymentReconciliations'),
          where('ownerId', '==', activeWorkspaceId)
        ),
        (snap) => {
          const list: PaymentReconciliation[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PaymentReconciliation, 'id'>),
          }));
          setReconciliations(sortByTimestampDesc(list));
        },
        (err) => captureError(err, OperationType.LIST, 'paymentReconciliations')
      );

      unsubPayouts = onSnapshot(
        query(collection(db, 'payouts'), where('ownerId', '==', activeWorkspaceId)),
        (snap) => {
          const list: PayoutRecord[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PayoutRecord, 'id'>),
          }));
          setPayouts(sortByTimestampDesc(list));
        },
        (err) => captureError(err, OperationType.LIST, 'payouts')
      );
    }

    return () => {
      unsubStore();
      unsubProducts();
      unsubLogs();
      unsubCustomers();
      unsubCampaigns();
      unsubTransactions();
      unsubPaymentConfig();
      if (unsubReconciliations) unsubReconciliations();
      if (unsubPayouts) unsubPayouts();
    };
  }, [activeWorkspaceId, actualRole, isAccountDisabled, isRoleReady, user]);

  useEffect(() => {
    if (!isRoleReady || !user || isAccountDisabled || actualRole === 'kasir') return;

    const uid = user.uid;
    const unsubs: Array<() => void> = [];

    const captureError = (err: unknown, op: OperationType, path: string) => {
      try {
        handleFirestoreError(err, op, path);
      } catch (wrapped) {
        setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    };

    const rolesQuery = isActualHqAdmin
      ? collection(db, 'userRoles')
      : query(collection(db, 'userRoles'), where('workspaceOwnerId', '==', uid));

    unsubs.push(
      onSnapshot(
        rolesQuery,
        (snap) => {
          const list: UserRoleProfile[] = snap.docs.map((d) => d.data() as UserRoleProfile);
          setRoleProfiles(sortByTimestampDesc(list));
        },
        (err) => captureError(err, OperationType.LIST, 'userRoles')
      )
    );

    const invitesQuery = isActualHqAdmin
      ? collection(db, 'roleInvites')
      : query(collection(db, 'roleInvites'), where('workspaceOwnerId', '==', uid));

    unsubs.push(
      onSnapshot(
        invitesQuery,
        (snap) => {
          const list: RoleInvite[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<RoleInvite, 'id'>),
          }));
          setRoleInvites(sortByTimestampDesc(list));
        },
        (err) => captureError(err, OperationType.LIST, 'roleInvites')
      )
    );

    const auditsQuery = isActualHqAdmin
      ? collection(db, 'roleAuditLogs')
      : query(collection(db, 'roleAuditLogs'), where('workspaceOwnerId', '==', uid));

    unsubs.push(
      onSnapshot(
        auditsQuery,
        (snap) => {
          const list: RoleAuditLog[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<RoleAuditLog, 'id'>),
          }));
          setRoleAuditLogs(sortByTimestampDesc(list));
        },
        (err) => captureError(err, OperationType.LIST, 'roleAuditLogs')
      )
    );

    if (isActualHqAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'stores'),
          (snap) => {
            const list: StoreProfile[] = snap.docs.map((d) => d.data() as StoreProfile);
            setAllStores(sortByTimestampDesc(list));
          },
          (err) => captureError(err, OperationType.LIST, 'stores')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'transactions'),
          (snap) => {
            const list: Transaction[] = snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<Transaction, 'id'>),
            }));
            setHqTransactions(sortByTimestampDesc(list));
          },
          (err) => captureError(err, OperationType.LIST, 'transactions')
        )
      );
    }

    return () => {
      for (const fn of unsubs) fn();
    };
  }, [actualRole, isAccountDisabled, isActualHqAdmin, isRoleReady, user]);

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

  const setPreviewRole = (role: UserRole | null) => {
    if (actualRole !== 'super_admin_pusat') return;
    setPreviewRoleState(role);
  };

  const setSelectedWorkspaceId = (ownerId: string | null) => {
    if (!isActualHqAdmin) return;
    setSelectedWorkspaceIdState(ownerId);
  };

  const expectedWorkspaceKey = user && activeWorkspaceId ? `${user.uid}:${activeWorkspaceId}` : null;
  const dataLoading = Boolean(
    user &&
      !isAccountDisabled &&
      (!isRoleReady || loadedWorkspaceKey !== expectedWorkspaceKey)
  );

  return (
    <AppDataContext.Provider
      value={{
        user,
        authReady,
        authError,
        signingIn,
        dataLoading,
        roleProfile,
        actualRole,
        effectiveRole,
        previewRole: activePreviewRole,
        setPreviewRole,
        permissions,
        isAccountDisabled,
        activeWorkspaceId,
        setSelectedWorkspaceId,
        storeProfile,
        products,
        stockLogs,
        customers,
        campaigns,
        transactions,
        paymentConfig,
        reconciliations: actualRole === 'kasir' ? [] : reconciliations,
        payouts: actualRole === 'kasir' ? [] : payouts,
        allStores: isActualHqAdmin ? allStores : [],
        hqTransactions: isActualHqAdmin ? hqTransactions : [],
        roleProfiles: actualRole === 'kasir' ? [] : roleProfiles,
        roleInvites: actualRole === 'kasir' ? [] : roleInvites,
        roleAuditLogs: actualRole === 'kasir' ? [] : roleAuditLogs,
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
