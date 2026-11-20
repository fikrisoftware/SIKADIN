'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownUp,
  Edit3,
  History,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useAppData } from './AuthContext';
import {
  adjustProductStock,
  createProduct,
  deleteProduct,
  updateProduct,
} from '@/lib/firestore-service';
import {
  formatRupiah,
  formatTimestampID,
  LIMITS,
  PRODUCT_CATEGORIES,
  type Product,
  type ProductCategory,
  type StockLogType,
} from '@/lib/types';

const IMAGE_PRESETS = [
  { label: 'Tanpa Foto', value: '' },
  { label: 'Foto Minuman / Kopi', value: '/images/prod-kopi-susu.jpg' },
  { label: 'Foto Makanan / Snack', value: '/images/prod-keripik-tempe.jpg' },
  { label: 'Foto Fashion / Batik', value: '/images/prod-batik-scarf.jpg' },
];

export function InventoryModule() {
  const { user, products, stockLogs } = useAppData();

  const [tab, setTab] = useState<'produk' | 'mutasi'>('produk');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [stockFilter, setStockFilter] = useState<'semua' | 'menipis' | 'habis'>('semua');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  // Product Form State
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Kuliner');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [unit, setUnit] = useState('pcs');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Stock Adjust State
  const [adjType, setAdjType] = useState<StockLogType>('masuk');
  const [adjQty, setAdjQty] = useState('10');
  const [adjNote, setAdjNote] = useState('');
  const [adjSaving, setAdjSaving] = useState(false);

  const summary = useMemo(() => {
    const totalSku = products.length;
    const totalUnits = products.reduce((s, p) => s + p.stock, 0);
    const inventoryValue = products.reduce((s, p) => s + p.costPrice * p.stock, 0);
    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
    const outOfStockCount = products.filter((p) => p.stock <= 0).length;
    return { totalSku, totalUnits, inventoryValue, lowStockCount, outOfStockCount };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchCat = categoryFilter === 'Semua' || p.category === categoryFilter;
      const matchStock =
        stockFilter === 'semua'
          ? true
          : stockFilter === 'habis'
            ? p.stock <= 0
            : p.stock > 0 && p.stock <= p.minStock;
      return matchSearch && matchCat && matchStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setSku(`PRD-${String(products.length + 1).padStart(3, '0')}`);
    setName('');
    setCategory('Kuliner');
    setCostPrice('');
    setSellPrice('');
    setStock('10');
    setMinStock('5');
    setUnit('pcs');
    setImageUrl('');
    setIsActive(true);
    setFormError(null);
    setShowProductModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setSku(p.sku);
    setName(p.name);
    setCategory(p.category);
    setCostPrice(String(p.costPrice));
    setSellPrice(String(p.sellPrice));
    setStock(String(p.stock));
    setMinStock(String(p.minStock));
    setUnit(p.unit);
    setImageUrl(p.imageUrl);
    setIsActive(p.isActive);
    setFormError(null);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      setFormError('Nama produk wajib diisi.');
      return;
    }
    const sellNum = Number(sellPrice) || 0;
    const costNum = Number(costPrice) || 0;
    if (sellNum < 0 || costNum < 0) {
      setFormError('Harga tidak boleh negatif.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        sku: sku.trim() || `PRD-${Date.now().toString().slice(-4)}`,
        name: name.trim(),
        category,
        costPrice: costNum,
        sellPrice: sellNum,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        unit: unit.trim() || 'pcs',
        imageUrl: imageUrl.trim(),
        isActive,
      };
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(user.uid, payload);
      }
      setShowProductModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan produk.');
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !adjustingProduct) return;
    const qtyNum = Math.abs(Number(adjQty) || 0);
    if (qtyNum === 0) return;

    const delta = adjType === 'keluar' ? -qtyNum : qtyNum;
    setAdjSaving(true);
    try {
      await adjustProductStock(
        user.uid,
        adjustingProduct,
        delta,
        adjType,
        adjNote.trim() || (adjType === 'masuk' ? 'Restok pemasok' : 'Penyesuaian stok keluar')
      );
      setAdjustingProduct(null);
      setAdjNote('');
      setAdjQty('10');
    } finally {
      setAdjSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    await deleteProduct(p.id);
  };

  return (
    <div className="space-y-6">
      {/* KPI Strip — Flat, single-elevation structured metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Katalog Produk</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {summary.totalSku}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {summary.totalUnits} unit tersedia
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Nilai Aset Inventori (HPP)</p>
          <p className="text-2xl font-bold font-mono text-navy-900 mt-1 tabular-nums">
            {formatRupiah(summary.inventoryValue)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Modal tertanam di gudang</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Stok Menipis</p>
          <p className="text-2xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
            {summary.lowStockCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Di bawah batas minimum</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Stok Habis</p>
          <p className="text-2xl font-bold font-mono text-red-700 mt-1 tabular-nums">
            {summary.outOfStockCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Perlu segera restok</p>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          <button
            type="button"
            onClick={() => setTab('produk')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              tab === 'produk'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            Daftar Produk ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('mutasi')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              tab === 'mutasi'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            Riwayat Mutasi ({stockLogs.length})
          </button>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-kadin-orange text-white text-sm font-semibold rounded-lg hover:bg-kadin-orange-hover transition-colors whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Produk
        </button>
      </div>

      {tab === 'produk' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk atau SKU..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700"
              >
                <option value="Semua">Semua Kategori</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                {(
                  [
                    { id: 'semua', label: 'Semua' },
                    { id: 'menipis', label: 'Menipis' },
                    { id: 'habis', label: 'Habis' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStockFilter(f.id)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      stockFilter === f.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-9 h-9 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-900 mb-1">
                {products.length === 0
                  ? 'Inventori masih kosong'
                  : 'Tidak ada produk sesuai filter'}
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Mulai catat katalog barang jualan Anda agar stok dan margin laba terpantau otomatis.
              </p>
              {products.length === 0 && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-navy-900 text-white text-xs font-semibold rounded-lg hover:bg-navy-800 cursor-pointer"
                >
                  Tambah Produk Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Produk &amp; SKU</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-right">HPP</th>
                    <th className="py-3 px-4 text-right">Harga Jual</th>
                    <th className="py-3 px-4 text-right">Margin</th>
                    <th className="py-3 px-4 text-right">Stok</th>
                    <th className="py-3 px-4">Kondisi</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const marginPct =
                      p.sellPrice > 0
                        ? Math.round(((p.sellPrice - p.costPrice) / p.sellPrice) * 100)
                        : 0;
                    const isOut = p.stock <= 0;
                    const isLow = !isOut && p.stock <= p.minStock;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="text-xs font-mono text-slate-500">
                            {p.sku}
                            {!p.isActive ? ' · Nonaktif di kasir' : ''}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                          {p.category}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                          {formatRupiah(p.costPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          {formatRupiah(p.sellPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs text-emerald-700 tabular-nums whitespace-nowrap">
                          {marginPct}%
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          {p.stock} {p.unit}
                        </td>
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Habis
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Menipis
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium">Aman</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setAdjustingProduct(p);
                                setAdjType('masuk');
                                setAdjQty('10');
                                setAdjNote('');
                              }}
                              className="p-1.5 text-slate-600 hover:text-navy-900 hover:bg-slate-100 rounded-md cursor-pointer"
                              title="Atur Stok Masuk/Keluar"
                              aria-label={`Atur stok ${p.name}`}
                            >
                              <ArrowDownUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-slate-600 hover:text-navy-900 hover:bg-slate-100 rounded-md cursor-pointer"
                              title="Edit Produk"
                              aria-label={`Edit ${p.name}`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                              title="Hapus Produk"
                              aria-label={`Hapus ${p.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Stock Mutation Ledger */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Buku Mutasi Stok (Audit Log)</h3>
            <p className="text-xs text-slate-500">
              Setiap penjualan kasir, restok pemasok, dan penyesuaian tercatat secara permanen.
            </p>
          </div>
          {stockLogs.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Belum ada riwayat pergerakan stok.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Produk</th>
                    <th className="py-3 px-4">Jenis</th>
                    <th className="py-3 px-4 text-right">Perubahan</th>
                    <th className="py-3 px-4 text-right">Stok Akhir</th>
                    <th className="py-3 px-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap tabular-nums">
                        {formatTimestampID(log.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{log.productName}</td>
                      <td className="py-3 px-4 text-xs capitalize text-slate-600">{log.type}</td>
                      <td
                        className={`py-3 px-4 text-right font-mono text-xs font-semibold tabular-nums ${
                          log.delta >= 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {log.delta >= 0 ? `+${log.delta}` : log.delta}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-900 tabular-nums">
                        {log.stockAfter}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">{log.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Produk Inventori' : 'Tambah Produk Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Kode SKU
                  </label>
                  <input
                    type="text"
                    value={sku}
                    maxLength={LIMITS.SKU_MAX}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-navy-900"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Produk
                </label>
                <input
                  type="text"
                  value={name}
                  maxLength={LIMITS.NAME_MAX}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Contoh: Es Kopi Susu Gula Aren"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Harga Beli / HPP (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Stok</label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Stok Min.</label>
                  <input
                    type="number"
                    min={0}
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={unit}
                    maxLength={LIMITS.UNIT_MAX}
                    onChange={(e) => setUnit(e.target.value)}
                    required
                    placeholder="pcs / botol"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Foto Katalog Produk
                </label>
                <select
                  value={IMAGE_PRESETS.some((x) => x.value === imageUrl) ? imageUrl : ''}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-navy-900"
                >
                  {IMAGE_PRESETS.map((preset) => (
                    <option key={preset.label} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Tampilkan produk ini di meja kasir POS
              </label>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-kadin-orange rounded-lg hover:bg-kadin-orange-hover disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Atur Stok Produk</h3>
                <p className="text-xs text-slate-500">
                  {adjustingProduct.name} · Saat ini {adjustingProduct.stock}{' '}
                  {adjustingProduct.unit}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Jenis Mutasi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjType('masuk')}
                    className={`py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                      adjType === 'masuk'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Stok Masuk (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType('keluar')}
                    className={`py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                      adjType === 'keluar'
                        ? 'bg-red-700 text-white border-red-700'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Stok Keluar (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Jumlah ({adjustingProduct.unit})
                </label>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={adjQty}
                  onChange={(e) => setAdjQty(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Catatan Mutasi
                </label>
                <input
                  type="text"
                  value={adjNote}
                  maxLength={LIMITS.NOTE_MAX}
                  onChange={(e) => setAdjNote(e.target.value)}
                  placeholder="Misal: Restok dari pemasok atau barang rusak"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={adjSaving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-navy-900 rounded-lg hover:bg-navy-800 disabled:opacity-60 cursor-pointer"
                >
                  {adjSaving ? 'Memproses...' : 'Simpan Mutasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
