/**
 * KADIN DIGI — Firestore Security Rules TDD Specification ("Dirty Dozen")
 * Verifies that all 12 adversarial payloads fail against hardened firestore.rules.
 */
export interface DirtyDozenCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
  payload: Record<string, unknown>;
}

export const DIRTY_DOZEN_PAYLOADS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Product Create',
    collection: 'products',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { ownerId: 'victim_uid', sku: 'KOP-01', name: 'Kopi Susu', category: 'Minuman' },
  },
  {
    id: 2,
    name: 'Unverified Email Write',
    collection: 'products',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { email_verified: false, ownerId: 'attacker_uid', sku: 'KOP-02' },
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Customer Create',
    collection: 'customers',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { ownerId: 'user_1', name: 'Budi', phone: '08123456789', isAdmin: true },
  },
  {
    id: 4,
    name: 'PII Cross-Tenant Read on Customers',
    collection: 'customers',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
    payload: { requesterUid: 'attacker_uid', targetOwnerId: 'victim_uid' },
  },
  {
    id: 5,
    name: 'ID Poisoning with Invalid Path Variable',
    collection: 'products',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { docId: '../admin$poison_'.repeat(15) },
  },
  {
    id: 6,
    name: 'Orphan StockLog Referencing Missing Product',
    collection: 'stockLogs',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { ownerId: 'user_1', productId: 'nonexistent_product_id', type: 'masuk', delta: 10 },
  },
  {
    id: 7,
    name: 'Client-Forged Timestamp on Create',
    collection: 'products',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { ownerId: 'user_1', createdAt: '2020-01-01T00:00:00Z' },
  },
  {
    id: 8,
    name: 'Immutable OwnerId Tampering on Update',
    collection: 'products',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { ownerId: 'other_user_uid', sellPrice: 25000 },
  },
  {
    id: 9,
    name: 'Terminal State Re-opening on Voided Transaction',
    collection: 'transactions',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { existingStatus: 'Dibatalkan', incomingStatus: 'Selesai' },
  },
  {
    id: 10,
    name: 'Value Poisoning with Invalid SellPrice Type',
    collection: 'products',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { sellPrice: -50000, stock: 'invalid_number' },
  },
  {
    id: 11,
    name: 'Unbounded Array Exhaustion on Transaction Items',
    collection: 'transactions',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { itemsCount: 51 },
  },
  {
    id: 12,
    name: 'Audit Log Deletion Attempt on StockLogs',
    collection: 'stockLogs',
    operation: 'delete',
    expected: 'PERMISSION_DENIED',
    payload: { logId: 'log_123' },
  },
];
