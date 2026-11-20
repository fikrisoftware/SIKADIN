import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const ROOT = process.cwd();
const TMP_DIR = path.join(ROOT, '.tmp_video');
const OUT_MP4 = path.join(ROOT, 'public/downloads/Video_Promosi_KADIN_DIGI.mp4');
const POSTER_IMG = path.join(ROOT, 'public/assets/aistudio/image_0a4c7de4.png');
const LOGO_IMG = path.join(ROOT, 'public/images/si-kadi-logo.jpg');
const PROD_KOPI = path.join(ROOT, 'public/images/prod-kopi-susu.jpg');
const PROD_BATIK = path.join(ROOT, 'public/images/prod-batik-scarf.jpg');
const PROD_TEMPE = path.join(ROOT, 'public/images/prod-keripik-tempe.jpg');

fs.mkdirSync(TMP_DIR, { recursive: true });
fs.mkdirSync(path.dirname(OUT_MP4), { recursive: true });

const W = 1920;
const H = 1080;

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function prepRoundedImage(srcPath, sizeW, sizeH, radius = 24) {
  const mask = Buffer.from(
    `<svg width="${sizeW}" height="${sizeH}"><rect x="0" y="0" width="${sizeW}" height="${sizeH}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`
  );
  return sharp(srcPath)
    .resize(sizeW, sizeH, { fit: 'cover' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function renderScene(filename, svgMarkup, overlays = []) {
  const base = sharp(Buffer.from(svgMarkup)).resize(W, H);
  if (overlays.length > 0) {
    base.composite(overlays);
  }
  const outPath = path.join(TMP_DIR, filename);
  await base.png().toFile(outPath);
  return outPath;
}

// === Synthesize clean warm corporate presentation soundtrack (WAV) ===
function generateBackgroundAudio(outWavPath, totalSeconds) {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * totalSeconds);
  const buffer = Buffer.alloc(44 + numSamples * 4); // Stereo 16-bit PCM

  // WAV Header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 4, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(2, 22); // Stereo
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 4, 40);

  // Uplifting corporate progression: Cmaj7 -> G6 -> Am7 -> Fmaj7 (4s per chord)
  const chords = [
    [261.63, 329.63, 392.0, 493.88], // Cmaj7
    [196.0, 293.66, 392.0, 440.0],   // G6
    [220.0, 261.63, 329.63, 392.0],  // Am7
    [174.61, 261.63, 329.63, 349.23],// Fmaj7
  ];
  const arpeggio = [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 783.99, 880.0];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.floor(t / 4) % chords.length;
    const chord = chords[chordIdx];
    const chordLocalT = t % 4;
    const chordEnv = Math.min(1, chordLocalT / 0.25) * Math.min(1, (4 - chordLocalT) / 0.35);

    // Warm pad
    let padL = 0;
    let padR = 0;
    for (let c = 0; c < chord.length; c++) {
      const f = chord[c];
      const v = Math.sin(2 * Math.PI * f * t) + 0.2 * Math.sin(2 * Math.PI * f * 2 * t);
      padL += v * (c % 2 === 0 ? 0.1 : 0.06);
      padR += v * (c % 2 === 1 ? 0.1 : 0.06);
    }

    // Gentle melodic pluck every 0.5s
    const stepIdx = Math.floor(t * 2) % arpeggio.length;
    const stepT = (t * 2) % 1;
    const pluckEnv = Math.exp(-stepT * 5.5);
    const noteFreq = arpeggio[stepIdx];
    const pluck = Math.sin(2 * Math.PI * noteFreq * t) * pluckEnv * 0.11;

    // Soft rhythmic pulse every 0.5s
    const beatT = t % 0.5;
    const bassFreq = chord[0] * 0.5;
    const bass = Math.sin(2 * Math.PI * bassFreq * t) * Math.exp(-beatT * 6.0) * 0.16;

    // Global fade in (1.5s) and fade out (2.5s)
    const fadeIn = Math.min(1, t / 1.5);
    const fadeOut = Math.min(1, Math.max(0, (totalSeconds - t) / 2.5));
    const master = fadeIn * fadeOut * 0.72;

    const sampleL = Math.max(-0.95, Math.min(0.95, (padL * chordEnv + pluck + bass) * master));
    const sampleR = Math.max(-0.95, Math.min(0.95, (padR * chordEnv + pluck * 0.85 + bass) * master));

    buffer.writeInt16LE(Math.round(sampleL * 32767), 44 + i * 4);
    buffer.writeInt16LE(Math.round(sampleR * 32767), 44 + i * 4 + 2);
  }

  fs.writeFileSync(outWavPath, buffer);
}

