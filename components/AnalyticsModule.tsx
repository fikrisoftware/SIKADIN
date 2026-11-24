'use client';

import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle, BarChart3, Download } from 'lucide-react';
import { useAppData } from './AuthContext';
import {
  formatCompactRupiah,
  formatDateID,
  formatRupiah,
  todayISO,
} from '@/lib/types';

type PeriodKey = 'today' | '7d' | '30d' | 'all';

export function AnalyticsModule() {
  const { transactions, products, customers } = useAppData();
  const [period, setPeriod] = useState<PeriodKey>('7d');

  const completedTxs = useMemo(() => {
    const minDate =
      period === 'today'
        ? todayISO(0)
        : period === '7d'
          ? todayISO(-6)
          : period === '30d'
            ? todayISO(-29)
            : '';

    return transactions.filter((t) => {
      if (t.status !== 'Selesai') return false;
      if (!minDate) return true;
      return t.saleDate >= minDate;
    });
  }, [transactions, period]);

  const kpis = useMemo(() => {
    const revenue = completedTxs.reduce((s, t) => s + t.total, 0);
    const profit = completedTxs.reduce((s, t) => s + t.profit, 0);
    const txCount = completedTxs.length;
    const unitsSold = completedTxs.reduce((s, t) => s + t.itemCount, 0);
    const aov = txCount > 0 ? Math.round(revenue / txCount) : 0;
    const grossMargin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
    return { revenue, profit, txCount, unitsSold, aov, grossMargin };
  }, [completedTxs]);

  const dailySeries = useMemo(() => {
    const map = new Map<string, { date: string; label: string; omzet: number; laba: number; transaksi: number }>();

    if (period === '7d') {
      for (let i = 6; i >= 0; i--) {
        const iso = todayISO(-i);
        map.set(iso, {
          date: iso,
          label: iso.slice(5).split('-').reverse().join('/'),
          omzet: 0,
          laba: 0,
          transaksi: 0,
        });
      }
    }

    for (const tx of completedTxs) {
      const existing = map.get(tx.saleDate) || {
        date: tx.saleDate,
        label: tx.saleDate.slice(5).split('-').reverse().join('/'),
        omzet: 0,
        laba: 0,
        transaksi: 0,
      };
      existing.omzet += tx.total;
      existing.laba += tx.profit;
      existing.transaksi += 1;
      map.set(tx.saleDate, existing);
    }

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [completedTxs, period]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number; profit: number }>();
    for (const tx of completedTxs) {
      for (const item of tx.items) {
        const entry = map.get(item.productId) || {
          name: item.name,
          qty: 0,
          revenue: 0,
          profit: 0,
        };
        entry.qty += item.qty;
        entry.revenue += item.subtotal;
        entry.profit += (item.sellPrice - item.costPrice) * item.qty;
        map.set(item.productId, entry);
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [completedTxs]);

  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, { method: string; total: number; count: number }>();
    for (const tx of completedTxs) {
      const entry = map.get(tx.paymentMethod) || {
        method: tx.paymentMethod,
        total: 0,
        count: 0,
      };
      entry.total += tx.total;
      entry.count += 1;
      map.set(tx.paymentMethod, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [completedTxs]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { category: string; revenue: number; qty: number }>();
    for (const tx of completedTxs) {
      for (const item of tx.items) {
        const entry = map.get(item.category) || {
          category: item.category,
          revenue: 0,
          qty: 0,
        };
        entry.revenue += item.subtotal;
        entry.qty += item.qty;
        map.set(item.category, entry);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [completedTxs]);

  const topCustomers = useMemo(
    () => [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5),
    [customers]
  );

  const lowStockProducts = useMemo(
    () =>
      products
        .filter((p) => p.stock <= p.minStock)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 6),
    [products]
  );

  const exportCsv = () => {
    const header = [
      'No Struk',
      'Tanggal',
      'Pelanggan',
      'Metode Pembayaran',
      'Kode Voucher',
      'Jumlah Item',
      'Subtotal',
      'Diskon',
      'Total',
      'HPP',
      'Laba Kotor',
    ];
    const rows = completedTxs.map((tx) => [
      tx.receiptNo,
      tx.saleDate,
      `"${tx.customerName.replace(/"/g, '""')}"`,
      tx.paymentMethod,
      tx.promoCode || '-',
      tx.itemCount,
      tx.subtotal,
      tx.discount,
      tx.total,
      tx.totalCost,
      tx.profit,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-penjualan-si-dika-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Period Selector & CSV Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          {(
            [
              { id: 'today', label: 'Hari Ini' },
              { id: '7d', label: '7 Hari' },
              { id: '30d', label: '30 Hari' },
              { id: 'all', label: 'Semua' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPeriod(opt.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                period === opt.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={exportCsv}
          disabled={completedTxs.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Unduh Laporan CSV
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Omzet</p>
          <p className="text-2xl font-bold font-mono text-navy-900 mt-1 tabular-nums">
            {formatRupiah(kpis.revenue)}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {kpis.txCount} transaksi selesai
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Estimasi Laba Kotor</p>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {formatRupiah(kpis.profit)}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            Margin kotor rata-rata {kpis.grossMargin}%
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Rata-rata Keranjang (AOV)</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {formatRupiah(kpis.aov)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Nilai per struk belanja</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Produk Terjual</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {kpis.unitsSold.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-500 mt-1">Unit keluar pada periode ini</p>
        </div>
      </div>

      {completedTxs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-14 text-center">
          <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Belum ada data penjualan pada periode ini
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Catat transaksi pertama melalui meja Kasir (POS) atau pilih rentang waktu yang lebih
            panjang untuk melihat grafik kinerja usaha Anda.
          </p>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
              <div className="mb-5">
                <h3 className="text-base font-bold text-slate-900">Tren Omzet &amp; Laba Harian</h3>
                <p className="text-xs text-slate-500">
                  Perbandingan pendapatan kotor (biru KADIN) dan estimasi laba kotor (oranye DIGI)
                </p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCompactRupiah(Number(v))}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      width={78}
                    />
                    <Tooltip
                      formatter={(value: unknown, name: unknown) => [
                        formatRupiah(Number(value) || 0),
                        name === 'omzet' ? 'Omzet' : 'Laba Kotor',
                      ]}
                      labelFormatter={(label) => `Tanggal ${label}`}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="omzet"
                      stroke="#08234d"
                      strokeWidth={2.2}
                      fill="#144691"
                      fillOpacity={0.14}
                    />
                    <Area
                      type="monotone"
                      dataKey="laba"
                      stroke="#ea580c"
                      strokeWidth={2.2}
                      fill="#f97316"
                      fillOpacity={0.16}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
              <div className="mb-5">
                <h3 className="text-base font-bold text-slate-900">Produk Terlaris</h3>
                <p className="text-xs text-slate-500">
                  Berdasarkan total omzet penjualan pada periode terpilih
                </p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProducts}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => formatCompactRupiah(Number(v))}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
                      tick={{ fontSize: 11, fill: '#334155' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [formatRupiah(Number(value) || 0), 'Omzet']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="revenue" fill="#ea580c" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Breakdown Row: Payment Methods & Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Komposisi Metode Pembayaran
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Distribusi nilai transaksi berdasarkan kanal pembayaran pelanggan
              </p>
              <div className="space-y-4">
                {paymentBreakdown.map((item) => {
                  const pct =
                    kpis.revenue > 0 ? Math.round((item.total / kpis.revenue) * 100) : 0;
                  return (
                    <div key={item.method} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">
                          {item.method}{' '}
                          <span className="font-normal text-slate-500">({item.count} trx)</span>
                        </span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {formatRupiah(item.total)} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-navy-900 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1">Penjualan per Kategori</h3>
              <p className="text-xs text-slate-500 mb-5">
                Kontribusi omzet masing-masing kategori produk UMKM Anda
              </p>
              <div className="space-y-4">
                {categoryBreakdown.map((item) => {
                  const totalCatRev = categoryBreakdown.reduce((s, c) => s + c.revenue, 0);
                  const pct =
                    totalCatRev > 0 ? Math.round((item.revenue / totalCatRev) * 100) : 0;
                  return (
                    <div key={item.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">
                          {item.category}{' '}
                          <span className="font-normal text-slate-500">({item.qty} unit)</span>
                        </span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {formatRupiah(item.revenue)} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-kadin-orange rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Actionable Insights Row: Top Customers + Low Stock Restock List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Pelanggan Terbaik</h3>
            <p className="text-xs text-slate-500">
              Berdasarkan akumulasi nilai belanja di database pelanggan
            </p>
          </div>
          {topCustomers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Belum ada data pelanggan terdaftar.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topCustomers.map((c, idx) => (
                <div key={c.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-slate-400 w-5 tabular-nums">
                      0{idx + 1}.
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                      <p className="text-xs text-slate-500">
                        {c.segment} · {c.totalOrders} transaksi · Terakhir{' '}
                        {c.lastOrderAt ? formatDateID(c.lastOrderAt) : '-'}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-navy-900 tabular-nums shrink-0">
                    {formatRupiah(c.totalSpent)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Prioritas Restok Inventori</h3>
            <p className="text-xs text-slate-500">
              Produk dengan stok sama atau di bawah batas minimum
            </p>
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="p-8 text-center text-xs text-emerald-700 font-medium">
              Semua stok produk berada di atas batas minimum.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      {p.sku} · Minimum {p.minStock} {p.unit}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-mono font-semibold tabular-nums shrink-0 ${
                      p.stock <= 0 ? 'text-red-700' : 'text-amber-700'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Sisa {p.stock} {p.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
