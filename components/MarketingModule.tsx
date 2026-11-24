'use client';

import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Megaphone,
  PauseCircle,
  PlayCircle,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useAppData } from './AuthContext';
import {
  createCampaign,
  deleteCampaign,
  updateCampaign,
  updateCampaignStatus,
} from '@/lib/firestore-service';
import {
  CAMPAIGN_CHANNELS,
  CAMPAIGN_STATUSES,
  CAMPAIGN_TARGET_SEGMENTS,
  formatDateID,
  formatRupiah,
  LIMITS,
  normalizeWaNumber,
  todayISO,
  type Campaign,
  type CampaignChannel,
  type CampaignStatus,
  type CampaignTargetSegment,
} from '@/lib/types';

export function MarketingModule() {
  const { user, activeWorkspaceId, storeProfile, campaigns, customers, products, transactions } = useAppData();

  const [statusFilter, setStatusFilter] = useState<'Semua' | CampaignStatus>('Semua');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState<CampaignChannel>('WhatsApp');
  const [targetSegment, setTargetSegment] = useState<CampaignTargetSegment>('Semua');
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<CampaignStatus>('Aktif');
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO(14));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const activeCount = campaigns.filter((c) => c.status === 'Aktif').length;
    const totalRedemptions = campaigns.reduce((s, c) => s + c.redemptions, 0);
    const promoRevenue = transactions
      .filter((t) => t.status === 'Selesai' && t.promoCode.length > 0)
      .reduce((s, t) => s + t.total, 0);
    return { activeCount, totalRedemptions, promoRevenue, totalReach: customers.length };
  }, [campaigns, customers.length, transactions]);

  const filteredCampaigns = useMemo(() => {
    if (statusFilter === 'Semua') return campaigns;
    return campaigns.filter((c) => c.status === statusFilter);
  }, [campaigns, statusFilter]);

  const activeStudioCampaign = useMemo(() => {
    if (selectedCampaignId) {
      return campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0] || null;
    }
    return campaigns.find((c) => c.status === 'Aktif') || campaigns[0] || null;
  }, [campaigns, selectedCampaignId]);

  const featuredProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || products[0] || null,
    [products, selectedProductId]
  );

  const targetAudience = useMemo(() => {
    if (!activeStudioCampaign || activeStudioCampaign.targetSegment === 'Semua') {
      return customers;
    }
    return customers.filter((c) => c.segment === activeStudioCampaign.targetSegment);
  }, [activeStudioCampaign, customers]);

  const studioCopyText = useMemo(() => {
    const storeName = storeProfile?.storeName || 'Toko UMKM SI DIKA';
    const tagline = storeProfile?.tagline || 'UMKM Naik Kelas, Bisnis Makin Cuan';
    const cmp = activeStudioCampaign;
    const prod = featuredProduct;

    if (!cmp) {
      return `Halo Sahabat ${storeName}! Kunjungi gerai kami dan nikmati produk UMKM lokal berkualitas. ${tagline}`;
    }

    const lines = [
      `*${cmp.title}* — ${storeName}`,
      ``,
      cmp.message,
      prod
        ? `\nRekomendasi Produk: *${prod.name}* (${formatRupiah(prod.sellPrice)}/${prod.unit})`
        : null,
      cmp.promoCode
        ? `\nGunakan kode voucher *${cmp.promoCode}* untuk potongan *${cmp.discountPercent}%*!`
        : null,
      `Berlaku s/d ${formatDateID(cmp.endDate)}.`,
      storeProfile?.address ? `Lokasi: ${storeProfile.address}` : null,
      `\n_${tagline}_`,
    ].filter(Boolean);

    return lines.join('\n');
  }, [activeStudioCampaign, featuredProduct, storeProfile]);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setChannel('WhatsApp');
    setTargetSegment('Semua');
    setPromoCode('');
    setDiscountPercent('10');
    setMessage('');
    setStatus('Aktif');
    setStartDate(todayISO());
    setEndDate(todayISO(14));
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setTitle(c.title);
    setChannel(c.channel);
    setTargetSegment(c.targetSegment);
    setPromoCode(c.promoCode);
    setDiscountPercent(String(c.discountPercent));
    setMessage(c.message);
    setStatus(c.status);
    setStartDate(c.startDate);
    setEndDate(c.endDate);
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeWorkspaceId) return;
    if (!title.trim() || !message.trim()) {
      setFormError('Judul dan isi pesan promosi wajib diisi.');
      return;
    }

    const targetCount =
      targetSegment === 'Semua'
        ? customers.length
        : customers.filter((c) => c.segment === targetSegment).length;

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        title: title.trim(),
        channel,
        targetSegment,
        promoCode: promoCode.trim().toUpperCase(),
        discountPercent: Number(discountPercent) || 0,
        message: message.trim(),
        status,
        startDate,
        endDate,
        targetCount,
      };
      if (editing) {
        await updateCampaign(editing.id, payload);
      } else {
        await createCampaign(activeWorkspaceId, payload);
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan kampanye.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (c: Campaign, next: CampaignStatus) => {
    if (c.status === 'Selesai') return;
    await updateCampaignStatus(c.id, next);
  };

  const handleCopyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Kampanye Aktif</p>
          <p className="text-2xl font-bold font-mono text-navy-900 mt-1 tabular-nums">
            {summary.activeCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Siap digunakan di kasir POS</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Penukaran Voucher</p>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {summary.totalRedemptions}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total klaim promo pelanggan</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Omzet dari Transaksi Promo</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {formatRupiah(summary.promoRevenue)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Transaksi memakai kode voucher</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Jangkauan Kontak CRM</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {summary.totalReach}
          </p>
          <p className="text-xs text-slate-500 mt-1">Pelanggan siap disapa</p>
        </div>
      </div>

      {/* Main Split: Campaign Manager (left) + Broadcast & Copy Studio (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
              {(['Semua', ...CAMPAIGN_STATUSES] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-kadin-orange text-white text-xs font-semibold rounded-lg hover:bg-kadin-orange-hover whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Kampanye
            </button>
          </div>

          {filteredCampaigns.length === 0 ? (
            <div className="p-12 text-center">
              <Megaphone className="w-9 h-9 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-900 mb-1">
                Belum ada kampanye pemasaran
              </p>
              <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                Buat kampanye diskon atau kode voucher agar pelanggan makin rajin berbelanja dan
                bisa langsung diklaim di meja kasir.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="px-4 py-2 bg-navy-900 text-white text-xs font-semibold rounded-lg hover:bg-navy-800 cursor-pointer"
              >
                Buat Kampanye Pertama
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredCampaigns.map((cmp) => {
                const isLocked = cmp.status === 'Selesai';
                return (
                  <div
                    key={cmp.id}
                    className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mb-1">
                          <span
                            className={`font-semibold ${
                              cmp.status === 'Aktif'
                                ? 'text-emerald-700'
                                : cmp.status === 'Draft'
                                  ? 'text-amber-700'
                                  : 'text-slate-500'
                            }`}
                          >
                            {cmp.status}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{cmp.channel}</span>
                          <span aria-hidden="true">·</span>
                          <span>Target: {cmp.targetSegment}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{cmp.title}</h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!isLocked && cmp.status === 'Draft' && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(cmp, 'Aktif')}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md cursor-pointer"
                            title="Aktifkan Kampanye"
                            aria-label={`Aktifkan ${cmp.title}`}
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        )}
                        {!isLocked && cmp.status === 'Aktif' && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(cmp, 'Selesai')}
                            className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-md cursor-pointer"
                            title="Tandai Selesai"
                            aria-label={`Selesaikan ${cmp.title}`}
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        )}
                        {!isLocked && (
                          <button
                            type="button"
                            onClick={() => openEdit(cmp)}
                            className="p-1.5 text-slate-600 hover:text-navy-900 hover:bg-slate-100 rounded-md cursor-pointer"
                            title="Edit Kampanye"
                            aria-label={`Edit ${cmp.title}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteCampaign(cmp.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                          title="Hapus Kampanye"
                          aria-label={`Hapus ${cmp.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{cmp.message}</p>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 tabular-nums">
                        {cmp.promoCode && (
                          <span>
                            Voucher:{' '}
                            <strong className="font-mono text-kadin-orange">{cmp.promoCode}</strong> (
                            {cmp.discountPercent}%)
                          </span>
                        )}
                        <span>
                          Periode: {formatDateID(cmp.startDate)} – {formatDateID(cmp.endDate)}
                        </span>
                        <span>Diklaim: {cmp.redemptions}×</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedCampaignId(cmp.id)}
                        className="text-xs font-semibold text-navy-900 hover:underline cursor-pointer"
                      >
                        Siapkan Pesan →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Broadcast & Promo Copy Studio */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Studio Broadcast &amp; Katalog Promo</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rakit pesan promosi siap kirim ke WhatsApp atau caption media sosial dari data asli
              toko Anda.
            </p>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pilih Kampanye
                </label>
                <select
                  value={activeStudioCampaign?.id || ''}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {campaigns.length === 0 && <option value="">Belum ada kampanye</option>}
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Sorot Produk Katalog
                </label>
                <select
                  value={featuredProduct?.id || ''}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {products.length === 0 && <option value="">Belum ada produk</option>}
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatRupiah(p.sellPrice)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-700">Pratinjau Teks Promosi</span>
                <button
                  type="button"
                  onClick={() => handleCopyText('studio', studioCopyText)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-900 hover:underline cursor-pointer"
                >
                  {copiedKey === 'studio' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Salin Teks
                    </>
                  )}
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3.5 leading-relaxed">
                {studioCopyText}
              </pre>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-700" />
                  Kirim Cepat ke Target Segmen ({targetAudience.length})
                </p>
                <span className="text-[11px] text-slate-500">
                  {activeStudioCampaign?.targetSegment || 'Semua'}
                </span>
              </div>

              {targetAudience.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">
                  Belum ada pelanggan pada segmen ini. Tambahkan kontak di menu Pelanggan.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto border border-slate-200 rounded-lg">
                  {targetAudience.map((cust) => {
                    const personalText = `Halo Kak ${cust.name}!\n\n${studioCopyText}`;
                    return (
                      <div
                        key={cust.id}
                        className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{cust.name}</p>
                          <p className="font-mono text-[11px] text-slate-500">
                            {cust.phone} · {cust.segment}
                          </p>
                        </div>
                        <a
                          href={`https://wa.me/${normalizeWaNumber(cust.phone)}?text=${encodeURIComponent(
                            personalText
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 whitespace-nowrap shrink-0"
                        >
                          Kirim WA
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Campaign Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editing ? 'Edit Kampanye Pemasaran' : 'Buat Kampanye Pemasaran Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Kampanye
                </label>
                <input
                  type="text"
                  value={title}
                  maxLength={LIMITS.NAME_MAX}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Contoh: Promo Akhir Pekan Kopi & Snack"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as CampaignChannel)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {CAMPAIGN_CHANNELS.map((ch) => (
                      <option key={ch} value={ch}>
                        {ch}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Target Segmen
                  </label>
                  <select
                    value={targetSegment}
                    onChange={(e) => setTargetSegment(e.target.value as CampaignTargetSegment)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {CAMPAIGN_TARGET_SEGMENTS.map((seg) => (
                      <option key={seg} value={seg}>
                        {seg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {CAMPAIGN_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Kode Voucher Kasir (Opsional)
                  </label>
                  <input
                    type="text"
                    value={promoCode}
                    maxLength={LIMITS.PROMO_CODE_MAX}
                    onChange={(e) =>
                      setPromoCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_\-]/g, ''))
                    }
                    placeholder="KADIN15"
                    className="w-full px-3 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Potongan Diskon (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Isi Pesan Promosi
                </label>
                <textarea
                  rows={3}
                  value={message}
                  maxLength={LIMITS.CAMPAIGN_MSG_MAX}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  placeholder="Tulis penawaran menarik untuk dibagikan ke pelanggan..."
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
                  {saving ? 'Menyimpan...' : 'Simpan Kampanye'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
