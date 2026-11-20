# KADIN DIGI — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Strict Tenant Ownership**: Every document in `stores`, `products`, `stockLogs`, `customers`, `campaigns`, and `transactions` MUST belong to the authenticated, email-verified user (`request.auth.uid == ownerId` and `request.auth.token.email_verified == true`).
2. **PII Isolation**: `stores` (phone, address) and `customers` (name, phone, email) contain Personally Identifiable Information and MUST NOT be readable or listable by any user other than `ownerId`.
3. **Immutable Ownership & Timestamps**: `ownerId` and `createdAt` can NEVER be altered after creation. `createdAt` on create and `updatedAt` on create/update MUST equal `request.time`.
4. **Relational Integrity**: Every `stockLogs` creation MUST reference an existing `products/{productId}` document owned by `request.auth.uid`.
5. **Terminal State Locking**: A `Transaction` with `status == 'Dibatalkan'` is terminal and cannot be modified further. A `Campaign` with `status == 'Selesai'` cannot be reopened or edited.
6. **Immutable Audit Trail**: `stockLogs` documents are append-only and CANNOT be updated or deleted via client SDK.
7. **Bounded Arrays & Strict String Lengths**: `transactions.items` is bounded to `1 <= size <= 50` with element validation; every string field enforces explicit `.size()` boundaries.
8. **Zero Shadow Fields**: Every create enforces `keys().hasAll(...) && keys().hasOnly(...)`; every update uses action-based `affectedKeys().hasOnly(...)` wrapped by `isValid[Entity](incoming())`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Identity Spoofing on Product Create**: `{ "ownerId": "victim_uid", "sku": "SKU-1", ... }` by `attacker_uid`.
2. **Unverified Email Write**: Valid product payload where `request.auth.token.email_verified == false`.
3. **Shadow Field Injection on Customer Create**: Valid customer payload + `"isAdmin": true`.
4. **PII Cross-Tenant Read**: `attacker_uid` calling `get` or `list` on `/customers/{victimCustomerId}` without matching `ownerId`.
5. **ID Poisoning**: Creating `/products/` with a 200-character or special-character document ID (`"../admin$poison"`).
6. **Orphan StockLog Write**: Creating `/stockLogs/{id}` referencing non-existent `productId: "nonexistent_prod"`.
7. **Timestamp Forgery**: Creating a product with client-provided `createdAt: "2020-01-01"` instead of `request.time`.
8. **Immutable Field Tampering**: Updating a product to change `ownerId` or `createdAt`.
9. **Terminal State Re-opening**: Updating a `transactions` document whose existing `status == "Dibatalkan"` back to `"Selesai"`.
10. **Value Poisoning on Update**: Updating a product's `sellPrice` to a string `"999999"` or negative number `-5000`.
11. **Unbounded Array / Resource Exhaustion**: Creating a transaction with `items.size() == 51` or empty `items: []`.
12. **Audit Log Tampering**: Attempting `update` or `delete` on `/stockLogs/{logId}`.
