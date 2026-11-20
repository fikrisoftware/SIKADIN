import path from 'node:path';
import PptxGenJS from 'pptxgenjs';

const ROOT = process.cwd();
const OUT_FILE = path.join(ROOT, 'public/downloads/Presentasi_KADIN_DIGI_KADIN_Indonesia.pptx');
const POSTER_IMG = path.join(ROOT, 'public/assets/aistudio/image_0a4c7de4.png');
const LOGO_IMG = path.join(ROOT, 'public/images/si-kadi-logo.jpg');
const PROD_KOPI = path.join(ROOT, 'public/images/prod-kopi-susu.jpg');
const PROD_BATIK = path.join(ROOT, 'public/images/prod-batik-scarf.jpg');
const PROD_TEMPE = path.join(ROOT, 'public/images/prod-keripik-tempe.jpg');

const C = {
  navyDark: '051633',
  navy: '08234D',
  navyMid: '0D326B',
  orange: 'EA580C',
  orangeBright: 'F97316',
  orangeLight: 'FB923C',
  cyan: '22D3EE',
  bgLight: 'F3F6FB',
  white: 'FFFFFF',
  slate900: '0F172A',
  slate600: '475569',
  slate400: '94A3B8',
  border: 'CBD5E1',
  emerald: '059669',
};

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in
pptx.author = 'Tim Pengembang KADIN DIGI';
pptx.company = 'KADIN DIGI — Si KADI';
pptx.subject = 'Presentasi Platform Kasir & Manajemen UMKM untuk KADIN Indonesia';
pptx.title = 'KADIN DIGI — UMKM Naik Kelas, Bisnis Makin Cuan';

function addHeaderFooter(slide, slideNum, sectionLabel, dark = false) {
  if (!dark) {
    slide.background = { color: C.bgLight };
    // Top thin brand accent strip
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 0.08,
      fill: { color: C.navyDark },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 9.8,
      y: 0,
      w: 3.533,
      h: 0.08,
      fill: { color: C.orangeBright },
      line: { type: 'none' },
    });

    // Header brand + section
    slide.addImage({ path: LOGO_IMG, x: 0.55, y: 0.28, w: 0.44, h: 0.44 });
    slide.addText(
      [
        { text: 'KADIN ', options: { color: C.navy, bold: true } },
        { text: 'DIGI', options: { color: C.orange, bold: true } },
        { text: `   |   ${sectionLabel}`, options: { color: C.slate600, bold: false } },
      ],
      { x: 1.1, y: 0.34, w: 9.5, h: 0.35, fontSize: 12, fontFace: 'Arial' }
    );

    // Footer bar
    slide.addShape(pptx.ShapeType.line, {
      x: 0.55,
      y: 7.0,
      w: 12.233,
      h: 0,
      line: { color: C.border, width: 0.75 },
    });
    slide.addText('UMKM Naik Kelas  |  Bisnis Makin Cuan  —  Presentasi untuk KADIN Indonesia', {
      x: 0.55,
      y: 7.07,
      w: 10,
      h: 0.3,
      fontSize: 9.5,
      color: C.slate600,
      fontFace: 'Arial',
    });
    slide.addText(`${slideNum} / 10`, {
      x: 11.7,
      y: 7.07,
      w: 1.08,
      h: 0.3,
      fontSize: 9.5,
      bold: true,
      color: C.navy,
      align: 'right',
      fontFace: 'Arial',
    });
  } else {
    slide.background = { color: C.navyDark };
    slide.addText(`${slideNum} / 10`, {
      x: 11.7,
      y: 7.07,
      w: 1.08,
      h: 0.3,
      fontSize: 9.5,
      color: '93C5FD',
      align: 'right',
      fontFace: 'Arial',
    });
  }
}

