'use client';

import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  CreditCard,
  History,
  Lock,
  Minus,
  Package,
  Plus,
  Printer,
  QrCode,
  Receipt,
  Search,
  ShoppingBag,
  Tag,
  Trash2,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';
import { useAppData } from './AuthContext';
import { checkoutTransaction, voidTransaction } from '@/lib/firestore-service';
import {
  formatDateID,
  formatRupiah,
  formatTimestampID,
  PAYMENT_METHODS,
  PRODUCT_CATEGORIES,
  type Campaign,
  type PaymentMethod,
  type Product,
  type Transaction,
  type TransactionItem,
} from '@/lib/types';

interface PosModuleProps {
  onNavigateInventory: () => void;
}

function ProductThumb({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);

  if (!product.imageUrl || failed) {
    return (
      <div className="w-full h-28 bg-slate-100 flex flex-col items-center justify-center text-slate-400">
        <Package className="w-6 h-6 mb-1" />
        <span className="text-[11px] font-mono">{product.sku}</span>
      </div>
    );
  }

  return (
    <div className="w-full h-28 bg-slate-100 overflow-hidden">
      <img
        src={product.imageUrl}
        alt={product.name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export function PosModule({ onNavigateInventory }: PosModuleProps) {
  const {
    user,
    activeWorkspaceId,
    permissions,
    storeProfile,
    products,
    customers,
    campaigns,
    transactions,
  } = useAppData();

  const [subView, setSubView] = useState<'kasir' | 'riwayat'>('kasir');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedCampaign, setAppliedCampaign] = useState<Campaign | null>(null);
  const [voucherFeedback, setVoucherFeedback] = useState<string | null>(null);
  const [manualDiscount, setManualDiscount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);

  const productsMap = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const activeProducts = useMemo(() => products.filter((p) => p.isActive), [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeProducts.filter((p) => {
      const matchCat = categoryFilter === 'Semua' || p.category === categoryFilter;
      const matchQuery =
        !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [activeProducts, categoryFilter, searchQuery]);

  const activeVoucherCampaigns = useMemo(
    () => campaigns.filter((c) => c.status === 'Aktif' && c.promoCode.trim().length > 0),
    [campaigns]
  );

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const subtotal = useMemo(() => cart.reduce((s, item) => s + item.subtotal, 0), [cart]);

  const computedDiscount = useMemo(() => {
    if (appliedCampaign) {
      return Math.round((subtotal * appliedCampaign.discountPercent) / 100);
    }
    const parsed = Number(manualDiscount.replace(/\D/g, '')) || 0;
    return Math.min(subtotal, Math.max(0, parsed));
  }, [appliedCampaign, manualDiscount, subtotal]);

  const grandTotal = Math.max(0, subtotal - computedDiscount);
  const cashNum = Number(cashReceived.replace(/\D/g, '')) || 0;
  const changeAmount = paymentMethod === 'Tunai' ? Math.max(0, cashNum - grandTotal) : 0;

  const addToCart = (product: Product) => {
    setCheckoutError(null);
    if (product.stock <= 0) {
      setCheckoutError(`Stok ${product.name} sedang habis.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          setCheckoutError(`Stok ${product.name} tersisa ${product.stock} ${product.unit}.`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.sellPrice }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category,
          qty: 1,
          sellPrice: product.sellPrice,
          costPrice: product.costPrice,
          subtotal: product.sellPrice,
        },
      ];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCheckoutError(null);
    const prod = productsMap.get(productId);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const nextQty = item.qty + delta;
          if (nextQty <= 0) return null;
          if (prod && nextQty > prod.stock) {
            setCheckoutError(`Stok ${prod.name} tersisa ${prod.stock} ${prod.unit}.`);
            return item;
          }
          return { ...item, qty: nextQty, subtotal: nextQty * item.sellPrice };
        })
        .filter((x): x is TransactionItem => x !== null)
    );
  };

  const handleQuickScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    const exact = activeProducts.find((p) => p.sku.toLowerCase() === q);
    if (exact) {
      addToCart(exact);
      setSearchQuery('');
    }
  };

  const applyVoucherCode = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) {
      setAppliedCampaign(null);
      setVoucherFeedback(null);
      return;
    }
    const found = activeVoucherCampaigns.find((c) => c.promoCode.toUpperCase() === code);
    if (!found) {
      setAppliedCampaign(null);
      setVoucherFeedback('Kode voucher tidak ditemukan atau kampanye belum aktif.');
      return;
    }
    setAppliedCampaign(found);
    setManualDiscount('');
    setVoucherFeedback(`Voucher ${found.promoCode} aktif: potongan ${found.discountPercent}%.`);
  };

  const clearVoucher = () => {
    setAppliedCampaign(null);
    setVoucherInput('');
    setVoucherFeedback(null);
  };

  const handleCheckout = async () => {
    if (!user || !activeWorkspaceId) return;
    if (cart.length === 0) {
      setCheckoutError('Tambahkan minimal satu produk ke keranjang terlebih dahulu.');
      return;
    }
    if (paymentMethod === 'Tunai' && cashNum < grandTotal) {
      setCheckoutError('Nominal uang tunai diterima kurang dari total tagihan.');
      return;
    }

    setProcessing(true);
    setCheckoutError(null);
    try {
      const tx = await checkoutTransaction(activeWorkspaceId, {
        items: cart,
        productsMap,
        customer: selectedCustomer,
        appliedCampaign,
        discount: computedDiscount,
        paymentMethod,
        amountPaid: paymentMethod === 'Tunai' ? cashNum : grandTotal,
      });
      setReceiptTx(tx);
      setCart([]);
      setSelectedCustomerId('');
      setAppliedCampaign(null);
      setVoucherInput('');
      setVoucherFeedback(null);
      setManualDiscount('');
      setCashReceived('');
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Gagal memproses transaksi.');
    } finally {
      setProcessing(false);
    }
  };

  const handleVoid = async (tx: Transaction) => {
    if (!user || !activeWorkspaceId || !permissions.canVoidTransaction || tx.status === 'Dibatalkan') {
      return;
    }
    setVoidingId(tx.id);
    try {
      await voidTransaction(activeWorkspaceId, tx, productsMap);
      if (receiptTx?.id === tx.id) {
        setReceiptTx({ ...tx, status: 'Dibatalkan' });
      }
    } finally {
      setVoidingId(null);
    }
  };

  const handleCopyReceipt = async (tx: Transaction) => {
    const storeName = storeProfile?.storeName || 'SI DIKA UMKM';
    const lines = [
      `*${storeName}*`,
      `Struk: ${tx.receiptNo}`,
      `Tanggal: ${formatDateID(tx.saleDate)}`,
      `Pelanggan: ${tx.customerName}`,
      `----------------------------`,
      ...tx.items.map((it) => `${it.name} (${it.qty}x) = ${formatRupiah(it.subtotal)}`),
      `----------------------------`,
      `Subtotal: ${formatRupiah(tx.subtotal)}`,
      tx.discount > 0 ? `Diskon: -${formatRupiah(tx.discount)}` : null,
      `*TOTAL: ${formatRupiah(tx.total)}*`,
      `Bayar (${tx.paymentMethod}): ${formatRupiah(tx.amountPaid)}`,
      tx.changeAmount > 0 ? `Kembalian: ${formatRupiah(tx.changeAmount)}` : null,
      ``,
      storeProfile?.tagline || 'UMKM Naik Kelas, Bisnis Makin Cuan',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-view switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          <button
            type="button"
            onClick={() => setSubView('kasir')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              subView === 'kasir'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Meja Kasir Aktif
          </button>
          <button
            type="button"
            onClick={() => setSubView('riwayat')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              subView === 'riwayat'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            Riwayat Transaksi ({transactions.length})
          </button>
        </div>

        <div className="text-xs text-slate-500 tabular-nums">
          <span>Produk siap jual: {activeProducts.length}</span>
          <span className="mx-2 text-slate-300" aria-hidden="true">
            ·
          </span>
          <span>Voucher aktif: {activeVoucherCampaigns.length}</span>
        </div>
      </div>

      {subView === 'kasir' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left: Searchable Product Catalog */}
          <div className="xl:col-span-7 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <form onSubmit={handleQuickScanSubmit} className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama produk atau ketik kode SKU lalu tekan Enter..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900"
                />
              </form>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['Semua', ...PRODUCT_CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-navy-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {activeProducts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Belum ada produk di katalog kasir
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">
                  {permissions.canManageInventory
                    ? 'Tambahkan produk pertama Anda di menu Inventori atau gunakan tombol Isi Data Contoh UMKM di atas untuk mencoba langsung.'
                    : 'Hubungi Pemilik Usaha Anda untuk menambahkan produk ke katalog inventori toko.'}
                </p>
                {permissions.canManageInventory && (
                  <button
                    type="button"
                    onClick={onNavigateInventory}
                    className="px-4 py-2.5 bg-navy-900 text-white text-sm font-semibold rounded-lg hover:bg-navy-800 transition-colors cursor-pointer"
                  >
                    Buka Menu Inventori
                  </button>
                )}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
                Tidak ada produk yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredProducts.map((product) => {
                  const inCartQty =
                    cart.find((c) => c.productId === product.id)?.qty || 0;
                  const outOfStock = product.stock <= 0;
                  const lowStock = !outOfStock && product.stock <= product.minStock;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => addToCart(product)}
                      className={`text-left bg-white border rounded-xl overflow-hidden transition-colors flex flex-col cursor-pointer ${
                        inCartQty > 0
                          ? 'border-kadin-orange ring-1 ring-kadin-orange'
                          : 'border-slate-200 hover:border-navy-700/40'
                      } ${outOfStock ? 'opacity-55 cursor-not-allowed' : ''}`}
                    >
                      <ProductThumb product={product} />
                      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2">
                        <div>
                          <div className="text-[11px] text-slate-500 truncate mb-1">
                            <span>{product.category}</span>
                            <span className="mx-1.5 text-slate-300" aria-hidden="true">
                              ·
                            </span>
                            <span className="font-mono">{product.sku}</span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
                            {product.name}
                          </h4>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-end justify-between gap-2">
                          <div>
                            <p className="font-mono text-sm font-semibold text-navy-900 tabular-nums">
                              {formatRupiah(product.sellPrice)}
                            </p>
                            <p
                              className={`text-[11px] tabular-nums ${
                                outOfStock
                                  ? 'text-red-600 font-medium'
                                  : lowStock
                                    ? 'text-amber-700 font-medium'
                                    : 'text-slate-500'
                              }`}
                            >
                              {outOfStock
                                ? 'Stok habis'
                                : `Stok ${product.stock} ${product.unit}`}
                            </p>
                          </div>
                          {inCartQty > 0 && (
                            <span className="font-mono text-xs font-bold text-kadin-orange tabular-nums">
                              ×{inCartQty}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Active Cart & Checkout Panel */}
          <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden xl:sticky xl:top-20">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Keranjang Transaksi</h3>
                <p className="text-xs text-slate-500 tabular-nums">
                  {cart.reduce((s, i) => s + i.qty, 0)} item dipilih
                </p>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                >
                  Kosongkan
                </button>
              )}
            </div>

            <div className="p-5 space-y-5">
              {/* Customer selector */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  Pelanggan (CRM &amp; Poin Loyalitas)
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900"
                >
                  <option value="">Pelanggan Umum (Tanpa akun CRM)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.segment} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cart Items List */}
              {cart.length === 0 ? (
                <div className="py-10 text-center border-y border-slate-100">
                  <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    Pilih produk dari katalog di sebelah kiri untuk memulai transaksi.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border-y border-slate-100 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.productId} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-500 font-mono tabular-nums">
                          {formatRupiah(item.sellPrice)} × {item.qty}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="inline-flex items-center border border-slate-200 rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.productId, -1)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-l-lg cursor-pointer"
                            aria-label={`Kurangi ${item.name}`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-mono font-semibold tabular-nums">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.productId, 1)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-r-lg cursor-pointer"
                            aria-label={`Tambah ${item.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="font-mono text-xs font-semibold text-slate-900 w-24 text-right tabular-nums">
                          {formatRupiah(item.subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.productId, -item.qty)}
                          className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          aria-label={`Hapus ${item.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Voucher & Discount */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  Kode Voucher Promo atau Diskon Nominal
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                    placeholder="Kode voucher (mis. KADIN15)"
                    className="flex-1 px-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900"
                  />
                  {appliedCampaign ? (
                    <button
                      type="button"
                      onClick={clearVoucher}
                      className="px-3 py-2 text-xs font-medium text-red-700 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 whitespace-nowrap cursor-pointer"
                    >
                      Lepas
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={applyVoucherCode}
                      className="px-3.5 py-2 text-xs font-semibold text-navy-900 border border-navy-900/25 bg-navy-50 rounded-lg hover:bg-navy-900 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Pakai
                    </button>
                  )}
                </div>

                {voucherFeedback && (
                  <p
                    className={`text-xs ${
                      appliedCampaign ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {voucherFeedback}
                  </p>
                )}

                {!appliedCampaign && (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={manualDiscount}
                    onChange={(e) => setManualDiscount(e.target.value.replace(/\D/g, ''))}
                    placeholder="Atau diskon manual dalam Rupiah (opsional)"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900"
                  />
                )}
              </div>

              {/* Payment Method */}
              <div>
                <p className="text-xs font-medium text-slate-700 mb-2">Metode Pembayaran</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((method) => {
                    const active = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`px-2.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                          active
                            ? 'bg-navy-900 text-white border-navy-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {method}
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentMethod === 'Tunai' && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Uang Tunai Diterima (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value.replace(/\D/g, ''))}
                    placeholder={String(grandTotal || 0)}
                    className="w-full px-3.5 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[grandTotal, 50000, 100000, 200000]
                      .filter((v, i, arr) => v > 0 && arr.indexOf(v) === i)
                      .map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCashReceived(String(amt))}
                          className="px-2.5 py-1 text-xs font-mono text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer tabular-nums"
                        >
                          {amt === grandTotal ? 'Uang Pas' : formatRupiah(amt)}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Totals Summary */}
              <div className="pt-4 border-t border-slate-200 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">{formatRupiah(subtotal)}</span>
                </div>
                {computedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>
                      Diskon {appliedCampaign ? `(${appliedCampaign.promoCode})` : 'Manual'}
                    </span>
                    <span className="font-mono tabular-nums">
                      -{formatRupiah(computedDiscount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900">Total Bayar</span>
                  <span className="text-xl font-extrabold font-mono text-navy-900 tabular-nums">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
                {paymentMethod === 'Tunai' && cashNum > 0 && (
                  <div className="flex justify-between text-xs text-slate-600 pt-1">
                    <span>Kembalian</span>
                    <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                      {formatRupiah(changeAmount)}
                    </span>
                  </div>
                )}
              </div>

              {checkoutError && (
                <p
                  role="alert"
                  className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5"
                >
                  {checkoutError}
                </p>
              )}

              <button
                type="button"
                disabled={processing || cart.length === 0}
                onClick={handleCheckout}
                className="w-full py-3 px-4 bg-kadin-orange text-white text-sm font-semibold rounded-lg hover:bg-kadin-orange-hover disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {paymentMethod === 'QRIS' ? (
                  <QrCode className="w-4 h-4" />
                ) : paymentMethod === 'Tunai' ? (
                  <Wallet className="w-4 h-4" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                <span>
                  {processing
                    ? 'Memproses Transaksi...'
                    : `Selesaikan Transaksi (${paymentMethod}) · ${formatRupiah(grandTotal)}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Transaction History View */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Riwayat Transaksi Kasir</h3>
              <p className="text-xs text-slate-500">
                {permissions.canVoidTransaction
                  ? 'Klik struk untuk melihat detail atau membatalkan transaksi (stok otomatis kembali).'
                  : 'Mode Kasir: Anda dapat mencetak ulang struk. Pembatalan transaksi hanya dapat dilakukan oleh Pemilik Usaha.'}
              </p>
            </div>
            {!permissions.canVoidTransaction && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-md">
                <Lock className="w-3 h-3" />
                Pembatalan dibatasi (Khusus Pemilik)
              </span>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Belum ada transaksi yang tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">No. Struk</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4">Metode</th>
                    <th className="py-3 px-4 text-right">Item</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-medium text-slate-900 whitespace-nowrap">
                        {tx.receiptNo}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap tabular-nums">
                        {formatDateID(tx.saleDate)}
                      </td>
                      <td className="py-3 px-4 text-slate-900">{tx.customerName}</td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {tx.paymentMethod}
                        {tx.promoCode ? ` · ${tx.promoCode}` : ''}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs tabular-nums">
                        {tx.itemCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatRupiah(tx.total)}
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        <span
                          className={
                            tx.status === 'Selesai'
                              ? 'text-emerald-700 font-semibold'
                              : 'text-red-600 font-semibold'
                          }
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => setReceiptTx(tx)}
                          className="text-xs font-semibold text-navy-900 hover:underline cursor-pointer"
                        >
                          Struk
                        </button>
                        {tx.status === 'Selesai' && permissions.canVoidTransaction && (
                          <button
                            type="button"
                            disabled={voidingId === tx.id}
                            onClick={() => handleVoid(tx)}
                            className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50 cursor-pointer"
                          >
                            {voidingId === tx.id ? 'Membatalkan...' : 'Batalkan'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Digital Receipt Modal */}
      {receiptTx && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="receipt-modal-title"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-navy-900" />
                <h3 id="receipt-modal-title" className="text-sm font-bold text-slate-900">
                  Struk Digital SI DIKA
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReceiptTx(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                aria-label="Tutup struk"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div id="kadin-receipt-print" className="p-6 space-y-4">
              <div className="text-center border-b border-dashed border-slate-300 pb-4">
                <p className="font-display font-extrabold text-base text-slate-900">
                  {storeProfile?.storeName || 'SI DIKA UMKM'}
                </p>
                {storeProfile?.address && (
                  <p className="text-xs text-slate-500 mt-0.5">{storeProfile.address}</p>
                )}
                {storeProfile?.phone && (
                  <p className="text-xs font-mono text-slate-500">WA: {storeProfile.phone}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-y-1 text-xs text-slate-600">
                <span>No. Struk</span>
                <span className="text-right font-mono font-medium text-slate-900">
                  {receiptTx.receiptNo}
                </span>
                <span>Tanggal</span>
                <span className="text-right tabular-nums">
                  {receiptTx.createdAt
                    ? formatTimestampID(receiptTx.createdAt)
                    : formatDateID(receiptTx.saleDate)}
                </span>
                <span>Pelanggan</span>
                <span className="text-right font-medium text-slate-900">
                  {receiptTx.customerName}
                </span>
                <span>Status</span>
                <span
                  className={`text-right font-semibold ${
                    receiptTx.status === 'Selesai' ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {receiptTx.status}
                </span>
              </div>

              <div className="border-y border-dashed border-slate-300 py-3 space-y-2 text-xs">
                {receiptTx.items.map((it, idx) => (
                  <div key={`${it.productId}-${idx}`} className="flex justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{it.name}</p>
                      <p className="text-slate-500 font-mono tabular-nums">
                        {it.qty} × {formatRupiah(it.sellPrice)}
                      </p>
                    </div>
                    <span className="font-mono font-medium text-slate-900 tabular-nums shrink-0">
                      {formatRupiah(it.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">
                    {formatRupiah(receiptTx.subtotal)}
                  </span>
                </div>
                {receiptTx.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>
                      Diskon {receiptTx.promoCode ? `(${receiptTx.promoCode})` : ''}
                    </span>
                    <span className="font-mono tabular-nums">
                      -{formatRupiah(receiptTx.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5">
                  <span>TOTAL</span>
                  <span className="font-mono tabular-nums">{formatRupiah(receiptTx.total)}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Dibayar ({receiptTx.paymentMethod})</span>
                  <span className="font-mono tabular-nums">
                    {formatRupiah(receiptTx.amountPaid)}
                  </span>
                </div>
                {receiptTx.changeAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Kembalian</span>
                    <span className="font-mono tabular-nums">
                      {formatRupiah(receiptTx.changeAmount)}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-center text-[11px] text-slate-500 pt-2 border-t border-dashed border-slate-200">
                {storeProfile?.tagline || 'UMKM Naik Kelas, Bisnis Makin Cuan'} · SI DIKA
              </p>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => handleCopyReceipt(receiptTx)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                {copiedReceipt ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedReceipt ? 'Tersalin' : 'Salin Teks WA'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-navy-900 rounded-lg hover:bg-navy-800 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
