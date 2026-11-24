import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  BOOTSTRAP_SUPER_ADMIN_EMAIL,
  Campaign,
  CampaignChannel,
  CampaignStatus,
  CampaignTargetSegment,
  Customer,
  CustomerSegment,
  emailToInviteId,
  generateDocId,
  generateReceiptNo,
  LIMITS,
  PaymentMethod,
  Product,
  ProductCategory,
  RoleInvite,
  StockLogType,
  StoreCategory,
  StoreProfile,
  todayISO,
  Transaction,
  TransactionItem,
  UserAccountStatus,
  UserRole,
  UserRoleProfile,
} from './types';

function clampString(val: string, max: number): string {
  return val.trim().slice(0, max);
}

function clampNumber(val: number, min: number, max: number): number {
  const n = Number(val);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function sanitizeSku(val: string): string {
  const cleaned = val
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_\-.]/g, '-');
  return (cleaned || `SKU-${Date.now().toString().slice(-5)}`).slice(0, LIMITS.SKU_MAX);
}

function sanitizePromoCode(val: string): string {
  return val
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_\-]/g, '')
    .slice(0, LIMITS.PROMO_CODE_MAX);
}

// === RBAC Identity Bootstrap & Management ===
export async function ensureUserRoleProfile(params: {
  uid: string;
  email: string;
  displayName: string;
}): Promise<UserRoleProfile> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const safeName = clampString(
    params.displayName || normalizedEmail.split('@')[0] || 'Pengguna',
    LIMITS.NAME_MAX
  );
  const roleRef = doc(db, 'userRoles', params.uid);

  try {
    const existingSnap = await getDoc(roleRef);
    if (existingSnap.exists()) {
      return existingSnap.data() as UserRoleProfile;
    }

    // Check if there is a pending RoleInvite for this Google email
    const inviteId = emailToInviteId(normalizedEmail);
    const inviteRef = doc(db, 'roleInvites', inviteId);
    let claimedInvite: RoleInvite | null = null;
    try {
      const inviteSnap = await getDoc(inviteRef);
      if (inviteSnap.exists()) {
        const inv = inviteSnap.data() as Omit<RoleInvite, 'id'>;
        if (inv.status === 'Menunggu' && inv.email === normalizedEmail) {
          claimedInvite = { id: inviteSnap.id, ...inv };
        }
      }
    } catch {
      // No invite accessible or doesn't exist
    }

    let role: UserRole = 'pemilik';
    let workspaceOwnerId = params.uid;
    let storeName = `Usaha ${safeName.split(' ')[0]}`;
    let assignedBy = 'self_registration';

    if (normalizedEmail === BOOTSTRAP_SUPER_ADMIN_EMAIL) {
      role = 'super_admin_pusat';
      workspaceOwnerId = params.uid;
      storeName = 'Kantor Pusat KADIN Indonesia';
      assignedBy = 'system_bootstrap';
    } else if (claimedInvite) {
      role = claimedInvite.role;
      workspaceOwnerId = claimedInvite.workspaceOwnerId;
      storeName = claimedInvite.storeName || storeName;
      assignedBy = claimedInvite.invitedByName;
    }

    const profileData = {
      uid: params.uid,
      email: normalizedEmail,
      displayName: safeName,
      role,
      workspaceOwnerId,
      storeName: clampString(storeName, LIMITS.STORE_NAME_MAX),
      status: 'Aktif' as UserAccountStatus,
      assignedBy: clampString(assignedBy, 128),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const batch = writeBatch(db);
    batch.set(roleRef, profileData);
    if (claimedInvite) {
      batch.update(inviteRef, {
        status: 'Diterima',
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();

    return {
      ...profileData,
      createdAt: undefined,
      updatedAt: undefined,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `userRoles/${params.uid}`);
  }
}

export interface RoleInviteInput {
  email: string;
  role: UserRole;
  workspaceOwnerId: string;
  storeName: string;
  note: string;
}

export async function createOrUpdateRoleInvite(
  actor: { uid: string; displayName: string; role: UserRole },
  input: RoleInviteInput,
  existingInvite: RoleInvite | null
): Promise<string> {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Masukkan alamat email Google yang valid.');
  }
  const inviteId = emailToInviteId(normalizedEmail);
  const path = `roleInvites/${inviteId}`;
  const batch = writeBatch(db);

  const safeStore = clampString(input.storeName, LIMITS.STORE_NAME_MAX) || 'Usaha UMKM SI DIKA';
  const safeNote = clampString(input.note, LIMITS.NOTE_MAX);
  const actorName = clampString(actor.displayName || 'Admin', LIMITS.NAME_MAX);

  if (existingInvite) {
    batch.update(doc(db, 'roleInvites', inviteId), {
      role: input.role,
      workspaceOwnerId: input.workspaceOwnerId,
      storeName: safeStore,
      status: 'Menunggu',
      invitedByUid: actor.uid,
      invitedByName: actorName,
      note: safeNote,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(doc(db, 'roleInvites', inviteId), {
      email: normalizedEmail,
      role: input.role,
      workspaceOwnerId: input.workspaceOwnerId,
      storeName: safeStore,
      status: 'Menunggu',
      invitedByUid: actor.uid,
      invitedByName: actorName,
      note: safeNote,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const auditId = generateDocId('audit');
  batch.set(doc(db, 'roleAuditLogs', auditId), {
    actorUid: actor.uid,
    actorName,
    actorRole: actor.role,
    targetEmail: normalizedEmail,
    targetRole: input.role,
    workspaceOwnerId: input.workspaceOwnerId,
    action: existingInvite ? 'Perbarui Undangan Peran' : 'Undang Pengguna Baru',
    note: safeNote || `Penugasan peran ${input.role} untuk ${safeStore}`,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return inviteId;
  } catch (error) {
    handleFirestoreError(error, existingInvite ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function revokeRoleInvite(
  actor: { uid: string; displayName: string; role: UserRole },
  invite: RoleInvite
): Promise<void> {
  const path = `roleInvites/${invite.id}`;
  const actorName = clampString(actor.displayName || 'Admin', LIMITS.NAME_MAX);
  const batch = writeBatch(db);

  batch.update(doc(db, 'roleInvites', invite.id), {
    status: 'Dicabut',
    invitedByUid: actor.uid,
    invitedByName: actorName,
    updatedAt: serverTimestamp(),
  });

  const auditId = generateDocId('audit');
  batch.set(doc(db, 'roleAuditLogs', auditId), {
    actorUid: actor.uid,
    actorName,
    actorRole: actor.role,
    targetEmail: invite.email,
    targetRole: invite.role,
    workspaceOwnerId: invite.workspaceOwnerId,
    action: 'Cabut Undangan Peran',
    note: `Undangan ${invite.role} dicabut oleh ${actorName}`,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateUserRoleAssignment(
  actor: { uid: string; displayName: string; role: UserRole },
  target: UserRoleProfile,
  updates: {
    role?: UserRole;
    workspaceOwnerId?: string;
    storeName?: string;
    status?: UserAccountStatus;
    note?: string;
  }
): Promise<void> {
  const path = `userRoles/${target.uid}`;
  const actorName = clampString(actor.displayName || 'Admin', LIMITS.NAME_MAX);
  const batch = writeBatch(db);

  const isStoreOwnerOnlyToggle =
    actor.role === 'pemilik' &&
    target.role === 'kasir' &&
    target.workspaceOwnerId === actor.uid;

  const nextRole = updates.role ?? target.role;
  const nextStatus = updates.status ?? target.status;
  const nextWorkspace = updates.workspaceOwnerId ?? target.workspaceOwnerId;
  const nextStoreName = clampString(updates.storeName ?? target.storeName, LIMITS.STORE_NAME_MAX);

  if (isStoreOwnerOnlyToggle) {
    batch.update(doc(db, 'userRoles', target.uid), {
      status: nextStatus,
      assignedBy: actorName,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.update(doc(db, 'userRoles', target.uid), {
      role: nextRole,
      workspaceOwnerId: nextWorkspace,
      storeName: nextStoreName,
      status: nextStatus,
      assignedBy: actorName,
      updatedAt: serverTimestamp(),
    });
  }

  const auditId = generateDocId('audit');
  batch.set(doc(db, 'roleAuditLogs', auditId), {
    actorUid: actor.uid,
    actorName,
    actorRole: actor.role,
    targetEmail: target.email,
    targetRole: nextRole,
    workspaceOwnerId: nextWorkspace,
    action:
      updates.status && updates.status !== target.status
        ? `Ubah Status ke ${nextStatus}`
        : `Ubah Peran ke ${nextRole}`,
    note: clampString(
      updates.note || `Diperbarui oleh ${actorName} (${nextStoreName || nextWorkspace})`,
      LIMITS.NOTE_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// === Store Profile ===
export interface StoreProfileInput {
  storeName: string;
  category: StoreCategory;
  phone: string;
  address: string;
  tagline: string;
}

export async function saveStoreProfile(
  ownerId: string,
  input: StoreProfileInput,
  existing: StoreProfile | null
): Promise<void> {
  const path = `stores/${ownerId}`;
  const ref = doc(db, 'stores', ownerId);
  const sanitized = {
    storeName: clampString(input.storeName, LIMITS.STORE_NAME_MAX) || 'Usaha UMKM Saya',
    category: input.category,
    phone: clampString(input.phone, LIMITS.PHONE_MAX),
    address: clampString(input.address, LIMITS.ADDRESS_MAX),
    tagline: clampString(input.tagline, LIMITS.TAGLINE_MAX) || 'UMKM Naik Kelas, Bisnis Makin Cuan',
  };

  try {
    if (existing) {
      await updateDoc(ref, {
        ...sanitized,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ownerId,
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, existing ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

// === Products & Inventory ===
export interface ProductInput {
  sku: string;
  name: string;
  category: ProductCategory;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  imageUrl: string;
  isActive: boolean;
}

export async function createProduct(ownerId: string, input: ProductInput): Promise<string> {
  const productId = generateDocId('prod');
  const path = `products/${productId}`;
  const stockVal = clampNumber(Math.round(input.stock), 0, 1_000_000);
  const nameVal = clampString(input.name, LIMITS.NAME_MAX);
  if (!nameVal) throw new Error('Nama produk wajib diisi.');

  try {
    await setDoc(doc(db, 'products', productId), {
      ownerId,
      sku: sanitizeSku(input.sku),
      name: nameVal,
      category: input.category,
      costPrice: clampNumber(Math.round(input.costPrice), 0, 1_000_000_000),
      sellPrice: clampNumber(Math.round(input.sellPrice), 0, 1_000_000_000),
      stock: stockVal,
      minStock: clampNumber(Math.round(input.minStock), 0, 100_000),
      unit: clampString(input.unit, LIMITS.UNIT_MAX) || 'pcs',
      imageUrl: clampString(input.imageUrl, LIMITS.IMAGE_URL_MAX),
      isActive: Boolean(input.isActive),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (stockVal > 0) {
      const logId = generateDocId('log');
      await setDoc(doc(db, 'stockLogs', logId), {
        ownerId,
        productId,
        productName: nameVal,
        type: 'masuk',
        delta: stockVal,
        stockAfter: stockVal,
        note: 'Stok awal produk baru',
        createdAt: serverTimestamp(),
      });
    }

    return productId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProduct(productId: string, input: ProductInput): Promise<void> {
  const path = `products/${productId}`;
  const nameVal = clampString(input.name, LIMITS.NAME_MAX);
  if (!nameVal) throw new Error('Nama produk wajib diisi.');

  try {
    await updateDoc(doc(db, 'products', productId), {
      sku: sanitizeSku(input.sku),
      name: nameVal,
      category: input.category,
      costPrice: clampNumber(Math.round(input.costPrice), 0, 1_000_000_000),
      sellPrice: clampNumber(Math.round(input.sellPrice), 0, 1_000_000_000),
      stock: clampNumber(Math.round(input.stock), 0, 1_000_000),
      minStock: clampNumber(Math.round(input.minStock), 0, 100_000),
      unit: clampString(input.unit, LIMITS.UNIT_MAX) || 'pcs',
      imageUrl: clampString(input.imageUrl, LIMITS.IMAGE_URL_MAX),
      isActive: Boolean(input.isActive),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adjustProductStock(
  ownerId: string,
  product: Product,
  delta: number,
  type: StockLogType,
  note: string
): Promise<void> {
  const path = `products/${product.id}`;
  const safeDelta = clampNumber(Math.round(delta), -100_000, 100_000);
  const nextStock = clampNumber(product.stock + safeDelta, 0, 1_000_000);
  const actualDelta = nextStock - product.stock;

  const batch = writeBatch(db);
  batch.update(doc(db, 'products', product.id), {
    stock: nextStock,
    updatedAt: serverTimestamp(),
  });
  const logId = generateDocId('log');
  batch.set(doc(db, 'stockLogs', logId), {
    ownerId,
    productId: product.id,
    productName: clampString(product.name, LIMITS.NAME_MAX),
    type,
    delta: actualDelta,
    stockAfter: nextStock,
    note: clampString(note, LIMITS.NOTE_MAX) || 'Penyesuaian stok manual',
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// === Customers (CRM) ===
export interface CustomerInput {
  name: string;
  phone: string;
  email: string;
  segment: CustomerSegment;
  notes: string;
}

export async function createCustomer(ownerId: string, input: CustomerInput): Promise<string> {
  const customerId = generateDocId('cust');
  const path = `customers/${customerId}`;
  const nameVal = clampString(input.name, LIMITS.NAME_MAX);
  const phoneVal = clampString(input.phone, LIMITS.PHONE_MAX);
  if (!nameVal) throw new Error('Nama pelanggan wajib diisi.');
  if (phoneVal.length < LIMITS.PHONE_MIN) throw new Error('Nomor WhatsApp minimal 6 karakter.');

  try {
    await setDoc(doc(db, 'customers', customerId), {
      ownerId,
      name: nameVal,
      phone: phoneVal,
      email: clampString(input.email, LIMITS.EMAIL_MAX),
      segment: input.segment,
      notes: clampString(input.notes, LIMITS.CUSTOMER_NOTES_MAX),
      totalSpent: 0,
      totalOrders: 0,
      loyaltyPoints: 0,
      lastOrderAt: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return customerId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCustomer(customerId: string, input: CustomerInput): Promise<void> {
  const path = `customers/${customerId}`;
  const nameVal = clampString(input.name, LIMITS.NAME_MAX);
  const phoneVal = clampString(input.phone, LIMITS.PHONE_MAX);
  if (!nameVal) throw new Error('Nama pelanggan wajib diisi.');
  if (phoneVal.length < LIMITS.PHONE_MIN) throw new Error('Nomor WhatsApp minimal 6 karakter.');

  try {
    await updateDoc(doc(db, 'customers', customerId), {
      name: nameVal,
      phone: phoneVal,
      email: clampString(input.email, LIMITS.EMAIL_MAX),
      segment: input.segment,
      notes: clampString(input.notes, LIMITS.CUSTOMER_NOTES_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const path = `customers/${customerId}`;
  try {
    await deleteDoc(doc(db, 'customers', customerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// === Digital Marketing Campaigns ===
export interface CampaignInput {
  title: string;
  channel: CampaignChannel;
  targetSegment: CampaignTargetSegment;
  promoCode: string;
  discountPercent: number;
  message: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  targetCount: number;
}

export async function createCampaign(ownerId: string, input: CampaignInput): Promise<string> {
  const campaignId = generateDocId('cmp');
  const path = `campaigns/${campaignId}`;
  const titleVal = clampString(input.title, LIMITS.NAME_MAX);
  const msgVal = clampString(input.message, LIMITS.CAMPAIGN_MSG_MAX);
  if (!titleVal || !msgVal) throw new Error('Judul dan pesan kampanye wajib diisi.');

  try {
    await setDoc(doc(db, 'campaigns', campaignId), {
      ownerId,
      title: titleVal,
      channel: input.channel,
      targetSegment: input.targetSegment,
      promoCode: sanitizePromoCode(input.promoCode),
      discountPercent: clampNumber(Math.round(input.discountPercent), 0, 90),
      message: msgVal,
      status: input.status,
      startDate: input.startDate || todayISO(),
      endDate: input.endDate || todayISO(14),
      targetCount: clampNumber(Math.round(input.targetCount), 0, 1_000_000),
      redemptions: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return campaignId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCampaign(campaignId: string, input: CampaignInput): Promise<void> {
  const path = `campaigns/${campaignId}`;
  const titleVal = clampString(input.title, LIMITS.NAME_MAX);
  const msgVal = clampString(input.message, LIMITS.CAMPAIGN_MSG_MAX);
  if (!titleVal || !msgVal) throw new Error('Judul dan pesan kampanye wajib diisi.');

  try {
    await updateDoc(doc(db, 'campaigns', campaignId), {
      title: titleVal,
      channel: input.channel,
      targetSegment: input.targetSegment,
      promoCode: sanitizePromoCode(input.promoCode),
      discountPercent: clampNumber(Math.round(input.discountPercent), 0, 90),
      message: msgVal,
      status: input.status,
      startDate: input.startDate || todayISO(),
      endDate: input.endDate || todayISO(14),
      targetCount: clampNumber(Math.round(input.targetCount), 0, 1_000_000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateCampaignStatus(
  campaignId: string,
  status: CampaignStatus
): Promise<void> {
  const path = `campaigns/${campaignId}`;
  try {
    await updateDoc(doc(db, 'campaigns', campaignId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  const path = `campaigns/${campaignId}`;
  try {
    await deleteDoc(doc(db, 'campaigns', campaignId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// === POS Checkout & Void ===
export interface CheckoutPayload {
  items: TransactionItem[];
  productsMap: Map<string, Product>;
  customer: Customer | null;
  appliedCampaign: Campaign | null;
  discount: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
}

export async function checkoutTransaction(
  ownerId: string,
  payload: CheckoutPayload
): Promise<Transaction> {
  if (payload.items.length === 0 || payload.items.length > LIMITS.MAX_TX_ITEMS) {
    throw new Error('Keranjang belanja harus berisi 1 hingga 50 item.');
  }

  const txId = generateDocId('tx');
  const receiptNo = generateReceiptNo();
  const saleDate = todayISO();

  const sanitizedItems: TransactionItem[] = payload.items.map((item) => ({
    productId: item.productId,
    sku: clampString(item.sku, LIMITS.SKU_MAX),
    name: clampString(item.name, LIMITS.NAME_MAX),
    category: item.category,
    qty: clampNumber(Math.round(item.qty), 1, 1000),
    sellPrice: clampNumber(Math.round(item.sellPrice), 0, 1_000_000_000),
    costPrice: clampNumber(Math.round(item.costPrice), 0, 1_000_000_000),
    subtotal: clampNumber(Math.round(item.sellPrice * item.qty), 0, 1_000_000_000),
  }));

  const itemCount = sanitizedItems.reduce((sum, it) => sum + it.qty, 0);
  const subtotal = sanitizedItems.reduce((sum, it) => sum + it.subtotal, 0);
  const discount = clampNumber(Math.round(payload.discount), 0, subtotal);
  const total = Math.max(0, subtotal - discount);
  const totalCost = sanitizedItems.reduce((sum, it) => sum + it.costPrice * it.qty, 0);
  const profit = total - totalCost;
  const amountPaid = clampNumber(
    Math.round(payload.paymentMethod === 'Tunai' ? payload.amountPaid : total),
    total,
    1_000_000_000
  );
  const changeAmount = Math.max(0, amountPaid - total);
  const promoCode = payload.appliedCampaign
    ? sanitizePromoCode(payload.appliedCampaign.promoCode)
    : '';

  const batch = writeBatch(db);

  // 1. Create Transaction
  const txDocData = {
    ownerId,
    receiptNo,
    customerId: payload.customer ? payload.customer.id : '',
    customerName: payload.customer
      ? clampString(payload.customer.name, LIMITS.NAME_MAX)
      : 'Pelanggan Umum',
    items: sanitizedItems,
    itemCount,
    subtotal,
    discount,
    promoCode,
    total,
    totalCost,
    profit,
    paymentMethod: payload.paymentMethod,
    amountPaid,
    changeAmount,
    status: 'Selesai' as const,
    saleDate,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  batch.set(doc(db, 'transactions', txId), txDocData);

  // 2. Decrement product stocks & append immutable stockLogs
  for (const item of sanitizedItems) {
    const product = payload.productsMap.get(item.productId);
    if (!product) continue;
    const nextStock = Math.max(0, product.stock - item.qty);
    batch.update(doc(db, 'products', product.id), {
      stock: nextStock,
      updatedAt: serverTimestamp(),
    });
    const logId = generateDocId('log');
    batch.set(doc(db, 'stockLogs', logId), {
      ownerId,
      productId: product.id,
      productName: item.name,
      type: 'penjualan',
      delta: -item.qty,
      stockAfter: nextStock,
      note: `Penjualan ${receiptNo}`,
      createdAt: serverTimestamp(),
    });
  }

  // 3. Update Customer CRM stats & loyalty points
  if (payload.customer) {
    const nextSpent = clampNumber(payload.customer.totalSpent + total, 0, 10_000_000_000);
    const nextOrders = clampNumber(payload.customer.totalOrders + 1, 0, 1_000_000);
    const earnedPoints = Math.floor(total / 10_000);
    const nextPoints = clampNumber(payload.customer.loyaltyPoints + earnedPoints, 0, 10_000_000);
    let nextSegment: CustomerSegment = payload.customer.segment;
    if (nextSegment !== 'Reseller') {
      if (nextSpent >= 1_500_000 || nextOrders >= 10) nextSegment = 'VIP';
      else if (nextSpent >= 400_000 || nextOrders >= 3) nextSegment = 'Setia';
    }
    batch.update(doc(db, 'customers', payload.customer.id), {
      totalSpent: nextSpent,
      totalOrders: nextOrders,
      loyaltyPoints: nextPoints,
      lastOrderAt: saleDate,
      segment: nextSegment,
      updatedAt: serverTimestamp(),
    });
  }

  // 4. Increment Campaign Redemptions if active voucher used
  if (payload.appliedCampaign && payload.appliedCampaign.status === 'Aktif') {
    batch.update(doc(db, 'campaigns', payload.appliedCampaign.id), {
      redemptions: payload.appliedCampaign.redemptions + 1,
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
    return {
      id: txId,
      ...txDocData,
      createdAt: undefined,
      updatedAt: undefined,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `transactions/${txId}`);
  }
}

export async function voidTransaction(
  ownerId: string,
  tx: Transaction,
  productsMap: Map<string, Product>
): Promise<void> {
  if (tx.status === 'Dibatalkan') return;
  const path = `transactions/${tx.id}`;
  const batch = writeBatch(db);

  batch.update(doc(db, 'transactions', tx.id), {
    status: 'Dibatalkan',
    updatedAt: serverTimestamp(),
  });

  for (const item of tx.items) {
    const product = productsMap.get(item.productId);
    if (!product) continue;
    const restoredStock = clampNumber(product.stock + item.qty, 0, 1_000_000);
    batch.update(doc(db, 'products', product.id), {
      stock: restoredStock,
      updatedAt: serverTimestamp(),
    });
    const logId = generateDocId('log');
    batch.set(doc(db, 'stockLogs', logId), {
      ownerId,
      productId: product.id,
      productName: item.name,
      type: 'koreksi',
      delta: item.qty,
      stockAfter: restoredStock,
      note: `Pengembalian stok batal ${tx.receiptNo}`,
      createdAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// === Sample UMKM Data Seeder ===
export async function seedSampleUmkmData(ownerId: string, ownerDisplayName: string): Promise<void> {
  const storeName = ownerDisplayName
    ? `Kedai & Galeri ${ownerDisplayName.split(' ')[0]}`
    : 'Galeri Nusantara UMKM';

  const storeRef = doc(db, 'stores', ownerId);
  const existingStore = await getDoc(storeRef);

  const batch1 = writeBatch(db);

  if (!existingStore.exists()) {
    batch1.set(storeRef, {
      ownerId,
      storeName: clampString(storeName, LIMITS.STORE_NAME_MAX),
      category: 'Kuliner & F&B',
      phone: '081288901234',
      address: 'Jl. Merdeka Raya No. 48, Bandung, Jawa Barat',
      tagline: 'UMKM Naik Kelas, Bisnis Makin Cuan',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const sampleProducts: Array<Omit<Product, 'ownerId' | 'createdAt' | 'updatedAt'>> = [
    {
      id: generateDocId('prod'),
      sku: 'KOP-001',
      name: 'Es Kopi Susu Gula Aren 250ml',
      category: 'Minuman',
      costPrice: 11500,
      sellPrice: 24000,
      stock: 42,
      minStock: 10,
      unit: 'botol',
      imageUrl: '/images/prod-kopi-susu.jpg',
      isActive: true,
    },
    {
      id: generateDocId('prod'),
      sku: 'SNK-002',
      name: 'Keripik Tempe Renyah Daun Jeruk',
      category: 'Kuliner',
      costPrice: 9500,
      sellPrice: 22000,
      stock: 28,
      minStock: 12,
      unit: 'pouch',
      imageUrl: '/images/prod-keripik-tempe.jpg',
      isActive: true,
    },
    {
      id: generateDocId('prod'),
      sku: 'BTK-003',
      name: 'Syal Batik Cap Parang Navy',
      category: 'Fashion',
      costPrice: 68000,
      sellPrice: 135000,
      stock: 9,
      minStock: 10,
      unit: 'pcs',
      imageUrl: '/images/prod-batik-scarf.jpg',
      isActive: true,
    },
    {
      id: generateDocId('prod'),
      sku: 'KOP-004',
      name: 'Biji Kopi Arabika Gayo 200g',
      category: 'Minuman',
      costPrice: 48000,
      sellPrice: 89000,
      stock: 18,
      minStock: 8,
      unit: 'pack',
      imageUrl: '/images/prod-kopi-susu.jpg',
      isActive: true,
    },
    {
      id: generateDocId('prod'),
      sku: 'KUL-005',
      name: 'Sambal Roa Manado Botol 150g',
      category: 'Kuliner',
      costPrice: 19000,
      sellPrice: 38000,
      stock: 5,
      minStock: 8,
      unit: 'botol',
      imageUrl: '/images/prod-keripik-tempe.jpg',
      isActive: true,
    },
    {
      id: generateDocId('prod'),
      sku: 'KRY-006',
      name: 'Totebag Tenun Nusantara',
      category: 'Kriya',
      costPrice: 55000,
      sellPrice: 115000,
      stock: 14,
      minStock: 5,
      unit: 'pcs',
      imageUrl: '/images/prod-batik-scarf.jpg',
      isActive: true,
    },
  ];

  for (const p of sampleProducts) {
    batch1.set(doc(db, 'products', p.id), {
      ownerId,
      sku: p.sku,
      name: p.name,
      category: p.category,
      costPrice: p.costPrice,
      sellPrice: p.sellPrice,
      stock: p.stock,
      minStock: p.minStock,
      unit: p.unit,
      imageUrl: p.imageUrl,
      isActive: p.isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const sampleCustomers: Array<Omit<Customer, 'ownerId' | 'createdAt' | 'updatedAt'>> = [
    {
      id: generateDocId('cust'),
      name: 'Rina Kusuma',
      phone: '081234112233',
      email: 'rina.kusuma@contoh.id',
      segment: 'VIP',
      notes: 'Suka Es Kopi Susu Gula Aren & langganan hampers kantor.',
      totalSpent: 1840000,
      totalOrders: 12,
      loyaltyPoints: 184,
      lastOrderAt: todayISO(0),
    },
    {
      id: generateDocId('cust'),
      name: 'Hendra Wijaya',
      phone: '081355667788',
      email: 'hendra.w@contoh.id',
      segment: 'Reseller',
      notes: 'Reseller Keripik Tempe & Sambal Roa area Cimahi.',
      totalSpent: 2450000,
      totalOrders: 8,
      loyaltyPoints: 245,
      lastOrderAt: todayISO(-1),
    },
    {
      id: generateDocId('cust'),
      name: 'Siti Nurhaliza',
      phone: '085699001122',
      email: 'siti.nur@contoh.id',
      segment: 'Setia',
      notes: 'Sering membeli produk batik dan kriya untuk oleh-oleh.',
      totalSpent: 640000,
      totalOrders: 5,
      loyaltyPoints: 64,
      lastOrderAt: todayISO(-2),
    },
    {
      id: generateDocId('cust'),
      name: 'Dimas Pratama',
      phone: '082144556677',
      email: '',
      segment: 'Reguler',
      notes: 'Pelanggan kedai akhir pekan.',
      totalSpent: 142000,
      totalOrders: 2,
      loyaltyPoints: 14,
      lastOrderAt: todayISO(-3),
    },
  ];

  for (const c of sampleCustomers) {
    batch1.set(doc(db, 'customers', c.id), {
      ownerId,
      name: c.name,
      phone: c.phone,
      email: c.email,
      segment: c.segment,
      notes: c.notes,
      totalSpent: c.totalSpent,
      totalOrders: c.totalOrders,
      loyaltyPoints: c.loyaltyPoints,
      lastOrderAt: c.lastOrderAt,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const sampleCampaigns = [
    {
      id: generateDocId('cmp'),
      title: 'Promo Gajian UMKM Naik Kelas',
      channel: 'WhatsApp' as CampaignChannel,
      targetSegment: 'Semua' as CampaignTargetSegment,
      promoCode: 'KADIN15',
      discountPercent: 15,
      message:
        'Halo Sahabat! Nikmati potongan 15% untuk semua produk lokal pilihan kami. Gunakan kode KADIN15 saat belanja di kasir atau via WhatsApp minggu ini.',
      status: 'Aktif' as CampaignStatus,
      startDate: todayISO(-3),
      endDate: todayISO(14),
      targetCount: 4,
      redemptions: 6,
    },
    {
      id: generateDocId('cmp'),
      title: 'Apresiasi Pelanggan VIP & Setia',
      channel: 'Voucher Kasir' as CampaignChannel,
      targetSegment: 'VIP' as CampaignTargetSegment,
      promoCode: 'VIPCUAN20',
      discountPercent: 20,
      message:
        'Terima kasih telah setia mendukung produk UMKM lokal! Khusus pelanggan VIP, dapatkan diskon 20% dengan kode VIPCUAN20 untuk pembelian berikutnya.',
      status: 'Aktif' as CampaignStatus,
      startDate: todayISO(-5),
      endDate: todayISO(25),
      targetCount: 2,
      redemptions: 3,
    },
    {
      id: generateDocId('cmp'),
      title: 'Katalog Bundling Kopi & Snack Sore',
      channel: 'Instagram' as CampaignChannel,
      targetSegment: 'Reguler' as CampaignTargetSegment,
      promoCode: 'NGOPI10',
      discountPercent: 10,
      message:
        'Teman kerja makin nikmat dengan paket Es Kopi Susu Gula Aren + Keripik Tempe Daun Jeruk. Pakai kode NGOPI10 hemat 10%!',
      status: 'Draft' as CampaignStatus,
      startDate: todayISO(1),
      endDate: todayISO(20),
      targetCount: 4,
      redemptions: 0,
    },
  ];

  for (const cmp of sampleCampaigns) {
    batch1.set(doc(db, 'campaigns', cmp.id), {
      ownerId,
      title: cmp.title,
      channel: cmp.channel,
      targetSegment: cmp.targetSegment,
      promoCode: cmp.promoCode,
      discountPercent: cmp.discountPercent,
      message: cmp.message,
      status: cmp.status,
      startDate: cmp.startDate,
      endDate: cmp.endDate,
      targetCount: cmp.targetCount,
      redemptions: cmp.redemptions,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch1.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed_batch_1');
  }

  const batch2 = writeBatch(db);

  const txSeeds: Array<{
    daysAgo: number;
    custIdx: number | null;
    payment: PaymentMethod;
    promoCode: string;
    discountPct: number;
    lines: Array<{ prodIdx: number; qty: number }>;
  }> = [
    { daysAgo: 6, custIdx: 0, payment: 'QRIS', promoCode: '', discountPct: 0, lines: [{ prodIdx: 0, qty: 3 }, { prodIdx: 1, qty: 2 }] },
    { daysAgo: 5, custIdx: 1, payment: 'Transfer Bank', promoCode: '', discountPct: 0, lines: [{ prodIdx: 1, qty: 8 }, { prodIdx: 4, qty: 4 }] },
    { daysAgo: 4, custIdx: 2, payment: 'QRIS', promoCode: 'KADIN15', discountPct: 15, lines: [{ prodIdx: 2, qty: 2 }, { prodIdx: 5, qty: 1 }] },
    { daysAgo: 3, custIdx: 3, payment: 'Tunai', promoCode: '', discountPct: 0, lines: [{ prodIdx: 0, qty: 2 }, { prodIdx: 3, qty: 1 }] },
    { daysAgo: 2, custIdx: null, payment: 'E-Wallet', promoCode: '', discountPct: 0, lines: [{ prodIdx: 0, qty: 4 }, { prodIdx: 1, qty: 3 }] },
    { daysAgo: 1, custIdx: 1, payment: 'Transfer Bank', promoCode: 'KADIN15', discountPct: 15, lines: [{ prodIdx: 3, qty: 3 }, { prodIdx: 4, qty: 5 }] },
    { daysAgo: 0, custIdx: 0, payment: 'QRIS', promoCode: 'VIPCUAN20', discountPct: 20, lines: [{ prodIdx: 2, qty: 1 }, { prodIdx: 0, qty: 4 }, { prodIdx: 1, qty: 2 }] },
    { daysAgo: 0, custIdx: null, payment: 'Tunai', promoCode: '', discountPct: 0, lines: [{ prodIdx: 0, qty: 2 }, { prodIdx: 5, qty: 1 }] },
  ];

  txSeeds.forEach((seed, idx) => {
    const txId = generateDocId('tx');
    const items: TransactionItem[] = seed.lines.map((line) => {
      const p = sampleProducts[line.prodIdx];
      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        qty: line.qty,
        sellPrice: p.sellPrice,
        costPrice: p.costPrice,
        subtotal: p.sellPrice * line.qty,
      };
    });
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const discount = Math.round((subtotal * seed.discountPct) / 100);
    const total = subtotal - discount;
    const totalCost = items.reduce((s, i) => s + i.costPrice * i.qty, 0);
    const profit = total - totalCost;
    const itemCount = items.reduce((s, i) => s + i.qty, 0);
    const cust = seed.custIdx !== null ? sampleCustomers[seed.custIdx] : null;
    const dateStr = todayISO(-seed.daysAgo);

    batch2.set(doc(db, 'transactions', txId), {
      ownerId,
      receiptNo: `KD-${dateStr.replace(/-/g, '')}-${1010 + idx}`,
      customerId: cust ? cust.id : '',
      customerName: cust ? cust.name : 'Pelanggan Umum',
      items,
      itemCount,
      subtotal,
      discount,
      promoCode: seed.promoCode,
      total,
      totalCost,
      profit,
      paymentMethod: seed.payment,
      amountPaid: total,
      changeAmount: 0,
      status: 'Selesai',
      saleDate: dateStr,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  for (const p of sampleProducts.slice(0, 3)) {
    const logId = generateDocId('log');
    batch2.set(doc(db, 'stockLogs', logId), {
      ownerId,
      productId: p.id,
      productName: p.name,
      type: 'masuk',
      delta: p.stock,
      stockAfter: p.stock,
      note: 'Stok awal katalog contoh SI DIKA',
      createdAt: serverTimestamp(),
    });
  }

  try {
    await batch2.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed_batch_2');
  }
}
