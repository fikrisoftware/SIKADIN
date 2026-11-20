# TECHNICAL SPECIFICATION DOCUMENT (TSD)
## KADIN DIGI — Sistem Kasir, Inventori, CRM, Pemasaran & Analitik UMKM
**Disusun untuk:** Tim Teknis & Komite Transformasi Digital KADIN Indonesia  
**Versi Dokumen:** 1.0  
**Tanggal:** 19 November 2026  

---

## 1. Arsitektur Sistem Tingkat Tinggi

**KADIN DIGI** dibangun dengan arsitektur *Cloud-Native Serverless* modern yang memisahkan antarmuka web responsif dari lapisan persistensi data terkelola secara real-time:

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Klien Web (Desktop / Tablet / HP)                │
│     Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4    │
│                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ Kasir (POS)  │ │  Inventori   │ │ Pelanggan    │ │ Pemasaran & │ │
│  │ & Struk      │ │ & Mutasi     │ │ (CRM)        │ │ Analitik    │ │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬──────┘ │
│         └────────────────┴────────────────┴────────────────┘        │
│                          │                                          │
│              AuthContext (onSnapshot Real-Time Sync)                │
│              FirestoreService (Defensive Validation & Batching)     │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ HTTPS / WebChannel (TLS 1.3)
          ┌────────────────┴────────────────┐
          ▼                                 ▼
┌────────────────────────┐      ┌──────────────────────────────────────┐
│ Firebase Authentication│      │ Cloud Firestore (Enterprise Edition) │
│ Google OAuth 2.0 Popup │      │ Zero-Trust Security Rules (8 Pillars)│
│ Verified Email Claims  │      │ Koleksi: stores, products, stockLogs,│
└────────────────────────┘      │ customers, campaigns, transactions   │
                                └──────────────────────────────────────┘