// ================= SLIDE 1: COVER =================
{
  const s = pptx.addSlide();
  addHeaderFooter(s, 1, '', true);

  // Subtle decorative accent stripe on left edge
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.16,
    h: 7.5,
    fill: { color: C.orangeBright },
    line: { type: 'none' },
  });

  // Top label
  s.addText('PRESENTASI INISIATIF DIGITALISASI UMKM  ·  KADIN INDONESIA', {
    x: 0.75,
    y: 0.85,
    w: 7.2,
    h: 0.35,
    fontSize: 11,
    bold: true,
    color: C.cyan,
    fontFace: 'Arial',
    charSpacing: 1.5,
  });

  // Main Title: KADIN DIGI
  s.addText(
    [
      { text: 'KADIN ', options: { color: C.white, bold: true } },
      { text: 'DIGI', options: { color: C.orangeBright, bold: true } },
    ],
    { x: 0.75, y: 1.35, w: 7.2, h: 1.05, fontSize: 54, fontFace: 'Arial' }
  );

  // Mascot subtitle
  s.addText('Bersama Si KADI — Robot Sahabat UMKM', {
    x: 0.75,
    y: 2.45,
    w: 7.0,
    h: 0.45,
    fontSize: 20,
    bold: true,
    color: 'DBEAFE',
    fontFace: 'Arial',
  });

  // Description
  s.addText(
    'Platform Terpadu Sistem Kasir (POS), Manajemen Inventori, Database Pelanggan (CRM), Pemasaran Digital, dan Analisis Penjualan & Kinerja untuk Mempercepat Transformasi UMKM Indonesia.',
    {
      x: 0.75,
      y: 3.1,
      w: 6.7,
      h: 1.35,
      fontSize: 14.5,
      color: 'CBD5E1',
      fontFace: 'Arial',
      lineSpacingMultiple: 1.35,
    }
  );

  // Tagline Banner Box
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.75,
    y: 4.8,
    w: 6.45,
    h: 0.72,
    fill: { color: C.navy },
    line: { color: C.orangeBright, width: 1.2 },
    rectRadius: 0.08,
  });
  s.addText(
    [
      { text: 'UMKM Naik Kelas', options: { color: C.white, bold: true } },
      { text: '   |   ', options: { color: '64748B' } },
      { text: 'Bisnis Makin Cuan', options: { color: C.orangeLight, bold: true } },
    ],
    { x: 0.95, y: 4.92, w: 6.1, h: 0.48, fontSize: 18, fontFace: 'Arial' }
  );

  // Presenter metadata
  s.addText('Diajukan kepada: Kamar Dagang dan Industri Indonesia (KADIN Indonesia)\nNovember 2026', {
    x: 0.75,
    y: 6.1,
    w: 6.8,
    h: 0.75,
    fontSize: 11.5,
    color: '94A3B8',
    fontFace: 'Arial',
    lineSpacingMultiple: 1.3,
  });

  // Official Reference Poster Image on Right
  s.addShape(pptx.ShapeType.roundRect, {
    x: 7.75,
    y: 0.95,
    w: 4.95,
    h: 4.95,
    fill: { color: C.navy },
    line: { color: '1E3A8A', width: 1.5 },
    rectRadius: 0.14,
  });
  s.addImage({
    path: POSTER_IMG,
    x: 7.85,
    y: 1.05,
    w: 4.75,
    h: 4.75,
  });
}

// ================= SLIDE 2: LATAR BELAKANG & TANTANGAN UMKM =================
{
  const s = pptx.addSlide();
  addHeaderFooter(s, 2, 'Latar Belakang Strategis');

  s.addText('Mengapa Digitalisasi Operasional UMKM Mendesak?', {
    x: 0.55,
    y: 0.95,
    w: 12.2,
    h: 0.55,
    fontSize: 26,
    bold: true,
    color: C.navy,
    fontFace: 'Arial',
  });

  // 3 Macro Stat Cards
  const stats = [
    { val: '65+ Juta', lbl: 'Pelaku UMKM Nasional', sub: 'Tulang punggung ekonomi rakyat' },
    { val: '> 60%', lbl: 'Kontribusi terhadap PDB', sub: 'Penggerak utama ekonomi Indonesia' },
    { val: '97%', lbl: 'Penyerapan Tenaga Kerja', sub: 'Sektor formal & informal nasional' },
  ];
  stats.forEach((st, idx) => {
    const x = 0.55 + idx * 4.18;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 1.65,
      w: 3.88,
      h: 1.32,
      fill: { color: C.navyDark },
      line: { type: 'none' },
      rectRadius: 0.08,
    });
    s.addText(st.val, {
      x: x + 0.25,
      y: 1.78,
      w: 3.4,
      h: 0.5,
      fontSize: 28,
      bold: true,
      color: C.orangeLight,
      fontFace: 'Arial',
    });
    s.addText(st.lbl, {
      x: x + 0.25,
      y: 2.3,
      w: 3.4,
      h: 0.28,
      fontSize: 12.5,
      bold: true,
      color: C.white,
      fontFace: 'Arial',
    });
    s.addText(st.sub, {
      x: x + 0.25,
      y: 2.58,
      w: 3.4,
      h: 0.26,
      fontSize: 10,
      color: '93C5FD',
      fontFace: 'Arial',
    });
  });

  // 4 Challenges Grid
  s.addText('Empat Hambatan Operasional Harian di Lapangan', {
    x: 0.55,
    y: 3.22,
    w: 12,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: C.navy,
    fontFace: 'Arial',
  });

  const pains = [
    {
      no: '01',
      title: 'Pencatatan Manual & Kebocoran Kas',
      desc: 'Nota tulis tangan rawan salah hitung, menyulitkan rekap omzet harian, HPP, dan pemisahan uang usaha vs pribadi.',
    },
    {
      no: '02',
      title: 'Inventory Blindspot (Stok Tak Terpantau)',
      desc: 'Produk paling laris sering mendadak kosong tanpa peringatan, sementara modal tertahan di barang lambat terjual.',
    },
    {
      no: '03',
      title: 'Database Pelanggan Hilang',
      desc: 'Kontak pembeli loyal dan reseller tidak tercatat, membuat UMKM kehilangan peluang repeat order bernilai tinggi.',
    },
    {
      no: '04',
      title: 'Promosi Digital Tidak Terukur',
      desc: 'Diskon dan broadcast dilakukan tanpa kode voucher terintegrasi sehingga efektivitas promo sulit dievaluasi.',
    },
  ];

  pains.forEach((p, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.55 + col * 6.22;
    const y = 3.72 + row * 1.55;

    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 5.95,
      h: 1.35,
      fill: { color: C.white },
      line: { color: C.border, width: 0.8 },
      rectRadius: 0.08,
    });
    s.addText(p.no, {
      x: x + 0.22,
      y: y + 0.2,
      w: 0.6,
      h: 0.4,
      fontSize: 18,
      bold: true,
      color: C.orange,
      fontFace: 'Arial',
    });
    s.addText(p.title, {
      x: x + 0.85,
      y: y + 0.2,
      w: 4.9,
      h: 0.35,
      fontSize: 14,
      bold: true,
      color: C.navy,
      fontFace: 'Arial',
    });
    s.addText(p.desc, {
      x: x + 0.85,
      y: y + 0.58,
      w: 4.9,
      h: 0.65,
      fontSize: 11.5,
      color: C.slate600,
      fontFace: 'Arial',
      lineSpacingMultiple: 1.2,
    });
  });
}

