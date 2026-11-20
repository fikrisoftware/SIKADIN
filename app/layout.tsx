import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KADIN DIGI — UMKM Naik Kelas, Bisnis Makin Cuan',
  description:
    'KADIN DIGI bersama Si KADI (Sistem Kasir dan Inventori): Kasir POS, Inventori, Database Pelanggan, Pemasaran Digital, dan Analisis Kinerja bekerja sama dengan KADIN Indonesia.',
  openGraph: {
    title: 'KADIN DIGI — UMKM Naik Kelas, Bisnis Makin Cuan',
    description:
      'Platform terpadu Kasir UMKM, Inventory, CRM Pelanggan, Pemasaran Digital, dan Analisis Kinerja Bisnis.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KADIN DIGI — UMKM Naik Kelas, Bisnis Makin Cuan',
    description:
      'Platform terpadu Kasir UMKM, Inventory, CRM Pelanggan, Pemasaran Digital, dan Analisis Kinerja Bisnis.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/images/si-kadi-logo.jpg" type="image/jpeg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