console.log('Rendering 7 Full HD promotional scenes...');

const posterBuf = await prepRoundedImage(POSTER_IMG, 760, 760, 32);
const logoSmall = await prepRoundedImage(LOGO_IMG, 84, 84, 18);
const logoHero = await prepRoundedImage(LOGO_IMG, 300, 300, 56);
const kopiBuf = await prepRoundedImage(PROD_KOPI, 260, 260, 22);
const batikBuf = await prepRoundedImage(PROD_BATIK, 260, 260, 22);
const tempeBuf = await prepRoundedImage(PROD_TEMPE, 260, 260, 22);

const scenes = [];

// SCENE 1: OPENING BRAND REVEAL
scenes.push(
  await renderScene(
    'scene1.png',
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g1" cx="72%" cy="50%" r="60%">
          <stop offset="0%" stop-color="#144691" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#051633" stop-opacity="1"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="#051633"/>
      <rect width="${W}" height="${H}" fill="url(#g1)"/>
      <rect x="0" y="0" width="20" height="${H}" fill="#F97316"/>
      <text x="120" y="210" font-family="Noto Sans" font-size="26" font-weight="700" fill="#22D3EE" letter-spacing="4">MEMPERSEMBAHKAN UNTUK KADIN INDONESIA</text>
      <text x="120" y="365" font-family="Noto Sans" font-size="132" font-weight="800" fill="#FFFFFF">KADIN <tspan fill="#F97316">DIGI</tspan></text>
      <text x="120" y="455" font-family="Noto Sans" font-size="42" font-weight="700" fill="#DBEAFE">Si KADI — Robot Sahabat UMKM</text>
      <text x="120" y="545" font-family="Noto Sans" font-size="30" fill="#CBD5E1">Platform Kasir Digital, Inventori, Database Pelanggan,</text>
      <text x="120" y="592" font-family="Noto Sans" font-size="30" fill="#CBD5E1">Pemasaran Digital &amp; Analisis Kinerja Bisnis UMKM.</text>
      <rect x="120" y="685" width="770" height="96" rx="18" fill="#08234D" stroke="#F97316" stroke-width="3"/>
      <text x="160" y="747" font-family="Noto Sans" font-size="36" font-weight="800" fill="#FFFFFF">UMKM Naik Kelas  <tspan fill="#64748B">|</tspan>  <tspan fill="#FB923C">Bisnis Makin Cuan</tspan></text>
      <rect x="1048" y="150" width="780" height="780" rx="36" fill="#08234D" stroke="#1E3A8A" stroke-width="3"/>
    </svg>`,
    [{ input: posterBuf, left: 1058, top: 160 }]
  )
);

// SCENE 2: TANTANGAN & PELUANG UMKM INDONESIA
scenes.push(
  await renderScene(
    'scene2.png',
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="#051633"/>
      <rect x="0" y="0" width="${W}" height="12" fill="#F97316"/>
      <text x="120" y="155" font-family="Noto Sans" font-size="24" font-weight="700" fill="#22D3EE" letter-spacing="3">LATAR BELAKANG STRATEGIS</text>
      <text x="120" y="240" font-family="Noto Sans" font-size="64" font-weight="800" fill="#FFFFFF">Saatnya UMKM Indonesia <tspan fill="#FB923C">Beralih ke Digital</tspan></text>

      <!-- 3 Big Stat Cards -->
      <rect x="120" y="320" width="520" height="270" rx="22" fill="#08234D" stroke="#1E3A8A" stroke-width="2"/>
      <text x="165" y="435" font-family="JetBrains Mono" font-size="78" font-weight="700" fill="#F97316">65+ Jt</text>
      <text x="165" y="500" font-family="Noto Sans" font-size="30" font-weight="700" fill="#FFFFFF">Pelaku UMKM Nasional</text>
      <text x="165" y="545" font-family="Noto Sans" font-size="22" fill="#93C5FD">Warung, kedai, kriya &amp; fashion lokal</text>

      <rect x="700" y="320" width="520" height="270" rx="22" fill="#08234D" stroke="#1E3A8A" stroke-width="2"/>
      <text x="745" y="435" font-family="JetBrains Mono" font-size="78" font-weight="700" fill="#22D3EE">&gt; 60%</text>
      <text x="745" y="500" font-family="Noto Sans" font-size="30" font-weight="700" fill="#FFFFFF">Kontribusi PDB Nasional</text>
      <text x="745" y="545" font-family="Noto Sans" font-size="22" fill="#93C5FD">Penggerak utama ekonomi Indonesia</text>

      <rect x="1280" y="320" width="520" height="270" rx="22" fill="#08234D" stroke="#1E3A8A" stroke-width="2"/>
      <text x="1325" y="435" font-family="JetBrains Mono" font-size="78" font-weight="700" fill="#F97316">97%</text>
      <text x="1325" y="500" font-family="Noto Sans" font-size="30" font-weight="700" fill="#FFFFFF">Serapan Tenaga Kerja</text>
      <text x="1325" y="545" font-family="Noto Sans" font-size="22" fill="#93C5FD">Fondasi kesejahteraan masyarakat</text>

      <rect x="120" y="665" width="1680" height="240" rx="22" fill="#0B2C5F" stroke="#F97316" stroke-width="2"/>
      <text x="170" y="750" font-family="Noto Sans" font-size="36" font-weight="800" fill="#FB923C">Tantangan Nyata: Pencatatan Manual, Stok Tak Terpantau &amp; Promosi Belum Terukur</text>
      <text x="170" y="815" font-family="Noto Sans" font-size="28" fill="#E2E8F0">KADIN DIGI hadir menyatukan operasional harian dalam satu aplikasi modern berbasis cloud.</text>
    </svg>`
  )
);

