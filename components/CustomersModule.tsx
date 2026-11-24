'use client';

import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Edit3,
  ExternalLink,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useAppData } from './AuthContext';
import {
  createCustomer,
  deleteCustomer,
  updateCustomer,
} from '@/lib/firestore-service';
import {
  CUSTOMER_SEGMENTS,
  formatDateID,
  formatRupiah,
  LIMITS,
  normalizeWaNumber,
  type Customer,
  type CustomerSegment,
} from '@/lib/types';

export function CustomersModule() {
  const { user, activeWorkspaceId, permissions, storeProfile, customers, transactions } = useAppData();

  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('Semua');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [segment, setSegment] = useState<CustomerSegment>('Reguler');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const total = customers.length;
    const loyalCount = customers.filter(
      (c) => c.segment === 'VIP' || c.segment === 'Setia'
    ).length;
    const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0);
    const totalPoints = customers.reduce((s, c) => s + c.loyaltyPoints, 0);
    return { total, loyalCount, totalSpent, totalPoints };
  }, [customers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      const matchSeg = segmentFilter === 'Semua' || c.segment === segmentFilter;
      const matchQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);
      return matchSeg && matchQ;
    });
  }, [customers, search, segmentFilter]);

  const selectedCustomerTxs = useMemo(() => {
    if (!selectedCustomer) return [];
    return transactions.filter((t) => t.customerId === selectedCustomer.id);
  }, [selectedCustomer, transactions]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPhone('');
    setEmail('');
    setSegment('Reguler');
    setNotes('');
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email);
    setSegment(c.segment);
    setNotes(c.notes);
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeWorkspaceId) return;
    if (!name.trim()) {
      setFormError('Nama pelanggan wajib diisi.');
      return;
    }
    if (phone.trim().length < LIMITS.PHONE_MIN) {
      setFormError('Nomor WhatsApp minimal 6 karakter.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        segment,
        notes: notes.trim(),
      };
      if (editing && permissions.canEditCustomers) {
        await updateCustomer(editing.id, payload);
      } else {
        await createCustomer(activeWorkspaceId, payload);
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan data pelanggan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Customer) => {
    if (!permissions.canDeleteCustomers) return;
    await deleteCustomer(c.id);
    if (selectedCustomer?.id === c.id) setSelectedCustomer(null);
  };

  const buildGreeting = (c: Customer) => {
    const storeName = storeProfile?.storeName || 'SI DIKA UMKM';
    return `Halo Kak ${c.name}, terima kasih telah menjadi pelanggan ${c.segment} di ${storeName}! Saat ini Kakak memiliki ${c.loyaltyPoints} poin loyalitas. Yuk mampir lagi, kami ada promo spesial minggu ini.`;
  };

  const copyGreeting = async (c: Customer) => {
    try {
      await navigator.clipboard.writeText(buildGreeting(c));
      setCopiedId(c.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Database Pelanggan</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {summary.total}
          </p>
          <p className="text-xs text-slate-500 mt-1">Kontak aktif tersimpan</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Pelanggan VIP &amp; Setia</p>
          <p className="text-2xl font-bold font-mono text-navy-900 mt-1 tabular-nums">
            {summary.loyalCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Pelanggan berulang bernilai tinggi</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Belanja Terdaftar</p>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {formatRupiah(summary.totalSpent)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Akumulasi omzet member</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Poin Loyalitas Beredar</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {summary.totalPoints.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-500 mt-1">1 poin tiap belanja Rp 10.000</p>
        </div>
      </div>

      {/* Main Split: Directory Table + Customer Detail Drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div
          className={`bg-white border border-slate-200 rounded-xl overflow-hidden ${
            selectedCustomer ? 'xl:col-span-8' : 'xl:col-span-12'
          }`}
        >
          <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, WhatsApp, atau email..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-navy-900"
                />
              </div>
              <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg overflow-x-auto">
                {['Semua', ...CUSTOMER_SEGMENTS].map((seg) => (
                  <button
                    key={seg}
                    type="button"
                    onClick={() => setSegmentFilter(seg)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      segmentFilter === seg
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {seg}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-kadin-orange text-white text-xs font-semibold rounded-lg hover:bg-kadin-orange-hover whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Pelanggan
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-9 h-9 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-900 mb-1">
                {customers.length === 0
                  ? 'Database pelanggan masih kosong'
                  : 'Tidak ada pelanggan sesuai filter'}
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Simpan kontak pelanggan agar Anda mudah melacak riwayat pembelian dan mengirim promo
                WhatsApp.
              </p>
              {customers.length === 0 && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="px-4 py-2 bg-navy-900 text-white text-xs font-semibold rounded-lg hover:bg-navy-800 cursor-pointer"
                >
                  Tambah Pelanggan Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4">WhatsApp</th>
                    <th className="py-3 px-4">Segmen</th>
                    <th className="py-3 px-4 text-right">Transaksi</th>
                    <th className="py-3 px-4 text-right">Total Belanja</th>
                    <th className="py-3 px-4 text-right">Poin</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((c) => {
                    const isSelected = selectedCustomer?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-navy-50/70' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">
                            {c.email || c.notes || 'Tanpa catatan'}
                          </p>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                          {c.phone}
                        </td>
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          <span
                            className={`font-semibold ${
                              c.segment === 'VIP'
                                ? 'text-navy-900'
                                : c.segment === 'Reseller'
                                  ? 'text-amber-700'
                                  : c.segment === 'Setia'
                                    ? 'text-emerald-700'
                                    : 'text-slate-600'
                            }`}
                          >
                            {c.segment}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs tabular-nums">
                          {c.totalOrders}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          {formatRupiah(c.totalSpent)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs text-slate-700 tabular-nums">
                          {c.loyaltyPoints}
                        </td>
                        <td
                          className="py-3 px-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {permissions.canEditCustomers || permissions.canDeleteCustomers ? (
                            <div className="inline-flex items-center gap-1">
                              {permissions.canEditCustomers && (
                                <button
                                  type="button"
                                  onClick={() => openEdit(c)}
                                  className="p-1.5 text-slate-600 hover:text-navy-900 hover:bg-slate-100 rounded-md cursor-pointer"
                                  aria-label={`Edit ${c.name}`}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              {permissions.canDeleteCustomers && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(c)}
                                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                                  aria-label={`Hapus ${c.name}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedCustomer(c)}
                              className="text-xs font-semibold text-navy-900 hover:underline cursor-pointer"
                            >
                              Detail
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

        {/* Customer Detail Panel */}
        {selectedCustomer && (
          <div className="xl:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Segmen {selectedCustomer.segment} · Terakhir belanja{' '}
                  {selectedCustomer.lastOrderAt
                    ? formatDateID(selectedCustomer.lastOrderAt)
                    : 'belum ada'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
                aria-label="Tutup detail pelanggan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-500">WhatsApp</p>
                  <p className="font-mono font-medium text-slate-900 mt-0.5">
                    {selectedCustomer.phone}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Email</p>
                  <p className="font-medium text-slate-900 mt-0.5 truncate">
                    {selectedCustomer.email || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Total Belanja</p>
                  <p className="font-mono font-semibold text-navy-900 mt-0.5 tabular-nums">
                    {formatRupiah(selectedCustomer.totalSpent)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Poin Loyalitas</p>
                  <p className="font-mono font-semibold text-emerald-700 mt-0.5 tabular-nums">
                    {selectedCustomer.loyaltyPoints} poin
                  </p>
                </div>
              </div>

              {selectedCustomer.notes && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-1">Catatan Preferensi</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{selectedCustomer.notes}</p>
                </div>
              )}

              {/* Direct WA Follow-up */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <p className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                  Sapa Pelanggan via WhatsApp
                </p>
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
                  {buildGreeting(selectedCustomer)}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyGreeting(selectedCustomer)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    {copiedId === selectedCustomer.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedId === selectedCustomer.id ? 'Tersalin' : 'Salin Pesan'}
                  </button>
                  <a
                    href={`https://wa.me/${normalizeWaNumber(selectedCustomer.phone)}?text=${encodeURIComponent(
                      buildGreeting(selectedCustomer)
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
                  >
                    Buka WA
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Customer Purchase History */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-900 mb-2">
                  Riwayat Transaksi ({selectedCustomerTxs.length})
                </p>
                {selectedCustomerTxs.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Belum ada transaksi terhubung di kasir.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {selectedCustomerTxs.map((tx) => (
                      <div key={tx.id} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-mono font-medium text-slate-900">{tx.receiptNo}</p>
                          <p className="text-slate-500">
                            {formatDateID(tx.saleDate)} · {tx.paymentMethod}
                          </p>
                        </div>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {formatRupiah(tx.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editing ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={name}
                  maxLength={LIMITS.NAME_MAX}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Contoh: Rina Kusuma"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    maxLength={LIMITS.PHONE_MAX}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Segmen Pelanggan
                  </label>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value as CustomerSegment)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-navy-900"
                  >
                    {CUSTOMER_SEGMENTS.map((seg) => (
                      <option key={seg} value={seg}>
                        {seg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email (Opsional)
                </label>
                <input
                  type="email"
                  value={email}
                  maxLength={LIMITS.EMAIL_MAX}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pelanggan@email.com"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Catatan / Produk Favorit
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  maxLength={LIMITS.CUSTOMER_NOTES_MAX}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferensi produk, ukuran, atau jadwal rutin belanja..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-kadin-orange rounded-lg hover:bg-kadin-orange-hover disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