// ================= SLIDE 3: SOLUSI KADIN DIGI & SI KADI =================
{
  const s = pptx.addSlide();
  addHeaderFooter(s, 3, 'Solusi & Identitas Program');

  s.addText('KADIN DIGI: Satu Meja Kerja Digital untuk UMKM Naik Kelas', {
    x: 0.55,
    y: 0.95,
    w: 12.2,
    h: 0.55,
    fontSize: 25,
    bold: true,
    color: C.navy,
    fontFace: 'Arial',
  });

  // Left Mascot Card
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.55,
    y: 1.7,
    w: 4.1,
    h: 5.0,
    fill: { color: C.navyDark },
    line: { type: 'none' },
    rectRadius: 0.12,
  });
  s.addImage({ path: LOGO_IMG, x: 1.35, y: 2.0, w: 2.5, h: 2.5 });
  s.addText('Si KADI', {
    x: 0.8,
    y: 4.65,
    w: 3.6,
    h: 0.45,
    fontSize: 24,
    bold: true,
    color: C.white,
    align: 'center',
    fontFace: 'Arial',
  });
  s.addText('Robot Sahabat UMKM', {
    x: 0.8,
    y: 5.1,
    w: 3.6,
    h: 0.35,
    fontSize: 13.5,
    bold: true,
    color: C.orangeLight,
    align: 'center',
    fontFace: 'Arial',
  });
  s.addText(
    'Simbol pendampingan KADIN Indonesia yang ramah, cepat, dan terpercaya dalam membantu pelaku usaha beralih ke pencatatan modern.',
    {
      x: 0.85,
      y: 5.52,
      w: 3.5,
      h: 0.95,
      fontSize: 11,
      color: 'CBD5E1',
      align: 'center',
      fontFace: 'Arial',
      lineSpacingMultiple: 1.25,
    }
  );

  // Right 4 Pillars
  const pillars = [
    {
      num: 'PILAR 01',
      title: 'Sistem Kasir (POS) & Inventory Terintegrasi',
      desc: 'Transaksi cepat via QRIS/Tunai/Transfer, struk digital siap cetak & WA, pemotongan stok otomatis, dan buku mutasi stok permanen.',
    },
    {
      num: 'PILAR 02',
      title: 'Database Pelanggan (CRM) & Loyalitas',
      desc: 'Segmentasi otomatis (Reguler, Setia, VIP, Reseller), perolehan poin belanja, riwayat transaksi, dan sapaan personal WhatsApp.',
    },
    {
      num: 'PILAR 03',
      title: 'Pemasaran Digital & Voucher Kasir',
      desc: 'Kampanye lintas kanal dengan kode voucher aktif di kasir, pelacakan jumlah penukaran, dan Studio Broadcast promosi 1 klik.',
    },
    {
      num: 'PILAR 04',
      title: 'Analisis Penjualan & Kinerja Usaha',
      desc: 'Grafik tren omzet vs laba kotor berbasis HPP, peringkat produk terlaris, prioritas restok, dan ekspor laporan CSV untuk pembukuan/KUR.',
    },
  ];

  pillars.forEach((pl, idx) => {
    const y = 1.7 + idx * 1.28;
    s.addShape(pptx.ShapeType.roundRect, {
      x: 4.95,
      y,
      w: 7.8,
      h: 1.12,
      fill: { color: C.white },
      line: { color: C.border, width: 0.8 },
      rectRadius: 0.08,
    });
    s.addText(pl.num, {
      x: 5.2,
      y: y + 0.16,
      w: 1.3,
      h: 0.25,
      fontSize: 9.5,
      bold: true,
      color: C.orange,
      fontFace: 'Arial',
    });
    s.addText(pl.title, {
      x: 5.2,
      y: y + 0.38,
      w: 7.3,
      h: 0.3,
      fontSize: 13.5,
      bold: true,
      color: C.navy,
      fontFace: 'Arial',
    });
    s.addText(pl.desc, {
      x: 5.2,
      y: y + 0.7,
      w: 7.3,
      h: 0.36,
      fontSize: 10.5,
      color: C.slate600,
      fontFace: 'Arial',
    });
  });
}