// SCENE 3: PILAR 1 — KASIR POS & INVENTORY
scenes.push(
  await renderScene(
    'scene3.png',
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="#F3F6FB"/>
      <rect width="${W}" height="120" fill="#051633"/>
      <text x="230" y="74" font-family="Noto Sans" font-size="36" font-weight="800" fill="#FFFFFF">KADIN <tspan fill="#F97316">DIGI</tspan>   <tspan fill="#93C5FD" font-size="26" font-weight="500">|   PILAR 01 · SISTEM KASIR &amp; INVENTORI</tspan></text>

      <text x="120" y="235" font-family="Noto Sans" font-size="56" font-weight="800" fill="#08234D">Kasir Cepat, Stok Otomatis Akurat</text>
      <text x="120" y="295" font-family="Noto Sans" font-size="28" fill="#475569">Transaksi selesai dalam hitungan detik dengan pemotongan stok atomik dan struk digital.</text>

      <!-- Left Feature Cards -->
      <rect x="120" y="360" width="790" height="145" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
      <text x="160" y="420" font-family="Noto Sans" font-size="30" font-weight="800" fill="#EA580C">01. Multi-Pembayaran &amp; Voucher Kasir</text>
      <text x="160" y="468" font-family="Noto Sans" font-size="23" fill="#475569">Mendukung QRIS, Tunai (kalkulator kembalian), Transfer Bank &amp; E-Wallet.</text>

      <rect x="120" y="535" width="790" height="145" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
      <text x="160" y="595" font-family="Noto Sans" font-size="30" font-weight="800" fill="#08234D">02. Struk Digital Siap Cetak &amp; Kirim WhatsApp</text>
      <text x="160" y="643" font-family="Noto Sans" font-size="23" fill="#475569">Cetak langsung atau salin teks struk rapi untuk dikirim ke pelanggan.</text>

      <rect x="120" y="710" width="790" height="145" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
      <text x="160" y="770" font-family="Noto Sans" font-size="30" font-weight="800" fill="#08234D">03. Peringatan Stok Menipis &amp; Audit Mutasi</text>
      <text x="160" y="818" font-family="Noto Sans" font-size="23" fill="#475569">Pantau HPP, margin laba, dan buku mutasi stok permanen anti-selisih.</text>

      <!-- Right Visual Mock Panel -->
      <rect x="960" y="360" width="840" height="495" rx="24" fill="#051633"/>
      <text x="1005" y="425" font-family="Noto Sans" font-size="28" font-weight="700" fill="#FFFFFF">Katalog Produk UMKM Real-Time</text>
      <text x="1005" y="775" font-family="JetBrains Mono" font-size="24" font-weight="700" fill="#FB923C">KOP-001 · Rp 24.000</text>
      <text x="1285" y="775" font-family="JetBrains Mono" font-size="24" font-weight="700" fill="#FB923C">BTK-003 · Rp 135.000</text>
      <text x="1565" y="775" font-family="JetBrains Mono" font-size="24" font-weight="700" fill="#FB923C">SNK-002 · Rp 22.000</text>
      <text x="1005" y="815" font-family="Noto Sans" font-size="20" fill="#93C5FD">Es Kopi Susu Gula Aren</text>
      <text x="1285" y="815" font-family="Noto Sans" font-size="20" fill="#93C5FD">Syal Batik Parang Navy</text>
      <text x="1565" y="815" font-family="Noto Sans" font-size="20" fill="#93C5FD">Keripik Tempe Renyah</text>
    </svg>`,
    [
      { input: logoSmall, left: 120, top: 18 },
      { input: kopiBuf, left: 1005, top: 465 },
      { input: batikBuf, left: 1285, top: 465 },
      { input: tempeBuf, left: 1565, top: 465 },
    ]
  )
);

// SCENE 4: PILAR 2 — DATABASE PELANGGAN (CRM)
scenes.push(
  await renderScene(
    'scene4.png',
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="#F3F6FB"/>
      <rect width="${W}" height="120" fill="#051633"/>
      <text x="230" y="74" font-family="Noto Sans" font-size="36" font-weight="800" fill="#FFFFFF">KADIN <tspan fill="#F97316">DIGI</tspan>   <tspan fill="#93C5FD" font-size="26" font-weight="500">|   PILAR 02 · DATABASE PELANGGAN (CRM)</tspan></text>

      <text x="120" y="235" font-family="Noto Sans" font-size="56" font-weight="800" fill="#08234D">Kenali &amp; Rawat Pelanggan Setia Anda</text>
      <text x="120" y="295" font-family="Noto Sans" font-size="28" fill="#475569">Segmentasi otomatis, poin loyalitas, riwayat belanja, dan sapaan personal WhatsApp.</text>

      <!-- 4 Segment Cards -->
      <rect x="120" y="365" width="390" height="230" rx="20" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
      <text x="155" y="430" font-family="Noto Sans" font-size="22" font-weight="700" fill="#64748B">SEGMEN</text>
      <text x="155" y="485" font-family="Noto Sans" font-size="42" font-weight="800" fill="#08234D">Reguler</text>
      <text x="155" y="545" font-family="Noto Sans" font-size="22" fill="#475569">Pembeli baru tercatat rapi</text>

      <rect x="550" y="365" width="390" height="230" rx="20" fill="#FFFFFF" stroke="#059669" stroke-width="2"/>
      <text x="585" y="430" font-family="Noto Sans" font-size="22" font-weight="700" fill="#059669">NAIK OTOMATIS</text>
      <text x="585" y="485" font-family="Noto Sans" font-size="42" font-weight="800" fill="#08234D">Setia</text>
      <text x="585" y="545" font-family="Noto Sans" font-size="22" fill="#475569">≥ 3 transaksi / Rp 400rb</text>

      <rect x="980" y="365" width="390" height="230" rx="20" fill="#051633"/>
      <text x="1015" y="430" font-family="Noto Sans" font-size="22" font-weight="700" fill="#FB923C">PRIORITAS UTAMA</text>
      <text x="1015" y="485" font-family="Noto Sans" font-size="42" font-weight="800" fill="#FFFFFF">VIP</text>
      <text x="1015" y="545" font-family="Noto Sans" font-size="22" fill="#CBD5E1">≥ 10 transaksi / Rp 1,5jt</text>

      <rect x="1410" y="365" width="390" height="230" rx="20" fill="#FFFFFF" stroke="#EA580C" stroke-width="2"/>
      <text x="1445" y="430" font-family="Noto Sans" font-size="22" font-weight="700" fill="#EA580C">MITRA GROSIR</text>
      <text x="1445" y="485" font-family="Noto Sans" font-size="42" font-weight="800" fill="#08234D">Reseller</text>
      <text x="1445" y="545" font-family="Noto Sans" font-size="22" fill="#475569">Penjualan volume besar</text>

      <!-- Bottom CRM Benefit Bar -->
      <rect x="120" y="655" width="1680" height="250" rx="24" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
      <text x="170" y="735" font-family="Noto Sans" font-size="34" font-weight="800" fill="#08234D">Terhubung Otomatis dengan Kasir &amp; WhatsApp</text>
      <text x="170" y="795" font-family="Noto Sans" font-size="26" fill="#475569">• Setiap belanja Rp 10.000 otomatis memberikan 1 Poin Loyalitas.</text>
      <text x="170" y="845" font-family="Noto Sans" font-size="26" fill="#475569">• Data kontak &amp; preferensi aman terisolasi per pemilik usaha (Zero-Trust PII).</text>
    </svg>`,
    [{ input: logoSmall, left: 120, top: 18 }]
  )
);

