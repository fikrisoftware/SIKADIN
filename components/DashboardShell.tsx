'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  Database,
  LogOut,
  Megaphone,
  Menu,
  Package,
  ShoppingCart,
  Store,
  Users,
  X,
} from 'lucide-react';
import { useAppData } from './AuthContext';
import { KadinDigiWordmark, SiKadiIcon } from './SiKadiBrand';
import { PosModule } from './PosModule';
import { InventoryModule } from './InventoryModule';
import { CustomersModule } from './CustomersModule';
import { MarketingModule } from './MarketingModule';
import { AnalyticsModule } from './AnalyticsModule';
import { StoreProfileModal } from './StoreProfileModal';
import { seedSampleUmkmData } from '@/lib/firestore-service';
import type { ActiveTab } from '@/lib/types';

const NAV_ITEMS: Array<{
  id: ActiveTab;
  label: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'pos',
    label: 'Kasir (POS)',
    title: 'Sistem Kasir (POS)',
    subtitle: 'Catat transaksi cepat, cetak struk digital, dan potong stok otomatis.',
    icon: ShoppingCart,
  },
  {
    id: 'inventory',
    label: 'Inventori & Stok',
    title: 'Manajemen Inventori & Stok',
    subtitle: 'Kelola katalog produk, HPP, margin laba, dan buku mutasi stok.',
    icon: Package,
  },
  {
    id: 'customers',
    label: 'Database Pelanggan',
    title: 'Database Pelanggan (CRM)',
    subtitle: 'Pantau riwayat belanja, segmen loyalitas, dan sapa pelanggan via WhatsApp.',
    icon: Users,
  },
  {
    id: 'marketing',
    label: 'Pemasaran Digital',
    title: 'Pemasaran Digital & Promo',
    subtitle: 'Atur kampanye promosi, kode voucher kasir, dan broadcast pelanggan.',
    icon: Megaphone,
  },
  {
    id: 'analytics',
    label: 'Analisis Kinerja',
    title: 'Analisis Penjualan & Kinerja',
    subtitle: 'Evaluasi omzet, laba kotor, produk terlaris, dan laporan CSV.',
    icon: BarChart3,
  },
];