// ================= SLIDE 4: MODUL 1 — POS & INVENTORY =================
{
  const s = pptx.addSlide();
  addHeaderFooter(s, 4, 'Modul 1 · Sistem Kasir & Inventori');

  s.addText('Kasir Cepat & Kontrol Stok Real-Time Tanpa Selisih', {
    x: 0.55,
    y: 0.95,
    w: 12.2,
    h: 0.5,
    fontSize: 25,
    bold: true,
    color: C.navy,
    fontFace: 'Arial',
  });

  // Left: POS Capabilities
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.55,
    y: 1.65,
    w: 6.0,
    h: 5.05,
    fill: { color: C.white },
    line: { color: C.border, width: 0.8 },
    rectRadius: 0.1,
  });
  s.addText('Sistem Kasir (Point of Sale)', {
    x: 0.85,
    y: 1.9,
    w: 5.4,
    h: 0.38,
    fontSize: 16,
    bold: true,
    color: C.navy,
    fontFace: 'Arial',
  });
  s.addText(
    [
      { text: '• Katalog Visual & Scan SKU Instan\n', options: { bold: true, color: C.slate900 } },
      { text: '  Filter kategori cepat dan input SKU langsung masuk keranjang.\n\n', options: { color: C.slate600 } },
      { text: '• Multi-Pembayaran & Kalkulator Kembalian\n', options: { bold: true, color: C.slate900 } },
      { text: '  QRIS, Tunai (tombol uang pas/nominal cepat), Transfer Bank, E-Wallet.\n\n', options: { color: C.slate600 } },
      { text: '• Validasi Voucher Otomatis\n', options: { bold: true, color: C.slate900 } },
      { text: '  Kode promo dari tim pemasaran langsung memotong tagihan di kasir.\n\n', options: { color: C.slate600 } },
      { text: '• Struk Digital, Cetak & Pembatalan Aman\n', options: { bold: true, color: C.slate900 } },
      { text: '  Siap cetak thermal / salin teks WA; pembatalan otomatis kembalikan stok.', options: { color: C.slate600 } },
    ],
    { x: 0.85, y: 2.4, w: 5.4, h: 4.1, fontSize: 12, fontFace: 'Arial', lineSpacingMultiple: 1.2 }
  );

  // Right Top: Inventory Capabilities
  s.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.65,
    w: 5.95,
    h: 3.1,
    fill: { color: C.white },
    line: { color: C.border, width: 0.8 },
    rectRadius: 0.1,
  });
  s.addText('Manajemen Inventori & Audit Stok', {
    x: 7.1,
    y: 1.9,
    w: 5.4,
    h: 0.38,
    fontSize: 16,
    bold: true,
    color: C.orange,
    fontFace: 'Arial',
  });
  s.addText(
    [
      { text: '• Valuasi Aset Gudang & Margin Otomatis: ', options: { bold: true, color: C.slate900 } },
      { text: 'Pantau modal HPP tertanam & persentase margin tiap SKU.\n\n', options: { color: C.slate600 } },
      { text: '• Peringatan Stok Menipis & Habis: ', options: { bold: true, color: C.slate900 } },
      { text: 'Notifikasi indikator angka di sidebar dan filter prioritas restok.\n\n', options: { color: C.slate600 } },
      { text: '• Buku Mutasi Stok Permanen: ', options: { bold: true, color: C.slate900 } },
      { text: 'Setiap barang masuk, keluar, penjualan, dan koreksi tercatat anti-ubah.', options: { color: C.slate600 } },
    ],
    { x: 7.1, y: 2.4, w: 5.35, h: 2.25, fontSize: 11.8, fontFace: 'Arial', lineSpacingMultiple: 1.18 }
  );

  // Right Bottom: Product Visual Strip
  const imgs = [
    { path: PROD_KOPI, lbl: 'Kuliner & Minuman' },
    { path: PROD_BATIK, lbl: 'Fashion & Batik' },
    { path: PROD_TEMPE, lbl: 'Kriya & Kemasan' },
  ];
  imgs.forEach((im, idx) => {
    const x = 6.8 + idx * 2.04;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 4.95,
      w: 1.88,
      h: 1.75,
      fill: { color: C.white },
      line: { color: C.border, width: 0.8 },
      rectRadius: 0.08,
    });
    s.addImage({ path: im.path, x: x + 0.1, y: 5.05, w: 1.68, h: 1.2 });
    s.addText(im.lbl, {
      x: x + 0.05,
      y: 6.32,
      w: 1.78,
      h: 0.3,
      fontSize: 9.5,
      bold: true,
      color: C.navy,
      align: 'center',
      fontFace: 'Arial',
    });
  });
}

