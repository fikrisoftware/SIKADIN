'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Megaphone,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { useAppData } from './AuthContext';
import { KadinDigiWordmark, SiKadiIcon } from './SiKadiBrand';
import { PresentationKitModule } from './PresentationKitModule';

const CAPABILITIES = [
  {
    id: '01',
    icon: ShoppingCart,
    title: 'Kasir POS & Inventory',
    desc: 'Proses transaksi cepat dengan QRIS, Tunai, dan Transfer sambil memotong stok warung serta mencatat mutasi secara otomatis.',
  },
  {
    id: '02',
    icon: Users,
    title: 'Database Pelanggan',
    desc: 'Simpan riwayat belanja, nomor WhatsApp, poin loyalitas, dan segmentasi pelanggan dari Reguler hingga VIP serta Reseller.',
  },
  {
    id: '03',
    icon: Megaphone,
    title: 'Pemasaran Digital',
    desc: 'Buat kode voucher terhubung langsung ke kasir, susun pesan promosi WhatsApp tersegmentasi, dan pantau penukarannya.',
  },
  {
    id: '04',
    icon: BarChart3,
    title: 'Analisis Penjualan & Kinerja',
    desc: 'Pantau omzet harian, estimasi laba kotor berbasis HPP, produk terlaris, metode bayar, hingga ekspor laporan CSV.',
  },
];

