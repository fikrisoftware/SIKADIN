# Dokumentasi Environment Variables (ENV) — SI DIKA

Dokumen ini berisi daftar lengkap variabel lingkungan (*environment variables*) yang digunakan pada aplikasi **SI DIKA (Sistem Kasir dan Inventori)**, mencakup kategori **Wajib (Required)** dan **Opsional (Optional)** beserta fungsi dan nilai bawaannya.

---

## 1. Ringkasan Kategori ENV

| Nama Variabel | Kategori | Sumber / Digunakan Di | Nilai Default / Fallback |
|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | **Wajib**\* | `lib/firebase.ts` (Client) | `firebase-applet-config.json` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | **Wajib**\* | `lib/firebase.ts` (Client) | `firebase-applet-config.json` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | **Wajib**\* | `lib/firebase.ts` (Client) | `firebase-applet-config.json` |
| `NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID` | **Wajib**\* | `lib/firebase.ts` (Client) | `firebase-applet-config.json` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | **Wajib**\* | `lib/firebase.ts` (Client) | `firebase-applet-config.json` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | **Wajib**\* | `lib/firebase.ts` (Client) | `firebase-applet-config.json` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | **Wajib**\* | `lib/firebase.ts` (Client) | `firebase-applet-config.json` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Opsional | `lib/firebase.ts` (Client) | `""` (Kosong) |
| `GEMINI_API_KEY` | Opsional | Server / API AI Studio | `""` |
| `APP_URL` | Opsional | Server / Metadata URL | `http://localhost:3000` |
| `DISABLE_HMR` | Opsional | `next.config.ts` (Webpack) | `false` |

> \*) **Catatan Penting Konfigurasi Firebase:**
> Aplikasi telah dilengkapi sistem *dual-mode fallback*. Jika variabel `NEXT_PUBLIC_FIREBASE_*` tidak didefinisikan dalam `.env.local` atau environment hosting, sistem akan membaca file `firebase-applet-config.json`. Namun, untuk deployment produksi (Vercel, Firebase App Hosting, Cloud Run, Docker), variabel `NEXT_PUBLIC_FIREBASE_*` **wajib** diset agar tidak bergantung pada file statis JSON.

---

## 2. Penjelasan Rinci Setiap Variabel

### A. Konfigurasi Firebase (Autentikasi & Database)

Prefix `NEXT_PUBLIC_` wajib disertakan agar variabel dapat diakses di sisi browser/client Next.js.

1. **`NEXT_PUBLIC_FIREBASE_API_KEY`**
   - **Kategori**: Wajib
   - **Fungsi**: Kunci autentikasi publik untuk berkomunikasi dengan Google Identity Toolkit dan Firebase Services.
   - **Contoh**: `AIzaSyD_knA8Aymw9TWtRqh5XMoCoec5pZCTIdk`

2. **`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`**
   - **Kategori**: Wajib
   - **Fungsi**: Domain autentikasi OAuth Google. Domain ini menangani redirect popup Google Sign-In.
   - **Contoh**: `gen-lang-client-0295838347.firebaseapp.com`

3. **`NEXT_PUBLIC_FIREBASE_PROJECT_ID`**
   - **Kategori**: Wajib
   - **Fungsi**: ID proyek Google Cloud / Firebase tempat database dan layanan bernaung.
   - **Contoh**: `gen-lang-client-0295838347`

4. **`NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID`**
   - **Kategori**: Wajib
   - **Fungsi**: Nama Database Firestore instance (khususnya jika menggunakan Named Database seperti pada Google Cloud / AI Studio, bukan database `(default)`).
   - **Contoh**: `ai-studio-494725bc-baac-4b50-9d5e-e13b284ec48f`

5. **`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`**
   - **Kategori**: Wajib
   - **Fungsi**: Bucket Google Cloud Storage untuk penyimpanan aset upload seperti foto produk atau struk.
   - **Contoh**: `gen-lang-client-0295838347.firebasestorage.app`

6. **`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`**
   - **Kategori**: Wajib
   - **Fungsi**: ID pengirim untuk Firebase Cloud Messaging (FCM).
   - **Contoh**: `556290225530`

7. **`NEXT_PUBLIC_FIREBASE_APP_ID`**
   - **Kategori**: Wajib
   - **Fungsi**: Identitas unik aplikasi web pada Firebase Console.
   - **Contoh**: `1:556290225530:web:18772abf82027ee65c92c3`

8. **`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`**
   - **Kategori**: Opsional
   - **Fungsi**: ID pelacakan Google Analytics 4 (GA4).
   - **Contoh**: `G-XXXXXXXXXX` (boleh dikosongkan jika tidak memakai Analytics).

---

### B. Fitur Kecerdasan Buatan (Google Gemini AI)

1. **`GEMINI_API_KEY`**
   - **Kategori**: Opsional (Wajib jika menggunakan integrasi Gemini API)
   - **Fungsi**: Kunci API Google Gemini untuk pemrosesan teks promosi, analisis bisnis, atau asisten cerdas melalui paket `@google/genai`.
   - **Cara Mendapatkan**: Diperoleh secara gratis melalui [Google AI Studio](https://aistudio.google.com/app/apikey).
   - **Keamanan**: Disimpan di server (jangan gunakan prefix `NEXT_PUBLIC_`).

---

### C. Konfigurasi Aplikasi & Deployment

1. **`APP_URL`**
   - **Kategori**: Opsional
   - **Fungsi**: URL utama tempat aplikasi diakses publik. Digunakan untuk meta tag OpenGraph, pembuat link otomatis, dan OAuth redirect callback.
   - **Nilai Bawaan**: `http://localhost:3000`
   - **Contoh Production**: `https://sidika.kadin.id` atau `https://sikadin.web.app`

2. **`DISABLE_HMR`**
   - **Kategori**: Opsional
   - **Fungsi**: Menonaktifkan file watcher Hot Module Replacement Webpack jika bernilai `'true'`.
   - **Kegunaan**: Mencegah browser flickering saat file sedang diedit secara otomatis oleh automated agent atau saat proses running di container AI Studio.
   - **Nilai Bawaan**: `false`

---

## 3. Cara Penggunaan di Komputer Lokal (Local Development)

1. Salin file template `.env.example` ke `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Isi nilai yang sesuai pada `.env.local`.
3. Jalankan aplikasi:
   ```bash
   npm run dev
   ```
4. File `.env.local` sudah masuk ke `.gitignore` sehingga aman dari kebocoran kredensial ke Git repository.