// ================= SLIDE 5: MODUL 2 & 3 — CRM & PEMASARAN DIGITAL =================
{
  const s = pptx.addSlide();
  addHeaderFooter(s, 5, 'Modul 2 & 3 · CRM Pelanggan & Pemasaran Digital');

  s.addText('Ubah Pembeli Sekali Datang Menjadi Pelanggan Setia', {
    x: 0.55,
    y: 0.95,
    w: 12.2,
    h: 0.5,
    fontSize: 25,
    bold: true,
    color: C.navy,
    fontFace: 'Arial',
  });

  // Left: CRM
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.55,
    y: 1.65,
    w: 5.95,
    h: 5.05,
    fill: { color: C.white },
    line: { color: C.border, width: 0.8 },
    rectRadius: 0.1,
  });
  s.addText('Database Pelanggan (CRM UMKM)', {
    x: 0.85,
    y: 1.9,
    w: 5.3,
    h: 0.38,
    fontSize: 16,
    bold: true,
    color: C.navy,
    fontFace: 'Arial',
  });
  s.addText(
    [
      { text: '1. Segmentasi Otomatis Naik Kelas\n', options: { bold: true, color: C.orange } },
      { text: '   Reguler → Setia (≥ Rp 400rb / 3x beli) → VIP (≥ Rp 1,5jt / 10x beli), plus jalur khusus Reseller.\n\n', options: { color: C.slate600 } },
      { text: '2. Poin Loyalitas Terintegrasi Kasir\n', options: { bold: true, color: C.orange } },
      { text: '   Setiap pembelanjaan Rp 10.000 otomatis menambah 1 poin loyalitas pada profil pelanggan.\n\n', options: { color: C.slate600 } },
      { text: '3. Profil Preferensi & Riwayat Struk\n', options: { bold: true, color: C.orange } },
      { text: '   Pemilik usaha melihat produk favorit, total omzet per pelanggan, serta tombol sapa cepat WhatsApp.', options: { color: C.slate600 } },
    ],
    { x: 0.85, y: 2.45, w: 5.35, h: 4.0, fontSize: 12, fontFace: 'Arial', lineSpacingMultiple: 1.25 }
  );

  // Right: Digital Marketing
  s.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.65,
    w: 5.95,
    h: 5.05,
    fill: { color: C.navyDark },
    line: { type: 'none' },
    rectRadius: 0.1,
  });
  s.addText('Pemasaran Digital & Studio Broadcast', {
    x: 7.1,
    y: 1.9,
    w: 5.35,
    h: 0.38,
    fontSize: 16,
    bold: true,
    color: C.orangeLight,
    fontFace: 'Arial',
  });
  s.addText(
    [
      { text: '• Manajemen Kampanye Lintas Kanal\n', options: { bold: true, color: C.white } },
      { text: '  Kelola promo WhatsApp, Instagram, TikTok, Katalog Digital, dan Voucher Kasir dengan jadwal mulai–selesai.\n\n', options: { color: 'CBD5E1' } },
      { text: '• Voucher Terhubung Langsung ke Kasir\n', options: { bold: true, color: C.white } },
      { text: '  Contoh kode KADIN15 (15%) atau VIPCUAN20 (20%) langsung memotong harga di POS dan mencatat jumlah klaim.\n\n', options: { color: 'CBD5E1' } },
      { text: '• Studio Pesan Promosi Siap Kirim\n', options: { bold: true, color: C.white } },
      { text: '  Merakit pesan penawaran otomatis dari data produk & voucher aktif, lalu mengirim personal ke daftar kontak sesuai segmen.', options: { color: 'CBD5E1' } },
    ],
    { x: 7.1, y: 2.45, w: 5.35, h: 4.0, fontSize: 12, fontFace: 'Arial', lineSpacingMultiple: 1.25 }
  );
}