// SCENE 5: PILAR 3 — PEMASARAN DIGITAL
scenes.push(
  await renderScene(
    'scene5.png',
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="#051633"/>
      <rect width="${W}" height="120" fill="#08234D"/>
      <text x="230" y="74" font-family="Noto Sans" font-size="36" font-weight="800" fill="#FFFFFF">KADIN <tspan fill="#F97316">DIGI</tspan>   <tspan fill="#93C5FD" font-size="26" font-weight="500">|   PILAR 03 · PEMASARAN DIGITAL &amp; VOUCHER</tspan></text>

      <text x="120" y="245" font-family="Noto Sans" font-size="56" font-weight="800" fill="#FFFFFF">Promosi Terukur, <tspan fill="#FB923C">Omzet Melejit</tspan></text>
      <text x="120" y="308" font-family="Noto Sans" font-size="28" fill="#CBD5E1">Buat kode voucher promo dan kirim kampanye personal ke segmen pelanggan yang tepat.</text>

      <!-- Voucher Ticket Mockup Left -->
      <rect x="120" y="385" width="760" height="230" rx="22" fill="#0B2C5F" stroke="#F97316" stroke-width="3"/>
      <text x="165" y="450" font-family="Noto Sans" font-size="24" font-weight="700" fill="#22D3EE">VOUCHER AKTIF TERINTEGRASI KASIR</text>
      <text x="165" y="535" font-family="JetBrains Mono" font-size="64" font-weight="800" fill="#FFFFFF">KADIN15  <tspan fill="#F97316">15% OFF</tspan></text>
      <text x="165" y="585" font-family="Noto Sans" font-size="22" fill="#CBD5E1">Promo Gajian UMKM Naik Kelas  ·  Otomatis hitung penukaran</text>

      <rect x="120" y="655" width="760" height="230" rx="22" fill="#0B2C5F" stroke="#22D3EE" stroke-width="2"/>
      <text x="165" y="720" font-family="Noto Sans" font-size="24" font-weight="700" fill="#FB923C">VOUCHER KHUSUS MEMBER VIP</text>
      <text x="165" y="805" font-family="JetBrains Mono" font-size="56" font-weight="800" fill="#FFFFFF">VIPCUAN20  <tspan fill="#22D3EE">20% OFF</tspan></text>
      <text x="165" y="855" font-family="Noto Sans" font-size="22" fill="#CBD5E1">Apresiasi Pelanggan Setia &amp; VIP  ·  Dorong repeat order</text>

      <!-- Studio Broadcast Right -->
      <rect x="940" y="385" width="860" height="500" rx="24" fill="#FFFFFF"/>
      <text x="990" y="460" font-family="Noto Sans" font-size="34" font-weight="800" fill="#08234D">Studio Broadcast WhatsApp &amp; Sosmed</text>
      <rect x="990" y="500" width="760" height="220" rx="16" fill="#F3F6FB" stroke="#CBD5E1" stroke-width="2"/>
      <text x="1025" y="555" font-family="Noto Sans" font-size="24" font-weight="700" fill="#08234D">Halo Kak Rina! Promo Gajian UMKM Naik Kelas!</text>
      <text x="1025" y="605" font-family="Noto Sans" font-size="22" fill="#475569">Nikmati Es Kopi Susu Gula Aren &amp; produk lokal pilihan</text>
      <text x="1025" y="645" font-family="Noto Sans" font-size="22" fill="#475569">dengan potongan 15%. Pakai kode KADIN15 di kasir!</text>
      <text x="1025" y="690" font-family="Noto Sans" font-size="20" font-weight="700" fill="#EA580C">UMKM Naik Kelas, Bisnis Makin Cuan</text>

      <rect x="990" y="755" width="360" height="78" rx="14" fill="#EA580C"/>
      <text x="1052" y="805" font-family="Noto Sans" font-size="24" font-weight="800" fill="#FFFFFF">Kirim ke Segmen VIP</text>
      <rect x="1380" y="755" width="370" height="78" rx="14" fill="#08234D"/>
      <text x="1445" y="805" font-family="Noto Sans" font-size="24" font-weight="800" fill="#FFFFFF">Salin Caption IG / TikTok</text>
    </svg>`,
    [{ input: logoSmall, left: 120, top: 18 }]
  )
);

// SCENE 6: PILAR 4 — ANALISIS PENJUALAN & KINERJA
scenes.push(
  await renderScene(
    'scene6.png',
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="#F3F6FB"/>
      <rect width="${W}" height="120" fill="#051633"/>
      <text x="230" y="74" font-family="Noto Sans" font-size="36" font-weight="800" fill="#FFFFFF">KADIN <tspan fill="#F97316">DIGI</tspan>   <tspan fill="#93C5FD" font-size="26" font-weight="500">|   PILAR 04 · ANALISIS PENJUALAN &amp; KINERJA</tspan></text>

      <text x="120" y="235" font-family="Noto Sans" font-size="56" font-weight="800" fill="#08234D">Pantau Omzet, Laba Kotor &amp; Pertumbuhan</text>
      <text x="120" y="295" font-family="Noto Sans" font-size="28" fill="#475569">Laporan keuangan rapi dan ekspor CSV 1-klik — fondasi kuat menuju pembiayaan KUR.</text>

      <!-- KPI Strip -->
      <rect x="120" y="355" width="400" height="160" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
      <text x="155" y="405" font-family="Noto Sans" font-size="22" fill="#64748B">Total Omzet</text>
      <text x="155" y="475" font-family="JetBrains Mono" font-size="44" font-weight="800" fill="#08234D">Real-Time</text>

      <rect x="550" y="355" width="400" height="160" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
      <text x="585" y="405" font-family="Noto Sans" font-size="22" fill="#64748B">Estimasi Laba Kotor</text>
      <text x="585" y="475" font-family="JetBrains Mono" font-size="44" font-weight="800" fill="#059669">Berbasis HPP</text>

      <rect x="980" y="355" width="400" height="160" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
      <text x="1015" y="405" font-family="Noto Sans" font-size="22" fill="#64748B">Produk Terlaris</text>
      <text x="1015" y="475" font-family="JetBrains Mono" font-size="44" font-weight="800" fill="#EA580C">Top 6 SKU</text>

      <rect x="1410" y="355" width="390" height="160" rx="18" fill="#051633"/>
      <text x="1445" y="405" font-family="Noto Sans" font-size="22" fill="#93C5FD">Ekspor Pembukuan</text>
      <text x="1445" y="475" font-family="JetBrains Mono" font-size="44" font-weight="800" fill="#FB923C">Unduh CSV</text>

      <!-- Stylized Rising Growth Chart Visual -->
      <rect x="120" y="555" width="1680" height="415" rx="24" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
      <text x="170" y="620" font-family="Noto Sans" font-size="30" font-weight="800" fill="#08234D">Visualisasi Tren Omzet &amp; Laba Harian</text>
      <!-- Bars -->
      <rect x="210" y="810" width="120" height="110" rx="10" fill="#08234D"/>
      <rect x="390" y="760" width="120" height="160" rx="10" fill="#0D326B"/>
      <rect x="570" y="720" width="120" height="200" rx="10" fill="#144691"/>
      <rect x="750" y="685" width="120" height="235" rx="10" fill="#08234D"/>
      <rect x="930" y="655" width="120" height="265" rx="10" fill="#EA580C"/>
      <rect x="1110" y="615" width="120" height="305" rx="10" fill="#F97316"/>
      <!-- Rising Trend Arrow -->
      <polyline points="270,790 450,740 630,700 810,665 990,635 1170,590" fill="none" stroke="#F97316" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="1170" cy="590" r="14" fill="#EA580C"/>

      <text x="1310" y="700" font-family="Noto Sans" font-size="30" font-weight="800" fill="#08234D">Keamanan Zero-Trust</text>
      <text x="1310" y="752" font-family="Noto Sans" font-size="24" fill="#475569">• Cloud Firestore Real-Time</text>
      <text x="1310" y="798" font-family="Noto Sans" font-size="24" fill="#475569">• Isolasi Data per Pemilik Usaha</text>
      <text x="1310" y="844" font-family="Noto Sans" font-size="24" fill="#475569">• Siap Pilot 38 KADIN Provinsi</text>
    </svg>`,
    [{ input: logoSmall, left: 120, top: 18 }]
  )
);