```

---

## 2. Stack Teknologi & Dependensi Inti

| Lapisan | Teknologi | Peran & Justifikasi Teknis |
| :--- | :--- | :--- |
| **Framework Frontend & SSR** | Next.js `15.4.9` (App Router, `output: 'standalone'`) | Performa tinggi, bundling optimal, siap containerization di Google Cloud Run. |
| **UI Library** | React `19.2.1` + TypeScript `5.9.3` (strict mode) | Keamanan tipe end-to-end dari model Firestore hingga komponen antarmuka. |
| **Styling & Design Tokens** | Tailwind CSS `v4.1.11` | Utility-first dengan tema warna resmi KADIN (`navy-950`, `navy-900`, `kadin-orange`). |
| **Visualisasi Data** | Recharts + `tabular-nums` (`JetBrains Mono`) | Grafik responsif (`AreaChart`, `BarChart`) dengan presisi angka keuangan vertikal. |
| **Ikonografi** | Lucide React `0.553.0` | Ikon vektor ringan dan konsisten. |
| **Autentikasi** | Firebase Auth (`signInWithPopup`, `GoogleAuthProvider`) | Autentikasi tanpa password dengan jaminan `email_verified == true`. |
| **Database Real-Time** | Cloud Firestore (Named Database) | Persistensi dokumen NoSQL real-time dengan dukungan transaksi atomik (`writeBatch`). |
| **Audit Keamanan Rules** | `@firebase/eslint-plugin-security-rules` + ESLint 9 | Validasi statis otomatis terhadap aturan keamanan Firestore sebelum deployment. |

---

## 3. Desain Skema Database Cloud Firestore

Seluruh data menggunakan strategi *multi-tenant isolation* berbasis atribut `ownerId` yang cocok dengan `request.auth.uid`.

### 3.1 Ringkasan Koleksi

| Koleksi | Path | Sifat Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| **StoreProfile** | `/stores/{ownerId}` | Owner-only (`get/create/update`, `list: false`, `delete: false`) | Profil usaha UMKM (mengandung PII: telepon, alamat). |
| **Product** | `/products/{productId}` | Owner-scoped CRUD | Katalog barang, HPP, harga jual, stok, dan batas stok minimum. |
| **StockLog** | `/stockLogs/{logId}` | Owner-scoped Append-only (`update/delete: false`) | Buku mutasi stok permanen (*immutable audit trail*). |
| **Customer** | `/customers/{customerId}` | Owner-scoped CRUD (PII terisolasi) | Data pelanggan, segmen, total belanja, dan poin loyalitas. |
| **Campaign** | `/campaigns/{campaignId}` | Owner-scoped CRUD (Terminal Lock pada `Selesai`) | Kampanye pemasaran digital, kode voucher, dan hitungan penukaran. |
| **Transaction** | `/transactions/{transactionId}` | Owner-scoped Create/Read + Void Only (`delete: false`) | Dokumen transaksi POS lengkap dengan rincian item, HPP, dan laba kotor. |

### 3.2 Batasan Validasi Data (Synchronized Blueprint Constraints)
Setiap mutasi klien melewati lapisan sanitasi di `lib/firestore-service.ts` yang disinkronkan secara verbatim dengan `firebase-blueprint.json` dan `firestore.rules`:
- **Format ID Dokumen**: `^[a-zA-Z0-9_\-]+$` dengan panjang `1..128` karakter.
- **Format SKU**: `^[a-zA-Z0-9_\-\.]+$` (`1..40` karakter).
- **Format Kode Promo**: `^[A-Z0-9_\-]*$` (`0..24` karakter), diskon dibatasi `0..90%`.
- **Format Tanggal**: `YYYY-MM-DD` (`^[0-9]{4}-[0-9]{2}-[0-9]{2}$`) untuk pengelompokan laporan harian, berdampingan dengan `createdAt` dan `updatedAt` menggunakan `serverTimestamp()` (`request.time`).
- **Batasan Array Item Transaksi**: Minimal `1` dan maksimal `50` baris produk per transaksi (`items.size() >= 1 && items.size() <= 50`) dengan validasi struktur peta (`isValidTransactionItem`) guna mencegah penyalahgunaan ukuran dokumen (limit 1MB Firestore).

---

## 4. Transaksi Atomik & Integritas Operasional

### 4.1 Alur Atomic Checkout (`checkoutTransaction`)
Untuk mencegah ketidaksesuaian antara laporan omzet dan jumlah stok gudang, proses checkout dieksekusi dalam satu `writeBatch(db)`:
1. **Create `/transactions/{txId}`**: Menyimpan rincian item, subtotal, diskon, total, total HPP (`totalCost`), laba kotor (`profit`), metode pembayaran, nominal dibayar, dan kembalian dengan status awal wajib `'Selesai'`.
2. **Update `/products/{productId}` & Create `/stockLogs/{logId}`**: Untuk setiap item di keranjang, mengurangi `stock` dan menambahkan baris log mutasi bertipe `'penjualan'`.
3. **Update `/customers/{customerId}` (jika dipilih)**: Menambahkan `totalSpent`, `totalOrders`, `loyaltyPoints` (`Math.floor(total / 10000)`), memperbarui `lastOrderAt`, dan menaikkan segmen secara otomatis (`Setia` jika belanja ≥ Rp 400.000 atau ≥ 3 transaksi; `VIP` jika belanja ≥ Rp 1.500.000 atau ≥ 10 transaksi; kecuali segmen `Reseller`).
4. **Update `/campaigns/{campaignId}` (jika voucher aktif digunakan)**: Menambah `redemptions` tepat `+1` (`incoming().redemptions == existing().redemptions + 1`).

### 4.2 Alur Pembatalan Transaksi (`voidTransaction`)
Pembatalan transaksi dieksekusi secara atomik melalui `writeBatch(db)`:
1. Mengubah status transaksi dari `'Selesai'` menjadi `'Dibatalkan'` (status terminal — tidak dapat diubah kembali).
2. Mengembalikan jumlah kuantitas setiap item ke `/products/{productId}` dan mencatat log audit bertipe `'koreksi'`.

---

## 5. Arsitektur Keamanan Zero-Trust (8 Pilar Firestore Security Rules)

File `firestore.rules` menerapkan prinsip *Defense-in-Depth* dan lolos uji statis `@firebase/eslint-plugin-security-rules`:

1. **Global Default Deny**: `match /{document=**} { allow read, write: if false; }` di tingkat paling atas.
2. **Verifikasi Identitas Ketat**: Seluruh akses memerlukan `request.auth != null && request.auth.token.email_verified == true`.
3. **Validation Blueprints (`isValid[Entity]`)**: Setiap operasi `create` dan `update` wajib melewati fungsi validasi tipe, panjang string, enum, dan kepemilikan (`data.ownerId == request.auth.uid`).
4. **Anti-Shadow-Field & Action-Based Updates**: Operasi `create` memeriksa `keys().hasAll(...) && keys().hasOnly(...)`; operasi `update` membatasi field berubah via `affectedKeys().hasOnly([...])` per jenis aksi.
5. **Path Variable Hardening**: Memeriksa `isValidId(...)` pada setiap operasi dokumen tunggal (`get`, `create`, `update`, `delete`) untuk mencegah *ID poisoning*.
6. **PII Isolation**: Koleksi `stores` (`allow list: false`) dan `customers` hanya dapat diakses oleh pemilik dokumen (`existing().ownerId == request.auth.uid`).
7. **Temporal Integrity & Immutability**: `createdAt == request.time` pada `create`, `updatedAt == request.time` pada `create/update`, serta `ownerId` dan `createdAt` tidak dapat diubah setelah dibuat.
8. **Secure List Queries & Cost Optimization**: Semua aturan `allow list` mengevaluasi `existing().ownerId == request.auth.uid` langsung tanpa pemanggilan `get()`/`exists()` di dalam `list`, mencegah *O(n) read cost explosion* dan memastikan klien tidak bisa mengambil data tenant lain.

---

## 6. Sinkronisasi Real-Time & Penanganan Kesalahan

- **Inisialisasi Terproteksi**: `AuthProvider` memanggil `testConnection()` via `getDocFromServer` saat aplikasi aktif untuk mendeteksi kegagalan konfigurasi offline sejak dini.
- **Listener Terjaga**: Enam listener `onSnapshot` hanya dipasang setelah `authReady && user`, masing-masing dengan klausa `where('ownerId', '==', uid)`.
- **Error Handling Terstruktur**: Seluruh blok `try/catch` dan callback error `onSnapshot` memanggil `handleFirestoreError(error, operationType, path)` yang mengemas konteks `FirestoreErrorInfo` (UID, email, status verifikasi, jenis operasi, dan path) untuk ditangkap oleh komponen `ErrorBoundary`.
- **Deteksi Kuota Database**: `ErrorBoundary` mendeteksi pesan *Quota Exceeded* dan menampilkan panduan pemulihan yang jelas bagi pengguna.

---

## 7. Struktur Direktori Aplikasi

```
/
├── app/
│   ├── globals.css              # Tema warna KADIN DIGI, tipografi, & gaya cetak struk
│   ├── layout.tsx               # Root layout, metadata SEO/OG, Google Fonts, & favicon Si KADI
│   └── page.tsx                 # Entry point: ErrorBoundary + AuthProvider + Routing state
├── components/
│   ├── AuthContext.tsx          # Manajemen Firebase Auth & real-time Firestore snapshots
│   ├── DashboardShell.tsx       # Sidebar biru KADIN, header kontekstual, & onboarding seeder
│   ├── PosModule.tsx            # Modul Kasir POS, keranjang, voucher, struk digital, & riwayat
│   ├── InventoryModule.tsx      # Modul Inventori, CRUD produk, & buku mutasi stok
│   ├── CustomersModule.tsx      # Modul Database Pelanggan CRM & WhatsApp follow-up
│   ├── MarketingModule.tsx      # Modul Kampanye Pemasaran Digital & Studio Broadcast
│   ├── AnalyticsModule.tsx      # Modul Analisis Penjualan, Recharts, & Ekspor CSV
│   ├── StoreProfileModal.tsx    # Pengaturan Profil Usaha UMKM
│   ├── SiKadiBrand.tsx          # Logo Si KADI & Wordmark dua warna KADIN DIGI
│   ├── WelcomeScreen.tsx        # Halaman beranda & login Google resmi KADIN DIGI
│   └── ErrorBoundary.tsx        # Penanganan error global & kuota database
├── lib/
│   ├── firebase.ts              # Inisialisasi Firebase SDK & handleFirestoreError
│   ├── types.ts                 # Interface domain, batas validasi blueprint, & formatter IDR
│   └── firestore-service.ts     # Operasi CRUD, atomic writeBatch checkout/void, & data seeder
├── public/
│   ├── images/                  # Logo Si KADI & foto katalog produk
│   └── downloads/               # PRD, TSD, Deck PPTX, & Video Promosi KADIN Indonesia
├── firebase-blueprint.json      # Skema IR entitas & koleksi Firestore
├── firestore.rules              # Aturan keamanan produksi (deployed)
└── security_spec.md             # Spesifikasi keamanan Phase 0 & 12 skenario uji (Dirty Dozen)
```

---

## 8. Panduan Deployment & Skalabilitas Nasional

1. **Build & Verifikasi**: Jalankan `npm run lint` (termasuk pengecekan `firestore.rules`) dan `npm run build` (Next.js standalone).
2. **Deploy Aplikasi**: Containerize hasil `.next/standalone` ke Google Cloud Run pada region `asia-southeast2` (Jakarta) untuk latensi rendah bagi pengguna seluruh Indonesia.
3. **Skalabilitas Database**: Untuk tahap pilot dapat memanfaatkan Firestore Free Tier; untuk rollout nasional KADIN (>10.000 UMKM aktif) disarankan beralih ke paket **Firebase Blaze (Pay-as-you-go)** dengan monitoring kuota baca/tulis, budget alert GCP, serta penjadwalan ekspor otomatis Firestore ke Google Cloud Storage untuk cadangan data harian.