// ================= SLIDE 6: MODUL 4 — ANALISIS PENJUALAN & KINERJA =================
{
  const s = pptx.addSlide();
  addHeaderFooter(s, 6, 'Modul 4 · Analisis Penjualan & Kinerja');

  s.addText('Keputusan Bisnis Berbasis Data & Jejak Pembukuan Siap KUR', {
    x: 0.55,
    y: 0.95,
    w: 12.2,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: C.navy,
    fontFace: 'Arial',
  });

  // Top 4 KPI Mock Strip
  const kpis = [
    { lbl: 'Total Omzet', val: 'Real-Time IDR', note: 'Filter Hari Ini / 7H / 30H / Semua' },
    { lbl: 'Estimasi Laba Kotor', val: 'Omzet − HPP', note: 'Lengkap dengan Margin Kotor %' },
    { lbl: 'Rata-rata Keranjang', val: 'AOV / Struk', note: 'Mengukur efektivitas upselling' },
    { lbl: 'Ekspor Pembukuan', val: '1-Klik CSV', note: 'Siap pelaporan pajak & KUR bank' },
  ];
  kpis.forEach((k, idx) => {
    const x = 0.55 + idx * 3.12;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 1.65,
      w: 2.92,
      h: 1.35,
      fill: { color: C.white },
      line: { color: C.border, width: 0.8 },
      rectRadius: 0.08,
    });
    s.addText(k.lbl, { x: x + 0.18, y: 1.78, w: 2.55, h: 0.25, fontSize: 10.5, color: C.slate600, fontFace: 'Arial' });
    s.addText(k.val, { x: x + 0.18, y: 2.08, w: 2.55, h: 0.4, fontSize: 18, bold: true, color: idx % 2 === 0 ? C.navy : C.orange, fontFace: 'Arial' });
    s.addText(k.note, { x: x + 0.18, y: 2.56, w: 2.55, h: 0.3, fontSize: 9.5, color: C.slate600, fontFace: 'Arial' });
  });

  // Visual Analytics Breakdown Box
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.55,
    y: 3.25,
    w: 12.23,
    h: 3.45,
    fill: { color: C.white },
    line: { color: C.border, width: 0.8 },
    rectRadius: 0.1,
  });
  s.addText('Lima Wawasan Kunci di Dashboard Analisis Kinerja', {
    x: 0.85,
    y: 3.48,
    w: 11.5,
    h: 0.38,
    fontSize: 15.5,
    bold: true,
    color: C.navy,
    fontFace: 'Arial',
  });

  const insights = [
    ['Tren Omzet & Laba Harian', 'Grafik area interaktif membandingkan pendapatan kotor (biru KADIN) dan laba kotor (oranye DIGI) untuk membaca hari tersibuk.'],
    ['Top 6 Produk Terlaris', 'Grafik batang mendatar menampilkan kontributor omzet tertinggi agar pelaku UMKM memprioritaskan stok produk unggulan.'],
    ['Komposisi Kanal Pembayaran', 'Proporsi QRIS, Tunai, Transfer Bank, dan E-Wallet membantu percepatan adopsi transaksi non-tunai (cashless UMKM).'],
    ['Kontribusi per Kategori', 'Memetakan performa Kuliner, Minuman, Fashion, Kriya, Sembako, dan Jasa untuk strategi diversifikasi produk.'],
    ['Daftar Aksi Cepat', 'Menyandingkan 5 Pelanggan Terbaik dan daftar Prioritas Restok Inventori langsung di halaman yang sama.'],
  ];

  s.addTable(
    [
      [
        { text: 'Komponen Analitik', options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: 'Manfaat Bisnis bagi Pelaku UMKM & Pembina KADIN', options: { bold: true, color: C.white, fill: { color: C.navy } } },
      ],
      ...insights.map((row, idx) => [
        { text: row[0], options: { bold: true, color: C.navy, fill: { color: idx % 2 === 0 ? C.bgLight : C.white } } },
        { text: row[1], options: { color: C.slate600, fill: { color: idx % 2 === 0 ? C.bgLight : C.white } } },
      ]),
    ],
    {
      x: 0.85,
      y: 3.98,
      w: 11.6,
      colW: [3.2, 8.4],
      fontSize: 10.5,
      fontFace: 'Arial',
      border: { pt: 0.5, color: C.border },
      margin: [0.06, 0.1, 0.06, 0.1],
    }
  );
}

// ================= SLIDE 7: ARSITEKTUR TEKNIS & KEAMANAN (TSD) =================
{
  const s = pptx.addSlide();
  addHeaderFooter(s, 7, 'Spesifikasi Teknis & Keamanan (TSD)');

  s.addText('Arsitektur Cloud-Native & Keamanan Data Zero-Trust', {
    x: 0.55,
    y: 0.95,
    w: 12.2,
    h: 0.5,
    fontSize: 25,
    bold: true,
    color: C.navy,
    fontFace: 'Arial',
  });

  // Architecture Stack Boxes
  const layers = [
    {
      title: 'Frontend Modern',
      items: 'Next.js 15 App Router\nReact 19 + TypeScript Strict\nTailwind CSS v4 + Recharts\nResponsif Desktop/Tablet/HP',
      accent: C.navy,
    },
    {
      title: 'Autentikasi & Identitas',
      items: 'Firebase Authentication\nGoogle OAuth 2.0 Popup\nWajib Email Terverifikasi\nIsolasi Tenant per ownerId',
      accent: C.orange,
    },
    {
      title: 'Database & Transaksi',
      items: 'Cloud Firestore Enterprise\n6 Koleksi Terstruktur\nAtomic writeBatch Checkout\nAudit Log Stok Immutable',
      accent: C.navyMid,
    },
  ];

  layers.forEach((ly, idx) => {
    const x = 0.55 + idx * 4.18;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 1.65,
      w: 3.88,
      h: 2.25,
      fill: { color: C.white },
      line: { color: C.border, width: 0.8 },
      rectRadius: 0.1,
    });
    s.addShape(pptx.ShapeType.rect, {
      x,
      y: 1.65,
      w: 3.88,
      h: 0.45,
      fill: { color: ly.accent },
      line: { type: 'none' },
    });
    s.addText(ly.title, {
      x: x + 0.18,
      y: 1.72,
      w: 3.5,
      h: 0.32,
      fontSize: 13,
      bold: true,
      color: C.white,
      fontFace: 'Arial',
    });
    s.addText(ly.items, {
      x: x + 0.2,
      y: 2.24,
      w: 3.5,
      h: 1.5,
      fontSize: 11.5,
      color: C.slate600,
      fontFace: 'Arial',
      lineSpacingMultiple: 1.35,
    });
  });

  // Security Box (8 Pillars)
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.55,
    y: 4.15,
    w: 12.23,
    h: 2.55,
    fill: { color: C.navyDark },
    line: { type: 'none' },
    rectRadius: 0.1,
  });
  s.addText('Kepatuhan Keamanan Data & Perlindungan Privasi Pelanggan (UU PDP)', {
    x: 0.85,
    y: 4.35,
    w: 11.6,
    h: 0.38,
    fontSize: 15,
    bold: true,
    color: C.orangeLight,
    fontFace: 'Arial',
  });
  s.addText(
    [
      { text: '• Default-Deny & Validasi Skema Ketat: ', options: { bold: true, color: C.white } },
      { text: 'Setiap tulis/ubah data diverifikasi tipe, panjang karakter, regex SKU/voucher, dan stempel waktu server (request.time).\n', options: { color: 'CBD5E1' } },
      { text: '• Isolasi PII Multi-Tenant: ', options: { bold: true, color: C.white } },
      { text: 'Nomor WhatsApp, email pelanggan, dan omzet toko hanya dapat dibaca pemilik usaha bersangkutan (ownerId == auth.uid).\n', options: { color: 'CBD5E1' } },
      { text: '• Anti-Manipulasi & Audit Trail: ', options: { bold: true, color: C.white } },
      { text: 'Riwayat mutasi stok (stockLogs) bersifat append-only, transaksi batal terkunci permanen, serta lolos audit statis ESLint Security Rules.', options: { color: 'CBD5E1' } },
    ],
    { x: 0.85, y: 4.82, w: 11.6, h: 1.75, fontSize: 11.5, fontFace: 'Arial', lineSpacingMultiple: 1.35 }
  );
}

