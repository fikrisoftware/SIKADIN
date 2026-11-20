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
  | 'analytics';

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
