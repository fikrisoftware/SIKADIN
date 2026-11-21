'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Search,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAppData } from './AuthContext';
import {
  formatCompactRupiah,
  formatRupiah,
  ROLE_META,
  USER_ROLES,
  type ActiveTab,
  type UserRole,
} from '@/lib/types';

interface HqOverviewModuleProps {
  onSelectStoreWorkspace: (ownerId: string, nextTab?: ActiveTab) => void;
  onNavigateAccess: () => void;
}

export function HqOverviewModule({
  onSelectStoreWorkspace,
  onNavigateAccess,
}: HqOverviewModuleProps) {
  const {
    user,
    effectiveRole,
    activeWorkspaceId,
    allStores,
    hqTransactions,
    roleProfiles,
  } = useAppData();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');

  const completedHqTx = useMemo(
    () => hqTransactions.filter((t) => t.status === 'Selesai'),
    [hqTransactions]
  );

  const metrics = useMemo(() => {
    const totalRevenue = completedHqTx.reduce((sum, t) => sum + t.total, 0);
    const totalProfit = completedHqTx.reduce((sum, t) => sum + t.profit, 0);
    const activeUsers = roleProfiles.filter((r) => r.status === 'Aktif').length;
    const roleCounts: Record<UserRole, number> = {
      kasir: 0,
      pemilik: 0,
      admin_pusat: 0,
      super_admin_pusat: 0,
    };
    for (const rp of roleProfiles) {
      roleCounts[rp.role] = (roleCounts[rp.role] || 0) + 1;
    }
    return {
      totalStores: allStores.length,
      totalTransactions: completedHqTx.length,
      totalRevenue,
      totalProfit,
      activeUsers,
      roleCounts,
    };
  }, [allStores.length, completedHqTx, roleProfiles]);

  const storeStatsMap = useMemo(() => {
    const map = new Map<
      string,
      { txCount: number; revenue: number; profit: number; staffCount: number }
    >();
    for (const tx of completedHqTx) {
      const cur = map.get(tx.ownerId) || { txCount: 0, revenue: 0, profit: 0, staffCount: 0 };
      cur.txCount += 1;
      cur.revenue += tx.total;
      cur.profit += tx.profit;
      map.set(tx.ownerId, cur);
    }
    for (const rp of roleProfiles) {
      const cur = map.get(rp.workspaceOwnerId) || {
        txCount: 0,
        revenue: 0,
        profit: 0,
        staffCount: 0,
      };
      if (rp.status === 'Aktif') cur.staffCount += 1;
      map.set(rp.workspaceOwnerId, cur);
    }
    return map;
  }, [completedHqTx, roleProfiles]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of allStores) set.add(s.category);
    return ['Semua', ...Array.from(set)];
  }, [allStores]);

  const filteredStores = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allStores.filter((s) => {
      const matchCat = categoryFilter === 'Semua' || s.category === categoryFilter;
      const matchQ =
        !q ||
        s.storeName.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [allStores, categoryFilter, search]);

  const roleMeta = ROLE_META[effectiveRole];

  return (
    <div className="space-y-6">
      {/* Executive HQ Identity Strip */}
      <div className="bg-navy-950 text-white border border-navy-800 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0">
            <img
              src="/assets/aistudio/image_33c655e3.png"
              alt="Logo KADIN Indonesia"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                Pusat Kendali Nasional · KADIN Indonesia
              </span>
              <span className="text-white/30" aria-hidden="true">
                ·
              </span>
              <span className="text-xs font-semibold text-kadin-orange-light">
                {roleMeta.label}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
              Monitoring Ekosistem UMKM KADIN DIGI
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/80 mt-1 max-w-2xl">
              Pantau pertumbuhan omzet, transaksi real-time seluruh UMKM binaan, serta masuk ke ruang
              kerja toko mana pun untuk pendampingan operasional dan tata kelola akses.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateAccess}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-kadin-orange text-white text-xs font-semibold rounded-lg hover:bg-kadin-orange-hover transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
          Kelola Peran &amp; Akses Tim
        </button>
      </div>

      {/* National KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">UMKM Terdaftar</span>
            <Store className="w-4 h-4 text-navy-900" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1.5 tabular-nums">
            {metrics.totalStores}
          </p>
          <p className="text-xs text-slate-500 mt-1">Gerai aktif di ekosistem</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Omzet Nasional (Selesai)</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-bold font-mono text-navy-900 mt-1.5 tabular-nums">
            {formatCompactRupiah(metrics.totalRevenue)}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {metrics.totalTransactions.toLocaleString('id-ID')} transaksi tercatat
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Estimasi Laba Kotor</span>
            <Building2 className="w-4 h-4 text-kadin-orange" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1.5 tabular-nums">
            {formatCompactRupiah(metrics.totalProfit)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Akumulasi margin seluruh UMKM</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Akun Pengguna Aktif</span>
            <Users className="w-4 h-4 text-navy-900" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1.5 tabular-nums">
            {metrics.activeUsers}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            Dari {roleProfiles.length} total akun terdaftar
          </p>
        </div>
      </div>

      {/* Role Distribution Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {USER_ROLES.map((roleKey) => {
          const meta = ROLE_META[roleKey];
          return (
            <div
              key={roleKey}
              className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{meta.label}</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{meta.scope}</p>
              </div>
              <span className="font-mono text-lg font-extrabold text-navy-900 tabular-nums shrink-0">
                {metrics.roleCounts[roleKey]}
              </span>
            </div>
          );
        })}
      </div>

      {/* UMKM Store Directory with 1-Click Workspace Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Direktori Usaha UMKM Binaan KADIN ({filteredStores.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih toko untuk meninjau kasir, stok inventori, pelanggan, dan laporan kinerjanya.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama toko atau kota..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-navy-900"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'Semua' ? 'Semua Sektor' : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredStores.length === 0 ? (
          <div className="p-12 text-center">
            <Store className="w-9 h-9 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-900">
              {allStores.length === 0
                ? 'Belum ada profil toko UMKM yang tersimpan'
                : 'Tidak ada toko yang sesuai filter pencarian'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Profil toko akan muncul otomatis di sini segera setelah Pemilik Usaha melengkapi profil
              usaha atau memuat data contoh UMKM.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Nama Usaha UMKM</th>
                  <th className="py-3 px-4">Sektor</th>
                  <th className="py-3 px-4">Kontak &amp; Lokasi</th>
                  <th className="py-3 px-4 text-right">Tim Aktif</th>
                  <th className="py-3 px-4 text-right">Transaksi</th>
                  <th className="py-3 px-4 text-right">Total Omzet</th>
                  <th className="py-3 px-4 text-right">Ruang Kerja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStores.map((store) => {
                  const stats = storeStatsMap.get(store.ownerId) || {
                    txCount: 0,
                    revenue: 0,
                    profit: 0,
                    staffCount: 0,
                  };
                  const isCurrent = activeWorkspaceId === store.ownerId;
                  const isOwn = user?.uid === store.ownerId;

                  return (
                    <tr
                      key={store.ownerId}
                      className={isCurrent ? 'bg-navy-50/50' : 'hover:bg-slate-50/80'}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{store.storeName}</p>
                          {isOwn && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-navy-900 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                              Milik Anda
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate max-w-[240px]">
                          {store.tagline || 'UMKM Binaan KADIN DIGI'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap">
                        {store.category}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <p className="font-mono">{store.phone || '-'}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                          {store.address || 'Alamat belum diisi'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums">
                        {stats.staffCount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums">
                        {stats.txCount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-navy-900 tabular-nums whitespace-nowrap">
                        {formatRupiah(stats.revenue)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Sedang Dibuka
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectStoreWorkspace(store.ownerId, 'analytics')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-navy-900 rounded-lg hover:bg-navy-800 transition-colors cursor-pointer"
                          >
                            Tinjau Toko
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