// ================= SLIDE 8: TARGET KPI & DAMPAK PROGRAM =================
{
  const s = pptx.addSlide();
  addHeaderFooter(s, 8, 'Indikator Keberhasilan (KPI)');

  s.addText('Target Adopsi & Dampak Terukur bagi Ekosistem KADIN', {
    x: 0.55,
    y: 0.95,
    w: 12.2,
    h: 0.5,
    fontSize: 25,
    bold: true,
    color: C.navy,
    fontFace: 'Arial',
  });

  s.addTable(
    [
      [
        { text: 'Indikator Kinerja (KPI)', options: { bold: true, color: C.white, fill: { color: C.navyDark } } },
        { text: 'Fase Pilot (3 Bulan)', options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: 'Rollout Nasional (12 Bulan)', options: { bold: true, color: C.white, fill: { color: C.orange } } },
        { text: 'Cara Pengukuran', options: { bold: true, color: C.white, fill: { color: C.navyDark } } },
      ],
      ['UMKM Aktif Terdaftar', '1.000 Merchant (3 Provinsi)', '50.000 Merchant (38 Provinsi)', 'Profil toko & login aktif bulanan'],
      ['Aktivasi Hari Pertama', '≥ 75% Merchant', '≥ 80% Merchant', 'Input produk pertama / data contoh'],
      ['Volume Transaksi POS / Toko', '≥ 150 transaksi / bulan', '≥ 250 transaksi / bulan', 'Koleksi transactions status Selesai'],
      ['Penurunan Selisih Stok', 'Turun ≥ 40%', 'Turun ≥ 60%', 'Perbandingan stockLogs & opname'],
      ['Konversi Voucher Digital', '≥ 12% penukaran', '≥ 18% penukaran', 'Metrik redemptions pada campaigns'],
      ['Retensi Pengguna Bulanan', '≥ 65% MAU', '≥ 72% MAU', 'Merchant aktif bertransaksi ≥ 3x/minggu'],
    ].map((row, rIdx) =>
      rIdx === 0
        ? row
        : row.map((cell, cIdx) => ({
            text: cell,
            options: {
              bold: cIdx === 0 || cIdx === 2,
              color: cIdx === 2 ? C.orange : cIdx === 0 ? C.navy : C.slate600,
              fill: { color: rIdx % 2 === 1 ? C.white : C.bgLight },
            },
          }))
    ),
    {
      x: 0.55,
      y: 1.7,
      w: 12.23,
      colW: [3.2, 2.75, 3.05, 3.23],
      fontSize: 11.5,
      fontFace: 'Arial',
      border: { pt: 0.6, color: C.border },
      margin: [0.1, 0.12, 0.1, 0.12],
    }
  );

  // Value Highlight for KADIN
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.55,
    y: 5.55,
    w: 12.23,
    h: 1.15,
    fill: { color: C.white },
    line: { color: C.orangeBright, width: 1.2 },
    rectRadius: 0.08,
  });
  s.addText(
    'Nilai Strategis bagi KADIN Indonesia: Menciptakan basis data pembukuan UMKM binaan yang terstandar, mempercepat inklusi pembayaran QRIS, dan membuka jalan kolaborasi perbankan (KUR) serta jaringan rantai pasok anggota KADIN.',
    {
      x: 0.85,
      y: 5.72,
      w: 11.6,
      h: 0.8,
      fontSize: 12.5,
      bold: true,
      color: C.navy,
      fontFace: 'Arial',
      lineSpacingMultiple: 1.3,
    }
  );
}

