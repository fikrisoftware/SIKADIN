# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## KADIN DIGI — Si KADI (Sistem Kasir dan Inventori)
**Tagline:** *UMKM Naik Kelas, Bisnis Makin Cuan*  
**Bekerja Sama Dengan:** Kamar Dagang dan Industri Indonesia (KADIN Indonesia)  
**Versi Dokumen:** 1.0  
**Tanggal:** 19 November 2026  

---

## 1. Ringkasan Eksekutif & Latar Belakang Strategis

Usaha Mikro, Kecil, dan Menengah (UMKM) merupakan tulang punggung perekonomian Indonesia dengan kontribusi lebih dari 60% terhadap Produk Domestik Bruto (PDB) nasional dan menyerap sekitar 97% tenaga kerja. Meski demikian, mayoritas pelaku UMKM—mulai dari warung ritel, kedai kuliner, pengrajin kriya, hingga produsen fashion lokal—masih menghadapi empat hambatan operasional utama:

1. **Pencatatan Manual & Kebocoran Kas**: Transaksi harian masih dicatat di buku tulis sehingga pemilik usaha kesulitan menghitung omzet bersih, HPP, dan laba kotor secara akurat.
2. **Ketidakakuratan Stok (Inventory Blindspot)**: Barang terlaris kerap kehabisan mendadak tanpa peringatan, sementara modal tertahan pada barang lambat terjual.
3. **Data Pelanggan Tidak Terkelola**: Pelanggan setia dan reseller tidak terdokumentasi sehingga sulit dilakukan pemasaran berulang (*repeat order*).
4. **Minimnya Pemasaran Digital Terukur**: Promosi masih dilakukan tanpa kode voucher terukur, sehingga dampak promo terhadap omzet tidak diketahui.

**KADIN DIGI** hadir sebagai inisiatif platform digitalisasi kasir dan manajemen bisnis terpadu untuk pelaku UMKM yang bekerja sama dengan ekosistem **Kamar Dagang dan Industri Indonesia (KADIN Indonesia)**. Menghadirkan **Si KADI (Sistem Kasir dan Inventori)**, aplikasi ini menyatukan **Sistem Kasir (POS), Manajemen Inventori, Database Pelanggan (CRM), Pemasaran Digital, dan Analisis Penjualan & Kinerja** dalam satu aplikasi web modern berbasis cloud yang ringan, cepat, dan mudah digunakan di komputer, tablet, maupun ponsel.

---

## 2. Identitas Program

| Atribut | Spesifikasi |
| :--- | :--- |
| **Nama Program** | KADIN DIGI |
| **Nama Ikon / Maskot** | Si KADI — Sistem Kasir dan Inventori |
| **Mitra Kerja Sama** | Kamar Dagang dan Industri Indonesia (KADIN Indonesia) |
| **Tagline Resmi** | UMKM Naik Kelas, Bisnis Makin Cuan |
| **Identitas Visual** | Biru Gelap KADIN (`#051633` / `#08234D`) & Oranye DIGI (`#EA580C` / `#F97316`) |
| **Target Ekosistem** | Pelaku UMKM binaan KADIN Pusat, KADIN Provinsi, dan KADIN Kabupaten/Kota |

---

## 3. Tujuan Produk & Indikator Keberhasilan (KPI)

### 3.1 Tujuan Utama
- Mempercepat transformasi pencatatan transaksi kasir UMKM dari manual ke digital dalam waktu kurang dari 5 menit sejak pendaftaran.
- Memberikan visibilitas real-time terhadap margin laba, nilai aset stok, dan profil pelanggan terbaik.
- Meningkatkan transaksi berulang (*repeat order*) melalui kampanye promosi WhatsApp dan voucher diskon yang terintegrasi langsung ke kasir.
- Menghasilkan jejak pembukuan digital yang rapi sebagai fondasi UMKM menuju akses pembiayaan formal (KUR / perbankan).

### 3.2 Key Performance Indicators (KPI)
| Metrik | Target Pilot (3 Bulan) | Target Nasional (12 Bulan) |
| :--- | :--- | :--- |
| Jumlah UMKM Aktif Terdaftar | 1.000 Merchant (3 Provinsi Pilot) | 50.000 Merchant (38 Provinsi) |
| Aktivasi Hari Pertama (Menambah Produk / Seed Data) | ≥ 75% | ≥ 80% |
| Transaksi POS Tercatat per Merchant / Bulan | ≥ 150 transaksi | ≥ 250 transaksi |
| Pengurangan Selisih Stok (*Stock Discrepancy*) | Turun ≥ 40% | Turun ≥ 60% |
| Tingkat Penukaran Voucher Pemasaran Digital | ≥ 12% | ≥ 18% |
| Retensi Pengguna Aktif Bulanan (MAU/Registered) | ≥ 65% | ≥ 72% |

---

## 4. Persona Pengguna

### Persona A — Pemilik Warung / Kedai Mikro (Ibu Sari, 38 tahun)
- **Konteks**: Mengelola kedai kopi susu, makanan ringan, dan kebutuhan harian dengan 1–2 karyawan.
- **Kebutuhan**: Kasir cepat di tablet/HP, langsung tahu kembalian tunai atau pembayaran QRIS, bisa kirim struk ke WhatsApp pelanggan, dan mendapat peringatan jika stok hampir habis.