export function DashboardShell() {
  const {
    user,
    dataLoading,
    storeProfile,
    products,
    customers,
    transactions,
    logout,
  } = useAppData();

  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  const currentNav = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];
  const isEmptyWorkspace =
    !dataLoading && products.length === 0 && customers.length === 0 && transactions.length === 0;

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  const handleSeedDemo = async () => {
    if (!user || seeding) return;
    setSeeding(true);
    setSeedError(null);
    try {
      await seedSampleUmkmData(user.uid, user.displayName || 'UMKM');
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : 'Gagal memuat data contoh.');
    } finally {
      setSeeding(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-navy-950 text-white border-r border-white/10">
      {/* Brand Lockup with Si KADI Robot */}
      <div className="px-5 h-16 border-b border-white/10 flex items-center gap-3 shrink-0">
        <SiKadiIcon size="sm" variant="dark" />
        <div className="min-w-0">
          <KadinDigiWordmark dark className="text-base block leading-none" />
          <p className="text-[11px] text-blue-200/80 mt-1 truncate">
            Si KADI · Robot Sahabat UMKM
          </p>
        </div>
      </div>

      {/* Store Identity Switcher */}
      <div className="px-4 py-3.5 border-b border-white/10">
        <button
          type="button"
          onClick={() => {
            setShowStoreModal(true);
            setMobileMenuOpen(false);
          }}
          className="w-full text-left px-3 py-2.5 rounded-lg bg-white/8 hover:bg-white/12 border border-white/12 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-white truncate">
              {storeProfile?.storeName || 'Atur Profil Usaha'}
            </span>
            <Store className="w-3.5 h-3.5 text-kadin-orange-light shrink-0" />
          </div>
          <p className="text-[11px] text-blue-200/75 truncate mt-0.5">
            {storeProfile?.category || 'Klik untuk melengkapi profil toko'}
          </p>
        </button>
      </div>

      {/* Primary Sidebar Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Menu Utama KADIN DIGI">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                active
                  ? 'bg-kadin-orange text-white font-semibold'
                  : 'text-blue-100/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {item.id === 'inventory' && lowStockCount > 0 && (
                <span
                  className={`font-mono text-[11px] font-semibold tabular-nums ${
                    active ? 'text-white' : 'text-kadin-orange-light'
                  }`}
                >
                  {lowStockCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Account & Sign Out Footer */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">
            {user?.displayName || 'Pemilik Usaha'}
          </p>
          <p className="text-[11px] text-blue-200/70 truncate">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-blue-100 bg-white/8 border border-white/15 rounded-lg hover:bg-white/14 hover:text-white transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar Akun
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f6fb] flex">
      {/* Desktop Fixed Sidebar (256px) */}
      <aside className="hidden lg:block w-64 shrink-0 fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-navy-950/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-3 top-3.5 z-20 p-2 text-blue-100 hover:text-white rounded-lg bg-navy-900"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Viewport Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Contextual Workspace Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 text-navy-900 hover:bg-slate-100 rounded-lg cursor-pointer"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="hidden sm:inline font-display font-bold text-navy-900">
                  KADIN <span className="text-kadin-orange">DIGI</span>
                </span>
                <span className="hidden sm:inline text-slate-300" aria-hidden="true">
                  /
                </span>
                <span className="font-semibold text-slate-900 truncate">{currentNav.title}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeTab !== 'pos' ? (
              <button
                type="button"
                onClick={() => setActiveTab('pos')}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-kadin-orange text-white text-xs font-semibold rounded-lg hover:bg-kadin-orange-hover transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Buka Kasir
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowStoreModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-navy-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-kadin-orange" />
                Profil Usaha
              </button>
            )}
          </div>
        </header>

        {/* Workspace Main Body */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-navy-900 tracking-tight">
                {currentNav.title}
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">{currentNav.subtitle}</p>
            </div>
            <p className="text-xs font-medium text-slate-500">
              <span className="text-navy-900 font-semibold">UMKM Naik Kelas</span>
              <span className="mx-1.5 text-slate-300" aria-hidden="true">
                |
              </span>
              <span className="text-kadin-orange font-semibold">Bisnis Makin Cuan</span>
            </p>
          </div>

          {/* Empty Store 1-Click Sample UMKM Seeder Banner */}
          {isEmptyWorkspace && (
            <div className="bg-navy-950 text-white border border-navy-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <SiKadiIcon size="md" variant="dark" />
                <div>
                  <h2 className="text-base font-bold text-white">
                    Halo, saya Si KADI — Robot Sahabat UMKM Anda
                  </h2>
                  <p className="text-sm text-blue-100/85 mt-1 max-w-2xl">
                    Akun KADIN DIGI Anda siap dipakai. Tambahkan produk pertama sendiri atau muat
                    data contoh UMKM (katalog produk, pelanggan, voucher, dan transaksi 7 hari)
                    untuk mencoba seluruh fitur sekarang.
                  </p>
                  {seedError && <p className="text-xs text-red-300 mt-2">{seedError}</p>}
                </div>
              </div>
              <button
                type="button"
                disabled={seeding}
                onClick={handleSeedDemo}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-kadin-orange text-white text-xs font-semibold rounded-lg hover:bg-kadin-orange-hover disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                {seeding ? 'Menyiapkan Data...' : 'Isi Data Contoh UMKM'}
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {dataLoading ? (
            <div className="space-y-4" aria-busy="true" aria-label="Memuat data KADIN DIGI">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-28 bg-white border border-slate-200 rounded-xl p-5 animate-pulse"
                  >
                    <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
                    <div className="h-7 w-32 bg-slate-200 rounded mb-2" />
                    <div className="h-3 w-20 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
              <div className="h-96 bg-white border border-slate-200 rounded-xl animate-pulse" />
            </div>
          ) : (
            <>
              {activeTab === 'pos' && (
                <PosModule onNavigateInventory={() => setActiveTab('inventory')} />
              )}
              {activeTab === 'inventory' && <InventoryModule />}
              {activeTab === 'customers' && <CustomersModule />}
              {activeTab === 'marketing' && <MarketingModule />}
              {activeTab === 'analytics' && <AnalyticsModule />}
            </>
          )}
        </main>
      </div>

      {/* Store Profile Modal */}
      {showStoreModal && user && (
        <StoreProfileModal
          ownerId={user.uid}
          profile={storeProfile}
          defaultName={
            user.displayName ? `Usaha ${user.displayName.split(' ')[0]}` : 'Toko UMKM Saya'
          }
          onClose={() => setShowStoreModal(false)}
        />
      )}
    </div>
  );
}