// SCENE 7: CLOSING CTA
scenes.push(
  await renderScene(
    'scene7.png',
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g7" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stop-color="#144691" stop-opacity="0.75"/>
          <stop offset="100%" stop-color="#051633" stop-opacity="1"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="#051633"/>
      <rect width="${W}" height="${H}" fill="url(#g7)"/>
      <rect x="802" y="132" width="316" height="316" rx="60" fill="#08234D" stroke="#F97316" stroke-width="4"/>

      <text x="960" y="565" text-anchor="middle" font-family="Noto Sans" font-size="112" font-weight="800" fill="#FFFFFF">KADIN <tspan fill="#F97316">DIGI</tspan></text>
      <text x="960" y="640" text-anchor="middle" font-family="Noto Sans" font-size="38" font-weight="700" fill="#DBEAFE">Si KADI — Robot Sahabat UMKM</text>
      <text x="960" y="720" text-anchor="middle" font-family="Noto Sans" font-size="30" fill="#CBD5E1">Mari Bersinergi Bersama Kamar Dagang dan Industri Indonesia</text>

      <rect x="0" y="920" width="${W}" height="160" fill="#08234D"/>
      <rect x="0" y="920" width="${W}" height="4" fill="#F97316"/>
      <text x="960" y="1018" text-anchor="middle" font-family="Noto Sans" font-size="52" font-weight="800" fill="#FFFFFF">UMKM Naik Kelas   <tspan fill="#64748B">|</tspan>   <tspan fill="#FB923C">Bisnis Makin Cuan</tspan></text>
    </svg>`,
    [{ input: logoHero, left: 810, top: 140 }]
  )
);

console.log('Generating soundtrack WAV...');
const sceneDur = 6; // 6s per scene
const fadeDur = 0.7;
const totalVideoDur = scenes.length * sceneDur - (scenes.length - 1) * fadeDur; // ~37.8s
const wavPath = path.join(TMP_DIR, 'soundtrack.wav');
generateBackgroundAudio(wavPath, totalVideoDur + 0.5);

console.log('Encoding Full HD 1080p MP4 with smooth crossfade transitions via FFmpeg...');
const args = ['-y'];
for (const sc of scenes) {
  args.push('-loop', '1', '-t', String(sceneDur), '-i', sc);
}
args.push('-i', wavPath);

const filterParts = [];
for (let i = 0; i < scenes.length; i++) {
  filterParts.push(`[${i}:v]fps=30,format=yuv420p,setsar=1[v${i}]`);
}

let prevLabel = 'v0';
for (let i = 1; i < scenes.length; i++) {
  const offset = Number((i * (sceneDur - fadeDur)).toFixed(2));
  const outLabel = i === scenes.length - 1 ? 'vout' : `xf${i}`;
  filterParts.push(
    `[${prevLabel}][v${i}]xfade=transition=fade:duration=${fadeDur}:offset=${offset}[${outLabel}]`
  );
  prevLabel = outLabel;
}

args.push(
  '-filter_complex',
  filterParts.join(';'),
  '-map',
  '[vout]',
  '-map',
  `${scenes.length}:a`,
  '-c:v',
  'libx264',
  '-preset',
  'medium',
  '-crf',
  '20',
  '-pix_fmt',
  'yuv420p',
  '-c:a',
  'aac',
  '-b:a',
  '192k',
  '-shortest',
  '-movflags',
  '+faststart',
  OUT_MP4
);

execFileSync('ffmpeg', args, { stdio: 'inherit' });
fs.rmSync(TMP_DIR, { recursive: true, force: true });
console.log('Generated Promotional Video MP4:', OUT_MP4);