### Persona B — Pelaku UMKM Fashion / Kriya Berkembang (Pak Hendra, 44 tahun)
- **Konteks**: Memproduksi batik dan kerajinan tangan dengan segmen pembeli eceran, VIP, dan reseller.
- **Kebutuhan**: Memantau HPP & margin laba per produk, mencatat riwayat belanja reseller, membagikan promo voucher diskon 15–20% ke WhatsApp, dan mengunduh laporan penjualan bulanan dalam format CSV.

### Persona C — Pengurus / Pembina UMKM KADIN Daerah
- **Konteks**: Melakukan pendampingan literasi digital dan kurasi UMKM naik kelas.
- **Kebutuhan**: Membutuhkan platform siap pakai dengan fitur onboarding contoh data (*1-Click Demo Seed*) yang memudahkan pelatihan langsung di lapangan.

---

## 5. Spesifikasi Kebutuhan Fungsional (Functional Requirements)

### 5.1 Autentikasi & Profil Usaha
- **FR-01 (Login Google 1 Klik)**: Pengguna masuk menggunakan akun Google terverifikasi (`Google Sign-In`) tanpa perlu menghafal kata sandi baru.
- **FR-02 (Pengaturan Profil Usaha)**: Pengguna dapat mengisi dan mengubah Nama Usaha, Bidang Usaha (`Kuliner & F&B`, `Fashion & Batik`, `Kriya & Kerajinan`, `Sembako & Ritel`, `Jasa & Layanan`, `Lainnya`), Nomor WhatsApp, Alamat Gerai, dan Tagline Struk.
- **FR-03 (Onboarding Data Contoh UMKM)**: Jika akun usaha masih kosong, sistem menyediakan tombol **Isi Data Contoh UMKM** untuk mengisi katalog produk, pelanggan, voucher promo, dan histori transaksi 7 hari secara otomatis agar pelatihan berjalan instan.

### 5.2 Modul 1 — Sistem Kasir (POS) & Riwayat Transaksi
- **FR-04 (Katalog Kasir Real-Time)**: Menampilkan produk aktif dengan foto, SKU, kategori, harga jual, dan sisa stok; mendukung pencarian cepat nama/SKU (termasuk tekan `Enter` untuk tambah instan) dan filter kategori.
- **FR-05 (Keranjang & Kalkulasi Otomatis)**: Mendukung penambahan/pengurangan kuantitas dengan validasi batas stok tersedia, pemilihan pelanggan CRM, serta perhitungan subtotal, diskon, dan total tagihan.
- **FR-06 (Integrasi Voucher Promo & Diskon Manual)**: Kasir dapat memasukkan kode voucher dari kampanye aktif (misal `KADIN15`) untuk memotong persentase otomatis atau mengisi diskon nominal manual.
- **FR-07 (Multi-Metode Pembayaran)**: Mendukung `QRIS`, `Tunai` (dengan tombol nominal cepat dan kalkulator kembalian otomatis), `Transfer Bank`, dan `E-Wallet`.
- **FR-08 (Checkout Atomik)**: Satu klik *Selesaikan Pembayaran* secara bersamaan menyimpan transaksi, mengurangi stok produk terkait, mencatat buku mutasi stok, memperbarui total belanja & poin loyalitas pelanggan (1 poin per Rp 10.000 + kenaikan segmen otomatis ke `Setia` / `VIP`), serta menambah hitungan penukaran voucher.
- **FR-09 (Struk Digital & Cetak)**: Menampilkan struk resmi KADIN DIGI dengan opsi **Cetak Struk** (printer thermal/browser print) dan **Salin Teks WA** untuk dikirim ke pelanggan.
- **FR-10 (Riwayat & Pembatalan Transaksi)**: Menyediakan daftar transaksi lengkap; transaksi berstatus `Selesai` dapat dibatalkan (`Dibatalkan`) dan sistem secara atomik mengembalikan stok ke inventori serta mencatat koreksi mutasi.

### 5.3 Modul 2 — Manajemen Inventori & Mutasi Stok
- **FR-11 (Ringkasan Aset Stok)**: Menampilkan Total SKU & unit tersedia, Nilai Aset Inventori berbasis HPP, jumlah produk Stok Menipis, dan jumlah produk Stok Habis.
- **FR-12 (CRUD Produk)**: Tambah, ubah, aktif/nonaktifkan di kasir, dan hapus produk dengan field SKU, Nama, Kategori, HPP, Harga Jual, Margin %, Stok, Stok Minimum, Satuan, dan Foto Katalog.
- **FR-13 (Penyesuaian Stok & Buku Mutasi)**: Modal khusus untuk mencatat Stok Masuk (`+`) dan Stok Keluar (`-`) beserta catatan keterangan; seluruh mutasi masuk ke tabel **Buku Mutasi Stok** yang bersifat permanen (*immutable audit log*).