// ================= SLIDE 9: PETA JALAN IMPLEMENTASI (ROADMAP) =================
{
  const s = pptx.addSlide();
  addHeaderFooter(s, 9, 'Peta Jalan Pengembangan (Roadmap)');

  s.addText('Tahapan Implementasi Bersama KADIN Pusat & KADIN Daerah', {
    x: 0.55,
    y: 0.95,
    w: 12.2,
    h: 0.5,
    fontSize: 25,
    bold: true,
    color: C.navy,
    fontFace: 'Arial',
  });

  const phases = [
    {
      tag: 'FASE 1 · Q1 (SIAP DEMO)',
      title: 'Peluncuran MVP & Pilot Daerah',
      color: C.orange,
      bullets: [
        '• Web App KADIN DIGI (POS, Inventori, CRM, Pemasaran, Analitik)',
        '• Pelatihan langsung di 3 KADIN Provinsi pilot (fitur Data Contoh 1-Klik)',
        '• Evaluasi adopsi & umpan balik pelaku UMKM lapangan',
        '• Panduan onboarding & dukungan Si KADI',
      ],
    },
    {
      tag: 'FASE 2 · Q2–Q3',
      title: 'Integrasi Pembayaran & Skala',
      color: C.navy,
      bullets: [
        '• Integrasi QRIS Dinamis & rekonsiliasi otomatis',
        '• Manajemen Multi-Cabang & Multi-Kasir (RBAC staf)',
        '• Mode Offline PWA untuk area sinyal terbatas',
        '• Katalog Toko Online & integrasi WhatsApp Business API',
      ],
    },
    {
      tag: 'FASE 3 · Q4+',
      title: 'Ekosistem Ekonomi Digital KADIN',
      color: C.navyDark,
      bullets: [
        '• Dashboard Pemantauan Agregat KADIN Daerah (teranonimisasi)',
        '• Laporan Keuangan Standar SAK EMKM otomatis',
        '• Skor Kelayakan Kredit (KUR) berbasis rekam transaksi riil',
        '• Koneksi B2B Distributor & Pemasok anggota KADIN',
      ],
    },
  ];

  phases.forEach((ph, idx) => {
    const x = 0.55 + idx * 4.18;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 1.75,
      w: 3.88,
      h: 4.9,
      fill: { color: C.white },
      line: { color: C.border, width: 0.8 },
      rectRadius: 0.1,
    });
    s.addShape(pptx.ShapeType.rect, {
      x,
      y: 1.75,
      w: 3.88,
      h: 0.95,
      fill: { color: ph.color },
      line: { type: 'none' },
    });
    s.addText(ph.tag, {
      x: x + 0.22,
      y: 1.88,
      w: 3.45,
      h: 0.25,
      fontSize: 9.5,
      bold: true,
      color: idx === 0 ? C.white : C.orangeLight,
      fontFace: 'Arial',
    });
    s.addText(ph.title, {
      x: x + 0.22,
      y: 2.16,
      w: 3.45,
      h: 0.45,
      fontSize: 14,
      bold: true,
      color: C.white,
      fontFace: 'Arial',
    });
    s.addText(ph.bullets.join('\n\n'), {
      x: x + 0.22,
      y: 2.95,
      w: 3.45,
      h: 3.5,
      fontSize: 11.2,
      color: C.slate600,
      fontFace: 'Arial',
      lineSpacingMultiple: 1.25,
    });
  });
}

// ================= SLIDE 10: PENUTUP & AJAKAN KOLABORASI =================
{
  const s = pptx.addSlide();
  addHeaderFooter(s, 10, '', true);

  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 6.75,
    w: 13.333,
    h: 0.75,
    fill: { color: C.navy },
    line: { type: 'none' },
  });

  s.addImage({ path: LOGO_IMG, x: 5.75, y: 0.85, w: 1.85, h: 1.85 });

  s.addText(
    [
      { text: 'KADIN ', options: { color: C.white, bold: true } },
      { text: 'DIGI', options: { color: C.orangeBright, bold: true } },
    ],
    { x: 1.5, y: 2.9, w: 10.333, h: 0.85, fontSize: 44, align: 'center', fontFace: 'Arial' }
  );

  s.addText('Siap Memulai Pilot Program Digitalisasi UMKM Bersama KADIN Indonesia', {
    x: 1.2,
    y: 3.85,
    w: 10.933,
    h: 0.6,
    fontSize: 20,
    bold: true,
    color: 'DBEAFE',
    align: 'center',
    fontFace: 'Arial',
  });

  s.addText(
    'Aplikasi web KADIN DIGI sudah siap diuji coba secara langsung hari ini.\nMari wujudkan ekosistem UMKM Indonesia yang modern, transparan, dan berdaya saing global.',
    {
      x: 1.8,
      y: 4.55,
      w: 9.733,
      h: 0.9,
      fontSize: 13.5,
      color: 'CBD5E1',
      align: 'center',
      fontFace: 'Arial',
      lineSpacingMultiple: 1.35,
    }
  );

  s.addText(
    [
      { text: 'UMKM Naik Kelas', options: { color: C.white, bold: true } },
      { text: '   |   ', options: { color: '64748B' } },
      { text: 'Bisnis Makin Cuan', options: { color: C.orangeLight, bold: true } },
    ],
    { x: 1.5, y: 6.9, w: 10.333, h: 0.45, fontSize: 18, align: 'center', fontFace: 'Arial' }
  );
}

await pptx.writeFile({ fileName: OUT_FILE });
console.log('Generated PPTX:', OUT_FILE);
