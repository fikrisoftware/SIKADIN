import type { Timestamp } from 'firebase/firestore';

export const STORE_CATEGORIES = [
  'Kuliner & F&B',
  'Fashion & Batik',
  'Kriya & Kerajinan',
  'Sembako & Ritel',
  'Jasa & Layanan',
  'Lainnya',
] as const;

export type StoreCategory = (typeof STORE_CATEGORIES)[number];

export const PRODUCT_CATEGORIES = [
  'Kuliner',
  'Minuman',
  'Fashion',
  'Kriya',
  'Sembako',
  'Jasa',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const CUSTOMER_SEGMENTS = ['Reguler', 'Setia', 'VIP', 'Reseller'] as const;
export type CustomerSegment = (typeof CUSTOMER_SEGMENTS)[number];

export const CAMPAIGN_CHANNELS = [
  'WhatsApp',
  'Instagram',
  'TikTok',
  'Katalog Digital',
  'Voucher Kasir',
] as const;
export type CampaignChannel = (typeof CAMPAIGN_CHANNELS)[number];

export const CAMPAIGN_TARGET_SEGMENTS = ['Semua', ...CUSTOMER_SEGMENTS] as const;
export type CampaignTargetSegment = (typeof CAMPAIGN_TARGET_SEGMENTS)[number];

export const CAMPAIGN_STATUSES = ['Draft', 'Aktif', 'Selesai'] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const PAYMENT_METHODS = ['Tunai', 'QRIS', 'Transfer Bank', 'E-Wallet'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const STOCK_LOG_TYPES = ['masuk', 'keluar', 'penjualan', 'koreksi'] as const;
export type StockLogType = (typeof STOCK_LOG_TYPES)[number];

export type TransactionStatus = 'Selesai' | 'Dibatalkan';

export interface StoreProfile {
  ownerId: string;
  storeName: string;
  category: StoreCategory;
  phone: string;
  address: string;
  tagline: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Product {
  id: string;
  ownerId: string;
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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StockLog {
  id: string;
  ownerId: string;
  productId: string;
  productName: string;
  type: StockLogType;
  delta: number;
  stockAfter: number;
  note: string;
  createdAt?: Timestamp;
}

export interface Customer {
  id: string;
  ownerId: string;
  name: string;
  phone: string;
  email: string;
  segment: CustomerSegment;
  notes: string;
  totalSpent: number;
  totalOrders: number;
  loyaltyPoints: number;
  lastOrderAt: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Campaign {
  id: string;
  ownerId: string;
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
  redemptions: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface TransactionItem {
  productId: string;
  sku: string;
  name: string;
  category: ProductCategory;
  qty: number;
  sellPrice: number;
  costPrice: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  ownerId: string;
  receiptNo: string;
  customerId: string;
  customerName: string;
  items: TransactionItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  promoCode: string;
  total: number;
  totalCost: number;
  profit: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeAmount: number;
  status: TransactionStatus;
  saleDate: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type ActiveTab =
  | 'pos'
  | 'inventory'
  | 'customers'
  | 'marketing'
  | 'analytics'
  | 'hq'
  | 'access';

export const USER_ROLES = [
  'kasir',
  'pemilik',
  'admin_pusat',
  'super_admin_pusat',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ACCOUNT_STATUSES = ['Aktif', 'Nonaktif'] as const;
export type UserAccountStatus = (typeof USER_ACCOUNT_STATUSES)[number];

export const ROLE_INVITE_STATUSES = ['Menunggu', 'Diterima', 'Dicabut'] as const;
export type RoleInviteStatus = (typeof ROLE_INVITE_STATUSES)[number];

export const BOOTSTRAP_SUPER_ADMIN_EMAIL = 'recehanfikri@gmail.com';

export interface UserRoleProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  workspaceOwnerId: string;
  storeName: string;
  status: UserAccountStatus;
  assignedBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RoleInvite {
  id: string;
  email: string;
  role: UserRole;
  workspaceOwnerId: string;
  storeName: string;
  status: RoleInviteStatus;
  invitedByUid: string;
  invitedByName: string;
  note: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RoleAuditLog {
  id: string;
  actorUid: string;
  actorName: string;
  actorRole: UserRole;
  targetEmail: string;
  targetRole: UserRole;
  workspaceOwnerId: string;
  action: string;
  note: string;
  createdAt?: Timestamp;
}

export interface RolePermissions {
  allowedTabs: ActiveTab[];
  canVoidTransaction: boolean;
  canManageInventory: boolean;
  canEditCustomers: boolean;
  canDeleteCustomers: boolean;
  canManageMarketing: boolean;
  canViewAnalytics: boolean;
  canEditStoreProfile: boolean;
  canSeedStoreData: boolean;
  canManageTeam: boolean;
  assignableRoles: UserRole[];
  canAccessHqDashboard: boolean;
  canSwitchWorkspace: boolean;
  canViewAuditLogs: boolean;
}

export const ROLE_META: Record<
  UserRole,
  {
    id: UserRole;
    label: string;
    shortLabel: string;
    scope: string;
    description: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  kasir: {
    id: 'kasir',
    label: 'Kasir',
    shortLabel: 'Kasir',
    scope: 'Operasional Meja Kasir (1 Toko)',
    description:
      'Memproses transaksi penjualan di kasir, menggunakan kode voucher, mencetak struk, dan mendaftarkan pelanggan baru. Tidak dapat membatalkan transaksi, mengubah HPP/stok, atau melihat laporan laba.',
    badgeBg: 'bg-sky-50 border-sky-200',
    badgeText: 'text-sky-800',
  },
  pemilik: {
    id: 'pemilik',
    label: 'Pemilik Usaha',
    shortLabel: 'Pemilik',
    scope: 'Penuh 1 Usaha UMKM',
    description:
      'Mengelola penuh kasir, pembatalan transaksi, katalog & HPP inventori, database pelanggan, kampanye pemasaran, analisis laba, profil toko, serta mengundang dan menonaktifkan staf Kasir.',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-800',
  },
  admin_pusat: {
    id: 'admin_pusat',
    label: 'Admin Kantor Pusat',
    shortLabel: 'Admin Pusat',
    scope: 'Monitoring & Pembinaan Seluruh UMKM KADIN',
    description:
      'Memantau kinerja seluruh UMKM binaan di dashboard Kantor Pusat KADIN, berpindah ruang kerja toko untuk pendampingan, serta mengelola peran Kasir dan Pemilik Usaha.',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-800',
  },
  super_admin_pusat: {
    id: 'super_admin_pusat',
    label: 'Super Admin Kantor Pusat',
    shortLabel: 'Super Admin',
    scope: 'Otoritas Tertinggi Ekosistem KADIN DIGI',
    description:
      'Kontrol penuh seluruh sistem KADIN DIGI termasuk pengangkatan dan pencabutan Admin Kantor Pusat & Super Admin, pengawasan lintas toko UMKM, audit log akses, dan simulasi tampilan peran.',
    badgeBg: 'bg-orange-50 border-orange-200',
    badgeText: 'text-kadin-orange',
  },
};

export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'kasir':
      return {
        allowedTabs: ['pos', 'customers'],
        canVoidTransaction: false,
        canManageInventory: false,
        canEditCustomers: false,
        canDeleteCustomers: false,
        canManageMarketing: false,
        canViewAnalytics: false,
        canEditStoreProfile: false,
        canSeedStoreData: false,
        canManageTeam: false,
        assignableRoles: [],
        canAccessHqDashboard: false,
        canSwitchWorkspace: false,
        canViewAuditLogs: false,
      };
    case 'pemilik':
      return {
        allowedTabs: ['pos', 'inventory', 'customers', 'marketing', 'analytics', 'access'],
        canVoidTransaction: true,
        canManageInventory: true,
        canEditCustomers: true,
        canDeleteCustomers: true,
        canManageMarketing: true,
        canViewAnalytics: true,
        canEditStoreProfile: true,
        canSeedStoreData: true,
        canManageTeam: true,
        assignableRoles: ['kasir'],
        canAccessHqDashboard: false,
        canSwitchWorkspace: false,
        canViewAuditLogs: true,
      };
    case 'admin_pusat':
      return {
        allowedTabs: ['hq', 'pos', 'inventory', 'customers', 'marketing', 'analytics', 'access'],
        canVoidTransaction: true,
        canManageInventory: true,
        canEditCustomers: true,
        canDeleteCustomers: true,
        canManageMarketing: true,
        canViewAnalytics: true,
        canEditStoreProfile: true,
        canSeedStoreData: true,
        canManageTeam: true,
        assignableRoles: ['kasir', 'pemilik'],
        canAccessHqDashboard: true,
        canSwitchWorkspace: true,
        canViewAuditLogs: true,
      };
    case 'super_admin_pusat':
      return {
        allowedTabs: ['hq', 'pos', 'inventory', 'customers', 'marketing', 'analytics', 'access'],
        canVoidTransaction: true,
        canManageInventory: true,
        canEditCustomers: true,
        canDeleteCustomers: true,
        canManageMarketing: true,
        canViewAnalytics: true,
        canEditStoreProfile: true,
        canSeedStoreData: true,
        canManageTeam: true,
        assignableRoles: ['kasir', 'pemilik', 'admin_pusat', 'super_admin_pusat'],
        canAccessHqDashboard: true,
        canSwitchWorkspace: true,
        canViewAuditLogs: true,
      };
  }
}

export function emailToInviteId(email: string): string {
  const normalized = email.trim().toLowerCase();
  const safe = normalized
    .replace(/@/g, '_at_')
    .replace(/\./g, '_dot_')
    .replace(/[^a-z0-9_\-]/g, '_');
  return `inv_${safe}`.slice(0, 120);
}

// Blueprint-synchronized validation boundaries
export const LIMITS = {
  STORE_NAME_MAX: 120,
  PHONE_MIN: 6,
  PHONE_MAX: 25,
  ADDRESS_MAX: 250,
  TAGLINE_MAX: 120,
  SKU_MAX: 40,
  SKU_REGEX: /^[a-zA-Z0-9_\-.]+$/,
  NAME_MAX: 120,
  UNIT_MAX: 20,
  IMAGE_URL_MAX: 300,
  NOTE_MAX: 240,
  CUSTOMER_NOTES_MAX: 300,
  EMAIL_MAX: 120,
  PROMO_CODE_MAX: 24,
  PROMO_CODE_REGEX: /^[A-Z0-9_\-]*$/,
  CAMPAIGN_MSG_MAX: 1000,
  MAX_TX_ITEMS: 50,
  ACTION_MAX: 80,
} as const;

export function formatRupiah(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatCompactRupiah(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1)} M`;
  if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toFixed(1)} Jt`;
  if (abs >= 1_000) return `${sign}Rp ${Math.round(abs / 1_000)} Rb`;
  return formatRupiah(amount);
}

export function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateID(isoDate: string): string {
  if (!isoDate) return '-';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatTimestampID(ts?: Timestamp): string {
  if (!ts || typeof ts.toDate !== 'function') return 'Baru saja';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ts.toDate());
}

export function normalizeWaNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('62')) return digits;
  return `62${digits}`;
}

export function generateDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_\-]/g, '');
}

export function generateReceiptNo(): string {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `KD-${ymd}-${seq}`;
}