### 5.4 Modul 3 — Database Pelanggan (CRM)
- **FR-14 (Direktori & Segmentasi Pelanggan)**: Pencarian dan filter pelanggan berdasarkan segmen (`Reguler`, `Setia`, `VIP`, `Reseller`) lengkap dengan metrik jumlah transaksi, total belanja, dan poin loyalitas.
- **FR-15 (Panel Detail & Riwayat Belanja)**: Mengklik baris pelanggan membuka panel profil, preferensi catatan, riwayat struk belanja, serta tombol **Salin Pesan** dan **Buka WA** dengan templat sapaan personal.

### 5.5 Modul 4 — Pemasaran Digital & Studio Broadcast
- **FR-16 (Manajemen Kampanye & Voucher)**: CRUD kampanye pemasaran dengan pilihan kanal (`WhatsApp`, `Instagram`, `TikTok`, `Katalog Digital`, `Voucher Kasir`), target segmen, kode voucher, persentase diskon (0–90%), periode berlaku, isi pesan, dan status (`Draft`, `Aktif`, `Selesai`).
- **FR-17 (Studio Broadcast & Katalog Promo)**: Menggabungkan kampanye terpilih dengan sorotan produk dari inventori untuk menghasilkan teks promosi siap pakai serta daftar kirim cepat WhatsApp ke seluruh kontak pada segmen target.

### 5.6 Modul 5 — Analisis Penjualan & Kinerja
- **FR-18 (Filter Periode & Metrik KPI)**: Filter `Hari Ini`, `7 Hari`, `30 Hari`, dan `Semua` yang menghitung real-time Total Omzet, Estimasi Laba Kotor & Margin %, Rata-rata Keranjang (AOV), dan Total Produk Terjual.
- **FR-19 (Visualisasi Grafik Interaktif)**: Grafik Area Tren Omzet vs Laba Kotor Harian, Grafik Batang Top 6 Produk Terlaris, Komposisi Metode Pembayaran, dan Penjualan per Kategori.
- **FR-20 (Daftar Aksi & Ekspor CSV)**: Menampilkan 5 Pelanggan Terbaik, daftar Prioritas Restok Inventori, serta tombol **Unduh Laporan CSV** untuk kebutuhan pembukuan lanjutan atau pelaporan ke pembina KADIN.

---

## 6. Kebutuhan Non-Fungsional (Non-Functional Requirements)

1. **Performa & Responsivitas**: Waktu interaksi rutin antarmuka ≤ 200ms; mendukung layar Desktop (1440px), Tablet kasir, dan Smartphone (dengan sidebar responsif).
2. **Keamanan & Privasi Data (UU PDP)**: Seluruh data pelanggan (nomor telepon, email) dan data transaksi usaha terisolasi ketat per `ownerId` menggunakan Firestore Security Rules berbasis prinsip *Zero-Trust*.
3. **Keandalan & Konsistensi Data**: Operasi transaksi kasir dan pembatalan menggunakan *Atomic Batch Write* agar angka penjualan dan sisa stok tidak pernah tidak sinkron.
4. **Aksesibilitas & Keterbacaan**: Kontras teks memenuhi standar WCAG AA, seluruh nominal rupiah dan tabel menggunakan format angka sejajar (*tabular numerals*), serta status tidak bergantung pada warna semata.

---

## 7. Peta Jalan Pengembangan (Product Roadmap)

| Fase | Linimasa | Fokus Utama |
| :--- | :--- | :--- |
| **Fase 1 (MVP — Saat Ini)** | Q1 | Peluncuran KADIN DIGI Web POS, Inventori & Mutasi Stok, CRM Pelanggan, Voucher & Broadcast WA, Analisis Kinerja + CSV, Pilot 3 KADIN Provinsi. |
| **Fase 2 (Scale & Integrasi)** | Q2–Q3 | Integrasi QRIS Dinamis (auto-reconcile), Manajemen Multi-Cabang & Multi-Kasir (RBAC Staf), Katalog Publik *Online Ordering*, Integrasi WhatsApp Business API, Dukungan Offline PWA. |
| **Fase 3 (Ekosistem Nasional)** | Q4+ | Dashboard Agregat Pembinaan KADIN Daerah (teranonimisasi), Modul Pembukuan Laba-Rugi Standar SAK EMKM, *Alternative Credit Scoring* untuk pengajuan KUR Perbankan, dan Integrasi B2B Supplier/Distributor KADIN. |

---

## 8. Risiko & Strategi Mitigasi

| Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- |
| Literasi digital pemilik warung beragam | Rendahnya adopsi awal | Antarmuka sederhana berbahasa Indonesia natural, ikon ramah **Si KADI**, serta fitur data contoh 1 klik untuk pelatihan langsung oleh KADIN Daerah. |
| Koneksi internet gerai tidak stabil | Hambatan saat ramai pembeli | Penggunaan SDK Firestore yang ringan, pemulihan koneksi otomatis, serta rencana ekspansi mode offline PWA di Fase 2. |
| Keamanan data pelanggan UMKM | Risiko kebocoran PII | Isolasi ketat berbasis `ownerId` + verifikasi email Google pada sisi server rules dan audit rutin aturan keamanan. |