export function WelcomeScreen() {
  const { signInWithGoogle, signingIn, authError } = useAppData();
  const [heroError, setHeroError] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-900 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract — Deep KADIN Navy */}
      <header className="bg-navy-950 border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a href="#beranda" className="whitespace-nowrap shrink-0">
            <KadinDigiWordmark dark className="text-xl" />
          </a>

          {/* Zone 2: 4 Clean Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-blue-100/80">
            <a
              href="#fitur"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Kasir &amp; Stok
            </a>
            <a
              href="#fitur"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Pelanggan
            </a>
            <a
              href="#fitur"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Pemasaran
            </a>
            <a
              href="#si-kadi"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Si KADI
            </a>
            <a
              href="#materi-kadin"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Materi KADIN
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={signingIn}
              className="px-4 py-2 bg-kadin-orange text-white text-sm font-semibold rounded-lg hover:bg-kadin-orange-hover disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {signingIn ? 'Menghubungkan...' : 'Masuk Kasir'}
            </button>
          </div>
        </div>
      </header>

      {/* Deep KADIN Blue Hero Section matching Reference Poster */}
      <main id="beranda" className="flex-1">
        <section className="kadin-hero-bg text-white border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Content Column */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                <div className="flex items-center gap-3.5 mb-6">
                  <SiKadiIcon size="md" variant="dark" />
                  <div className="text-sm text-blue-100">
                    <span className="font-bold text-white">Si KADI</span>
                    <span className="mx-2 text-blue-300/50" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-blue-200">Robot Sahabat UMKM · KADIN Indonesia</span>
                  </div>
                </div>

                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.12] [text-wrap:balance] max-w-2xl mb-5">
                  <span className="text-white">UMKM Naik Kelas, </span>
                  <span className="text-kadin-orange-light">Bisnis Makin Cuan</span>
                </h1>

                <p className="text-base sm:text-lg text-blue-100/85 leading-relaxed max-w-xl mb-8">
                  Platform kasir digital terpadu untuk warung, kedai, dan pelaku UMKM Indonesia.
                  Kelola transaksi harian, stok inventori, database pelanggan, promosi digital, dan
                  analisis kinerja usaha dalam satu ruang kerja.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    disabled={signingIn}
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-kadin-orange text-white text-sm font-semibold rounded-lg hover:bg-kadin-orange-hover disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#ffffff"
                        d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.48-1.71 4.35-5.27 4.35-3.17 0-5.76-2.63-5.76-5.87s2.59-5.87 5.76-5.87c1.81 0 3.02.77 3.71 1.43l2.53-2.44C16.79 4.1 14.69 3.2 12.17 3.2 7.21 3.2 3.2 7.21 3.2 12.17s4.01 8.97 8.97 8.97c5.18 0 8.62-3.64 8.62-8.77 0-.59-.06-1.04-.14-1.27z"
                      />
                    </svg>
                    <span>{signingIn ? 'Membuka Akun Google...' : 'Mulai dengan Akun Google'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {authError && (
                  <p
                    role="alert"
                    className="mt-4 text-sm text-red-100 bg-red-950/60 border border-red-400/40 rounded-lg px-4 py-2.5 max-w-md"
                  >
                    {authError}
                  </p>
                )}

                <div className="mt-8 pt-6 border-t border-white/15 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-blue-200/80">
                  <span>Sinkronisasi cloud real-time</span>
                  <span aria-hidden="true">·</span>
                  <span>Struk digital &amp; cetak kasir</span>
                  <span aria-hidden="true">·</span>
                  <span>Data contoh UMKM siap pakai</span>
                </div>
              </div>

              {/* Right Visual Column: Official KADIN DIGI & Si KADI Reference Artwork */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                <div className="w-full max-w-[460px] aspect-square rounded-2xl overflow-hidden border border-white/15 bg-navy-900">
                  {!heroError ? (
                    <img
                      src="/assets/aistudio/image_0a4c7de4.png"
                      alt="KADIN DIGI — Si KADI Robot Sahabat UMKM, UMKM Naik Kelas Bisnis Makin Cuan"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-10 bg-navy-900 text-white">
                      <Bot className="w-12 h-12 mb-3 text-kadin-orange-light" />
                      <p className="font-display font-bold text-lg">KADIN DIGI · Si KADI</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full-Width 4-Pillar Capability Strip Below Hero Split */}
        <section id="fitur" className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="max-w-2xl mb-10">
              <p className="text-sm font-semibold text-kadin-orange mb-2">Empat Pilar Operasional</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight [text-wrap:balance]">
                Semua kebutuhan kasir dan pertumbuhan usaha dalam satu aplikasi
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {CAPABILITIES.map((cap) => {
                const Icon = cap.icon;
                return (
                  <div key={cap.id} className="flex flex-col">
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                      <span className="font-mono text-xs font-semibold text-kadin-orange tabular-nums">
                        {cap.id}.
                      </span>
                      <Icon className="w-5 h-5 text-navy-800" />
                    </div>
                    <h3 className="text-base font-bold text-navy-900 mb-2">{cap.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{cap.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Si KADI Spotlight Section */}
        <section id="si-kadi" className="max-w-7xl mx-auto px-6 py-14">
          <div className="bg-navy-950 text-white border border-navy-800 rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex items-start gap-5 max-w-2xl">
              <SiKadiIcon size="lg" variant="dark" />
              <div>
                <h2 className="text-xl font-bold text-white mb-1.5">
                  Si KADI — Robot Sahabat UMKM
                </h2>
                <p className="text-sm text-blue-100/85 leading-relaxed">
                  Hadir mendampingi warung dan pelaku usaha lokal mencatat transaksi lebih cepat,
                  menjaga stok tetap aman, merawat pelanggan setia, serta membaca arah pertumbuhan
                  omzet setiap hari.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={signingIn}
              className="px-5 py-3 bg-kadin-orange text-white text-sm font-semibold rounded-lg hover:bg-kadin-orange-hover disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Buka Dashboard KADIN DIGI
            </button>
          </div>
        </section>
        {/* Paket Presentasi KADIN Indonesia: Video Promosi, PPTX, PRD, TSD */}
        <section id="materi-kadin" className="max-w-7xl mx-auto px-6 pb-16">
          <div className="max-w-2xl mb-8">
            <p className="text-sm font-semibold text-kadin-orange mb-2">
              Dokumen &amp; Media Presentasi
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight [text-wrap:balance]">
              Materi Presentasi untuk Kamar Dagang dan Industri Indonesia
            </h2>
          </div>
          <PresentationKitModule compact />
        </section>
      </main>

      {/* Bottom Tagline Footer echoing Reference Banner */}
      <footer className="bg-navy-950 border-t border-white/10 text-blue-200/80">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5 font-display font-bold text-sm">
            <span className="text-white">UMKM Naik Kelas</span>
            <span className="text-white/30" aria-hidden="true">
              |
            </span>
            <span className="text-kadin-orange-light">Bisnis Makin Cuan</span>
          </div>
          <span>© {new Date().getFullYear()} KADIN DIGI · Si KADI Robot Sahabat UMKM</span>
        </div>
      </footer>
    </div>
  );
}
