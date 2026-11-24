'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Landmark,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import { useAppData } from './AuthContext';
import {
  bulkSettleReconciliations,
  createPayoutRecord,
  refundReconciliation,
  savePaymentGatewayConfig,
  settleReconciliation,
} from '@/lib/firestore-service';
import {
  calculatePayoutFee,
  GATEWAY_META,
  getBankName,
} from '@/lib/payment-gateways';
import {
  formatDateID,
  formatRupiah,
  formatTimestampID,
  LIMITS,
  PAYMENT_GATEWAYS,
  RECONCILIATION_STATUSES,
  SUPPORTED_BANKS,
  todayISO,
  type BankCode,
  type GatewayServerStatus,
  type PaymentGateway,
  type PaymentReconciliation,
  type ReconciliationStatus,
} from '@/lib/types';

type FinanceSubTab = 'rekonsiliasi' | 'payout' | 'pengaturan';

function escapeCsvField(val: string | number): string {
  const str = String(val ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function FinanceGatewayModule() {
  const {
    user,
    activeWorkspaceId,
    storeProfile,
    transactions,
    paymentConfig,
    reconciliations,
    payouts,
  } = useAppData();

  const [subTab, setSubTab] = useState<FinanceSubTab>('rekonsiliasi');
  const [statusFilter, setStatusFilter] = useState<'Semua' | ReconciliationStatus>('Semua');
  const [gatewayFilter, setGatewayFilter] = useState<'Semua' | PaymentGateway>('Semua');
  const [busyRecId, setBusyRecId] = useState<string | null>(null);
  const [bulkSettling, setBulkSettling] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Server connection status (fetched securely with Firebase Bearer ID Token)
  const [serverStatus, setServerStatus] = useState<GatewayServerStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);

  // Payout form state
  const [payoutGateway, setPayoutGateway] = useState<PaymentGateway>(
    paymentConfig?.defaultGateway || 'Midtrans'
  );
  const [payoutBankCode, setPayoutBankCode] = useState<BankCode>(
    paymentConfig?.bankCode || 'BCA'
  );
  const [payoutAccountNumber, setPayoutAccountNumber] = useState<string>(
    paymentConfig?.accountNumber || ''
  );
  const [payoutAccountHolder, setPayoutAccountHolder] = useState<string>(
    paymentConfig?.accountHolder || storeProfile?.storeName || ''
  );
  const [payoutAmountInput, setPayoutAmountInput] = useState<string>('');
  const [payoutNote, setPayoutNote] = useState<string>('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Gateway & Bank Config form state (keyed edits)
  const [cfgDefaultGateway, setCfgDefaultGateway] = useState<PaymentGateway | null>(null);
  const [cfgEnableMidtrans, setCfgEnableMidtrans] = useState<boolean | null>(null);
  const [cfgEnableDoku, setCfgEnableDoku] = useState<boolean | null>(null);
  const [cfgEnableXendit, setCfgEnableXendit] = useState<boolean | null>(null);
  const [cfgEnableQris, setCfgEnableQris] = useState<boolean | null>(null);
  const [cfgEnableVa, setCfgEnableVa] = useState<boolean | null>(null);
  const [cfgEnableEwallet, setCfgEnableEwallet] = useState<boolean | null>(null);
  const [cfgAutoSettleQris, setCfgAutoSettleQris] = useState<boolean | null>(null);
  const [cfgBankCode, setCfgBankCode] = useState<BankCode | null>(null);
  const [cfgAccountNumber, setCfgAccountNumber] = useState<string | null>(null);
  const [cfgAccountHolder, setCfgAccountHolder] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  // Effective config form values (derived cleanly without synchronous setState in useEffect)
  const formDefaultGateway: PaymentGateway =
    cfgDefaultGateway ?? paymentConfig?.defaultGateway ?? 'Midtrans';
  const formEnableMidtrans = cfgEnableMidtrans ?? paymentConfig?.enableMidtrans ?? true;
  const formEnableDoku = cfgEnableDoku ?? paymentConfig?.enableDoku ?? true;
  const formEnableXendit = cfgEnableXendit ?? paymentConfig?.enableXendit ?? true;
  const formEnableQris = cfgEnableQris ?? paymentConfig?.enableQris ?? true;
  const formEnableVa = cfgEnableVa ?? paymentConfig?.enableVa ?? true;
  const formEnableEwallet = cfgEnableEwallet ?? paymentConfig?.enableEwallet ?? true;
  const formAutoSettleQris = cfgAutoSettleQris ?? paymentConfig?.autoSettleQris ?? true;
  const formBankCode: BankCode = cfgBankCode ?? paymentConfig?.bankCode ?? 'BCA';
  const formAccountNumber = cfgAccountNumber ?? paymentConfig?.accountNumber ?? '';
  const formAccountHolder =
    cfgAccountHolder ?? paymentConfig?.accountHolder ?? storeProfile?.storeName ?? '';

  const fetchServerStatus = async () => {
    if (!user) return;
    setLoadingStatus(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/payments/status', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = (await res.json()) as GatewayServerStatus;
        setServerStatus(data);
      }
    } catch {
      // Non-fatal: server status card stays in fallback indicator
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    let active = true;
    user
      .getIdToken()
      .then((idToken) =>
        fetch('/api/payments/status', {
          method: 'GET',
          headers: { Authorization: `Bearer ${idToken}` },
          cache: 'no-store',
        })
      )
      .then((res) => (res.ok ? res.json() : null))
      .then((data: GatewayServerStatus | null) => {
        if (active && data) setServerStatus(data);
      })
      .catch(() => {
        // Ignore transient network errors
      });
    return () => {
      active = false;
    };
  }, [user]);

  // === KPI Balance Calculations ===
  const metrics = useMemo(() => {
    let settledNet = 0;
    let pendingNet = 0;
    let pendingCount = 0;
    let grossGateway = 0;
    let totalMdr = 0;

    for (const rec of reconciliations) {
      if (rec.status === 'Settled') {
        settledNet += rec.netAmount;
        grossGateway += rec.grossAmount;
        totalMdr += rec.mdrFee;
      } else if (rec.status === 'Tertahan' || rec.status === 'Menunggu') {
        pendingNet += rec.netAmount;
        pendingCount += 1;
        grossGateway += rec.grossAmount;
        totalMdr += rec.mdrFee;
      }
    }

    const totalCashPos = transactions
      .filter((t) => t.status === 'Selesai' && t.paymentMethod === 'Tunai')
      .reduce((sum, t) => sum + t.total, 0);

    const reservedOrDisbursed = payouts
      .filter((p) => p.status === 'Berhasil' || p.status === 'Diproses')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalWithdrawn = payouts
      .filter((p) => p.status === 'Berhasil')
      .reduce((sum, p) => sum + p.amount, 0);

    const completedPayoutCount = payouts.filter((p) => p.status === 'Berhasil').length;
    const availableBalance = Math.max(0, settledNet - reservedOrDisbursed);

    return {
      availableBalance,
      pendingNet,
      pendingCount,
      grossGateway,
      totalMdr,
      totalCashPos,
      totalWithdrawn,
      completedPayoutCount,
    };
  }, [payouts, reconciliations, transactions]);

  const pendingRecIds = useMemo(
    () =>
      reconciliations
        .filter((r) => r.status === 'Tertahan' || r.status === 'Menunggu')
        .map((r) => r.id),
    [reconciliations]
  );

  const filteredReconciliations = useMemo(() => {
    return reconciliations.filter((rec) => {
      const matchStatus = statusFilter === 'Semua' || rec.status === statusFilter;
      const matchGateway = gatewayFilter === 'Semua' || rec.gateway === gatewayFilter;
      return matchStatus && matchGateway;
    });
  }, [gatewayFilter, reconciliations, statusFilter]);

  const payoutAmountNum = Number(payoutAmountInput.replace(/\D/g, '')) || 0;
  const payoutFeePreview = useMemo(
    () => calculatePayoutFee(payoutGateway, payoutAmountNum),
    [payoutAmountNum, payoutGateway]
  );

  // === Handlers ===
  const handleSettleOne = async (rec: PaymentReconciliation) => {
    setBusyRecId(rec.id);
    setFeedback(null);
    try {
      await settleReconciliation(
        rec.id,
        `Settlement ${rec.gateway} (${rec.receiptNo}) dicairkan ke saldo siap tarik`
      );
      setFeedback({
        type: 'success',
        text: `Dana ${formatRupiah(rec.netAmount)} dari struk ${rec.receiptNo} berhasil dicairkan ke Saldo Siap Tarik.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal mencairkan settlement.',
      });
    } finally {
      setBusyRecId(null);
    }
  };

  const handleBulkSettle = async () => {
    if (pendingRecIds.length === 0) return;
    setBulkSettling(true);
    setFeedback(null);
    try {
      await bulkSettleReconciliations(pendingRecIds);
      setFeedback({
        type: 'success',
        text: `${pendingRecIds.length} transaksi tertahan berhasil dicairkan secara massal ke Saldo Siap Tarik.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal melakukan settlement massal.',
      });
    } finally {
      setBulkSettling(false);
    }
  };

  const handleRefundOne = async (rec: PaymentReconciliation) => {
    setBusyRecId(rec.id);
    setFeedback(null);
    try {
      await refundReconciliation(
        rec.id,
        `Refund dicatat oleh ${user?.displayName || user?.email || 'Pemilik Usaha'}`
      );
      setFeedback({
        type: 'success',
        text: `Status transaksi ${rec.receiptNo} diperbarui menjadi Refund.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal memproses refund.',
      });
    } finally {
      setBusyRecId(null);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'No Struk',
      'Tanggal',
      'Pelanggan',
      'Gateway',
      'Mode',
      'Kanal',
      'Referensi Gateway',
      'Bruto (IDR)',
      'Potongan MDR (IDR)',
      'Netto (IDR)',
      'Status',
      'Tanggal Settlement',
      'Catatan',
    ];
    const rows = filteredReconciliations.map((r) => [
      r.receiptNo,
      r.saleDate,
      r.customerName,
      r.gateway,
      r.mode === 'live' ? 'Live' : 'Sandbox',
      r.channel,
      r.providerRef,
      r.grossAmount,
      r.mdrFee,
      r.netAmount,
      r.status,
      r.settledAt || '-',
      r.note,
    ]);
    const csvContent =
      '\uFEFF' +
      [headers, ...rows].map((row) => row.map(escapeCsvField).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `rekonsiliasi-keuangan-si-dika-${todayISO()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeWorkspaceId) return;
    setFeedback(null);

    const digits = payoutAccountNumber.replace(/\D/g, '');
    if (digits.length < 6 || digits.length > 24) {
      setFeedback({ type: 'error', text: 'Nomor rekening tujuan harus terdiri dari 6 hingga 24 digit angka.' });
      return;
    }
    if (payoutAccountHolder.trim().length < 2) {
      setFeedback({ type: 'error', text: 'Nama pemilik rekening tujuan wajib diisi.' });
      return;
    }
    if (payoutAmountNum < 10_000) {
      setFeedback({ type: 'error', text: 'Minimal penarikan dana adalah Rp 10.000.' });
      return;
    }
    if (payoutAmountNum > metrics.availableBalance) {
      setFeedback({
        type: 'error',
        text: `Nominal penarikan melebihi Saldo Siap Tarik (${formatRupiah(metrics.availableBalance)}). Cairkan dana tertahan terlebih dahulu jika diperlukan.`,
      });
      return;
    }

    setSubmittingPayout(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/payments/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          gateway: payoutGateway,
          bankCode: payoutBankCode,
          accountNumber: digits,
          accountHolder: payoutAccountHolder.trim(),
          amount: payoutAmountNum,
          note: payoutNote.trim() || `Penarikan dana ${storeProfile?.storeName || 'SI DIKA'}`,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        providerRef?: string;
        mode?: 'sandbox' | 'live';
        transferFee?: number;
        netDisbursed?: number;
        status?: 'Diproses' | 'Berhasil';
        bankName?: string;
      };
      if (!res.ok || !data.providerRef) {
        throw new Error(data.error || 'Gagal memproses instruksi pencairan dana.');
      }

      await createPayoutRecord(activeWorkspaceId, {
        gateway: payoutGateway,
        providerRef: data.providerRef,
        mode: data.mode || 'sandbox',
        bankCode: payoutBankCode,
        bankName: data.bankName || getBankName(payoutBankCode),
        accountNumber: digits,
        accountHolder: payoutAccountHolder.trim(),
        amount: payoutAmountNum,
        transferFee: data.transferFee ?? payoutFeePreview.transferFee,
        netDisbursed: data.netDisbursed ?? payoutFeePreview.netDisbursed,
        status: data.status || 'Berhasil',
        requestedBy: user.displayName || user.email || 'Pemilik Usaha',
        note: payoutNote.trim() || `Pencairan via ${GATEWAY_META[payoutGateway].payoutProduct}`,
      });

      setPayoutAmountInput('');
      setPayoutNote('');
      setFeedback({
        type: 'success',
        text: `Penarikan dana ${formatRupiah(payoutAmountNum)} ke ${getBankName(payoutBankCode)} (${digits}) via ${GATEWAY_META[payoutGateway].payoutProduct} berhasil dicatat (Ref: ${data.providerRef}).`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan saat menarik dana.',
      });
    } finally {
      setSubmittingPayout(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) return;
    setFeedback(null);

    if (!formEnableMidtrans && !formEnableDoku && !formEnableXendit) {
      setFeedback({
        type: 'error',
        text: 'Minimal satu penyedia payment gateway (Midtrans, DOKU, atau Xendit) harus aktif.',
      });
      return;
    }

    const digits = formAccountNumber.replace(/\D/g, '');
    if (digits.length > 0 && (digits.length < 6 || digits.length > 24)) {
      setFeedback({
        type: 'error',
        text: 'Nomor rekening bank utama harus 6 hingga 24 digit angka (atau kosongkan dulu).',
      });
      return;
    }

    setSavingConfig(true);
    try {
      await savePaymentGatewayConfig(
        activeWorkspaceId,
        {
          defaultGateway: formDefaultGateway,
          enableMidtrans: formEnableMidtrans,
          enableDoku: formEnableDoku,
          enableXendit: formEnableXendit,
          enableQris: formEnableQris,
          enableVa: formEnableVa,
          enableEwallet: formEnableEwallet,
          autoSettleQris: formAutoSettleQris,
          bankCode: formBankCode,
          accountNumber: digits,
          accountHolder: formAccountHolder.trim(),
        },
        paymentConfig
      );
      setPayoutBankCode(formBankCode);
      if (digits) setPayoutAccountNumber(digits);
      if (formAccountHolder.trim()) setPayoutAccountHolder(formAccountHolder.trim());
      setPayoutGateway(formDefaultGateway);

      setFeedback({
        type: 'success',
        text: 'Pengaturan Payment Gateway & Rekening Bank Utama berhasil disimpan.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal menyimpan pengaturan gateway.',
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCopyWebhook = async (gateway: PaymentGateway, path: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}${path}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedWebhook(gateway);
      setTimeout(() => setCopiedWebhook(null), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  const applySavedBankToPayout = () => {
    if (!paymentConfig) return;
    setPayoutBankCode(paymentConfig.bankCode);
    setPayoutAccountNumber(paymentConfig.accountNumber);
    setPayoutAccountHolder(paymentConfig.accountHolder);
    setPayoutGateway(paymentConfig.defaultGateway);
  };

  return (
    <div className="space-y-6">
      {/* KPI Balance Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-navy-950 text-white border border-navy-800 rounded-xl p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between text-xs text-blue-200">
            <span className="font-medium">Saldo Siap Tarik</span>
            <Wallet className="w-4 h-4 text-kadin-orange-light" />
          </div>
          <p className="text-2xl font-extrabold font-mono tabular-nums tracking-tight">
            {formatRupiah(metrics.availableBalance)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-blue-200/80 pt-1 border-t border-white/10">
            <span>Netto settled bebas ditarik</span>
            <button
              type="button"
              onClick={() => setSubTab('payout')}
              className="font-semibold text-kadin-orange-light hover:underline cursor-pointer"
            >
              Tarik Dana
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium">Dana Tertahan Settlement</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-navy-900 tabular-nums tracking-tight">
            {formatRupiah(metrics.pendingNet)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span className="tabular-nums">{metrics.pendingCount} transaksi menunggu cair</span>
            {metrics.pendingCount > 0 && (
              <button
                type="button"
                disabled={bulkSettling}
                onClick={handleBulkSettle}
                className="font-semibold text-kadin-orange hover:underline cursor-pointer disabled:opacity-50"
              >
                {bulkSettling ? 'Mencairkan...' : 'Cairkan Semua'}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium">Omzet Bruto Gateway</span>
            <Landmark className="w-4 h-4 text-navy-900" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-navy-900 tabular-nums tracking-tight">
            {formatRupiah(metrics.grossGateway)}
          </p>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 tabular-nums">
            MDR: <span className="font-mono text-slate-700">-{formatRupiah(metrics.totalMdr)}</span>
            <span className="mx-1.5 text-slate-300" aria-hidden="true">
              ·
            </span>
            Kas Tunai POS:{' '}
            <span className="font-mono text-slate-700">{formatRupiah(metrics.totalCashPos)}</span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium">Total Dana Ditarik</span>
            <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-emerald-700 tabular-nums tracking-tight">
            {formatRupiah(metrics.totalWithdrawn)}
          </p>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 tabular-nums">
            {metrics.completedPayoutCount} pencairan bank selesai
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={`px-4 py-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span className="font-medium">{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-75 cursor-pointer shrink-0"
            aria-label="Tutup notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          <button
            type="button"
            onClick={() => setSubTab('rekonsiliasi')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              subTab === 'rekonsiliasi'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Rekam &amp; Rekonsiliasi ({reconciliations.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('payout')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              subTab === 'payout'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Penarikan Dana / Payout ({payouts.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('pengaturan')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              subTab === 'pengaturan'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            Pengaturan Gateway &amp; Bank
          </button>
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>One Payment System · Midtrans, DOKU &amp; Xendit</span>
        </div>
      </div>

      {/* SUB-TAB 1: Rekam & Rekonsiliasi Keuangan */}
      {subTab === 'rekonsiliasi' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Buku Mutasi &amp; Rekonsiliasi Payment Gateway
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekam otomatis setiap transaksi non-tunai POS beserta potongan MDR, status
                settlement, dan aksi pencairan atau refund.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={gatewayFilter}
                onChange={(e) => setGatewayFilter(e.target.value as 'Semua' | PaymentGateway)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700"
              >
                <option value="Semua">Semua Gateway</option>
                {PAYMENT_GATEWAYS.map((gw) => (
                  <option key={gw} value={gw}>
                    {gw}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'Semua' | ReconciliationStatus)
                }
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700"
              >
                <option value="Semua">Semua Status</option>
                {RECONCILIATION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              {pendingRecIds.length > 0 && (
                <button
                  type="button"
                  disabled={bulkSettling}
                  onClick={handleBulkSettle}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-kadin-orange hover:bg-kadin-orange-hover rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {bulkSettling
                    ? 'Memproses...'
                    : `Cairkan Semua Tertahan (${pendingRecIds.length})`}
                </button>
              )}

              <button
                type="button"
                disabled={filteredReconciliations.length === 0}
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-navy-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Ekspor CSV Rekonsiliasi
              </button>
            </div>
          </div>

          {filteredReconciliations.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Landmark className="w-9 h-9 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">
                Belum ada mutasi payment gateway pada filter ini
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Lakukan transaksi QRIS, Transfer Bank, atau E-Wallet di menu Kasir (POS) untuk
                melihat pencatatan rekonsiliasi otomatis di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left font-semibold text-slate-600">
                    <th className="py-3 px-4">Struk &amp; Tanggal</th>
                    <th className="py-3 px-4">Gateway &amp; Kanal</th>
                    <th className="py-3 px-4">Referensi</th>
                    <th className="py-3 px-4 text-right">Bruto</th>
                    <th className="py-3 px-4 text-right">Potongan MDR</th>
                    <th className="py-3 px-4 text-right">Netto Diterima</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReconciliations.map((rec) => {
                    const canSettle = rec.status === 'Tertahan' || rec.status === 'Menunggu';
                    const canRefund = rec.status === 'Tertahan' || rec.status === 'Settled';
                    const isBusy = busyRecId === rec.id;

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-mono font-semibold text-slate-900">{rec.receiptNo}</p>
                          <p className="text-[11px] text-slate-500 tabular-nums">
                            {formatDateID(rec.saleDate)} · {rec.customerName}
                          </p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-semibold text-navy-900">
                            {rec.gateway}{' '}
                            <span className="font-normal text-slate-500">
                              ({rec.mode === 'live' ? 'Live' : 'Sandbox'})
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500">{rec.channel}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-mono text-[11px] text-slate-800">{rec.providerRef}</p>
                          {rec.note && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                              {rec.note}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                          {formatRupiah(rec.grossAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-red-600 tabular-nums whitespace-nowrap">
                          -{formatRupiah(rec.mdrFee)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                          {formatRupiah(rec.netAmount)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`font-semibold ${
                              rec.status === 'Settled'
                                ? 'text-emerald-700'
                                : rec.status === 'Tertahan' || rec.status === 'Menunggu'
                                  ? 'text-amber-700'
                                  : 'text-red-600'
                            }`}
                          >
                            {rec.status}
                          </span>
                          {rec.settledAt && (
                            <p className="text-[10px] text-slate-400 tabular-nums">
                              Cair {formatDateID(rec.settledAt)}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                          {canSettle && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleSettleOne(rec)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-md disabled:opacity-50 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              Cairkan Settlement
                            </button>
                          )}
                          {canRefund && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleRefundOne(rec)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md disabled:opacity-50 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Refund
                            </button>
                          )}
                          {!canSettle && !canRefund && (
                            <span className="text-slate-400">Final</span>
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
      )}

      {/* SUB-TAB 2: Penarikan Dana (Payout / Disbursement) */}
      {subTab === 'payout' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Payout Disbursement Form */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Formulir Penarikan Dana ke Rekening Bank
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Saldo Siap Tarik:{' '}
                  <strong className="font-mono text-navy-900 tabular-nums">
                    {formatRupiah(metrics.availableBalance)}
                  </strong>
                </p>
              </div>
              {paymentConfig?.accountNumber && (
                <button
                  type="button"
                  onClick={applySavedBankToPayout}
                  className="text-xs font-semibold text-kadin-orange hover:underline cursor-pointer shrink-0"
                >
                  Pakai Rekening Utama
                </button>
              )}
            </div>

            <form onSubmit={handleSubmitPayout} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Jalur Disbursement Gateway
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_GATEWAYS.map((gw) => {
                    const active = payoutGateway === gw;
                    return (
                      <button
                        key={gw}
                        type="button"
                        onClick={() => setPayoutGateway(gw)}
                        className={`px-2.5 py-2 text-left rounded-lg border transition-colors cursor-pointer ${
                          active
                            ? 'bg-navy-900 text-white border-navy-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p className="text-xs font-bold">{GATEWAY_META[gw].payoutProduct}</p>
                        <p
                          className={`text-[10px] font-mono tabular-nums mt-0.5 ${
                            active ? 'text-blue-200' : 'text-slate-500'
                          }`}
                        >
                          Biaya {formatRupiah(GATEWAY_META[gw].payoutFee)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Bank Nasional Tujuan
                </label>
                <select
                  value={payoutBankCode}
                  onChange={(e) => setPayoutBankCode(e.target.value as BankCode)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-navy-900"
                >
                  {SUPPORTED_BANKS.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nomor Rekening
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={payoutAccountNumber}
                    maxLength={LIMITS.ACCOUNT_NUM_MAX}
                    onChange={(e) => setPayoutAccountNumber(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="Contoh: 1234567890"
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nama Pemilik Rekening
                  </label>
                  <input
                    type="text"
                    value={payoutAccountHolder}
                    maxLength={LIMITS.NAME_MAX}
                    onChange={(e) => setPayoutAccountHolder(e.target.value)}
                    required
                    placeholder="Sesuai buku tabungan"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nominal Penarikan (Min. Rp 10.000)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={payoutAmountInput}
                  onChange={(e) => setPayoutAmountInput(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder={String(metrics.availableBalance || 50000)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                />
                {metrics.availableBalance >= 10_000 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { label: '25%', val: Math.round(metrics.availableBalance * 0.25) },
                      { label: '50%', val: Math.round(metrics.availableBalance * 0.5) },
                      { label: 'Tarik Semua', val: metrics.availableBalance },
                    ]
                      .filter((q) => q.val >= 10_000)
                      .map((q) => (
                        <button
                          key={q.label}
                          type="button"
                          onClick={() => setPayoutAmountInput(String(q.val))}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                        >
                          {q.label}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Catatan Pencairan (Opsional)
                </label>
                <input
                  type="text"
                  value={payoutNote}
                  maxLength={LIMITS.NOTE_MAX}
                  onChange={(e) => setPayoutNote(e.target.value)}
                  placeholder="Misal: Pencairan omzet mingguan"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                />
              </div>

              {/* Fee & Net Summary */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Nominal Penarikan</span>
                  <span className="font-mono tabular-nums">{formatRupiah(payoutAmountNum)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Transfer ({GATEWAY_META[payoutGateway].payoutProduct})</span>
                  <span className="font-mono text-red-600 tabular-nums">
                    -{formatRupiah(payoutAmountNum > 0 ? payoutFeePreview.transferFee : 0)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-navy-900 pt-1.5 border-t border-slate-200">
                  <span>Dana Masuk ke Rekening</span>
                  <span className="font-mono tabular-nums">
                    {formatRupiah(payoutAmountNum > 0 ? payoutFeePreview.netDisbursed : 0)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingPayout || metrics.availableBalance < 10_000}
                className="w-full py-2.5 px-4 bg-kadin-orange text-white text-sm font-semibold rounded-lg hover:bg-kadin-orange-hover disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                {submittingPayout
                  ? 'Mengirim Instruksi Pencairan...'
                  : `Cairkan via ${GATEWAY_META[payoutGateway].payoutProduct}`}
              </button>
            </form>
          </div>

          {/* Right: Payout History Table */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Riwayat Penarikan Dana (Payout)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Seluruh instruksi pencairan saldo ke rekening bank tercatat permanen untuk audit
                keuangan usaha.
              </p>
            </div>

            {payouts.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Building2 className="w-9 h-9 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-800">
                  Belum ada riwayat penarikan dana
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Gunakan formulir di sebelah kiri untuk mencairkan Saldo Siap Tarik ke rekening
                  bank bisnis Anda.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left font-semibold text-slate-600">
                      <th className="py-3 px-4">Waktu &amp; Ref</th>
                      <th className="py-3 px-4">Rekening Tujuan</th>
                      <th className="py-3 px-4">Jalur</th>
                      <th className="py-3 px-4 text-right">Ditarik</th>
                      <th className="py-3 px-4 text-right">Bersih Masuk</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payouts.map((po) => (
                      <tr key={po.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-mono font-semibold text-slate-900">{po.providerRef}</p>
                          <p className="text-[11px] text-slate-500 tabular-nums">
                            {po.createdAt
                              ? formatTimestampID(po.createdAt)
                              : formatDateID(po.payoutDate)}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{po.bankName}</p>
                          <p className="text-[11px] font-mono text-slate-600">
                            {po.accountNumber} · {po.accountHolder}
                          </p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-medium text-navy-900">
                            {GATEWAY_META[po.gateway].payoutProduct}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {po.mode === 'live' ? 'Live API' : 'Sandbox Simulasi'}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                          {formatRupiah(po.amount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                          {formatRupiah(po.netDisbursed)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`font-semibold ${
                              po.status === 'Berhasil'
                                ? 'text-emerald-700'
                                : po.status === 'Diproses'
                                  ? 'text-amber-700'
                                  : 'text-red-600'
                            }`}
                          >
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Pengaturan Gateway & Rekening Bank */}
      {subTab === 'pengaturan' && (
        <div className="space-y-6">
          {/* Server Connection Status Cards */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Status Koneksi Server Payment Gateway &amp; URL Webhook
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seluruh kunci rahasia hanya dibaca di sisi server (menu Settings &gt; Secrets).
                  Tanpa kredensial produksi, sistem otomatis berjalan di mode Sandbox Simulasi siap
                  uji.
                </p>
              </div>
              <button
                type="button"
                disabled={loadingStatus}
                onClick={fetchServerStatus}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
                Periksa Status Server
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              {PAYMENT_GATEWAYS.map((gw) => {
                const meta = GATEWAY_META[gw];
                const st = serverStatus?.gateways[gw];
                const isLive = st?.mode === 'live' && st?.configured;
                return (
                  <div
                    key={gw}
                    className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-navy-900">{meta.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{meta.tagline}</p>
                      </div>
                      <span
                        className={`text-[11px] font-bold shrink-0 ${
                          isLive ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {isLive ? 'Live API' : 'Sandbox Simulasi'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-200">
                      <div className="flex justify-between">
                        <span>Kunci API Server</span>
                        <span className="font-semibold text-slate-800">
                          {st?.configured ? 'Terpasang' : 'Mode Simulasi'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Jalur Payout</span>
                        <span className="font-semibold text-slate-800">{meta.payoutProduct}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Verifikasi Webhook</span>
                        <span className="font-semibold text-slate-800">
                          {gw === 'Midtrans'
                            ? 'SHA-512'
                            : gw === 'DOKU'
                              ? 'HMAC-SHA256'
                              : 'Callback Token'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Endpoint Webhook
                      </p>
                      <div className="flex items-center gap-1.5">
                        <code className="flex-1 text-[11px] font-mono bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 truncate">
                          {meta.webhookPath}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyWebhook(gw, meta.webhookPath)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-navy-900 bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer shrink-0"
                        >
                          {copiedWebhook === gw ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          {copiedWebhook === gw ? 'Tersalin' : 'Salin'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Store Gateway & Bank Preferences Form */}
          <form
            onSubmit={handleSaveConfig}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Konfigurasi Gateway Kasir &amp; Rekening Bank Utama
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur gateway utama, metode non-tunai yang tampil di meja kasir, settlement instan
                QRIS, serta rekening tujuan pencairan dana toko Anda.
              </p>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Gateway & Channel Activation */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Payment Gateway Utama (Default di Kasir)
                  </label>
                  <select
                    value={formDefaultGateway}
                    onChange={(e) => setCfgDefaultGateway(e.target.value as PaymentGateway)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-navy-900"
                  >
                    {PAYMENT_GATEWAYS.map((gw) => (
                      <option key={gw} value={gw}>
                        {GATEWAY_META[gw].name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-800">
                    Penyedia Gateway Aktif di Kasir
                  </p>
                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <span className="text-xs font-medium text-slate-800">
                      Midtrans (GoTo Financial)
                    </span>
                    <input
                      type="checkbox"
                      checked={formEnableMidtrans}
                      onChange={(e) => setCfgEnableMidtrans(e.target.checked)}
                      className="w-4 h-4 accent-navy-900"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <span className="text-xs font-medium text-slate-800">DOKU Jokul</span>
                    <input
                      type="checkbox"
                      checked={formEnableDoku}
                      onChange={(e) => setCfgEnableDoku(e.target.checked)}
                      className="w-4 h-4 accent-navy-900"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <span className="text-xs font-medium text-slate-800">Xendit</span>
                    <input
                      type="checkbox"
                      checked={formEnableXendit}
                      onChange={(e) => setCfgEnableXendit(e.target.checked)}
                      className="w-4 h-4 accent-navy-900"
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-800">
                    Kanal Non-Tunai Aktif &amp; Opsi Settlement
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={formEnableQris}
                        onChange={(e) => setCfgEnableQris(e.target.checked)}
                        className="w-4 h-4 accent-navy-900"
                      />
                      QRIS
                    </label>
                    <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={formEnableVa}
                        onChange={(e) => setCfgEnableVa(e.target.checked)}
                        className="w-4 h-4 accent-navy-900"
                      />
                      Virtual Account
                    </label>
                    <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={formEnableEwallet}
                        onChange={(e) => setCfgEnableEwallet(e.target.checked)}
                        className="w-4 h-4 accent-navy-900"
                      />
                      E-Wallet
                    </label>
                  </div>

                  <label className="flex items-start justify-between gap-3 p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-xs font-semibold text-emerald-950">
                        Aktifkan Settlement Instan untuk Transaksi QRIS
                      </p>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Pembayaran QRIS langsung berstatus Settled dan menambah Saldo Siap Tarik
                        tanpa menunggu antrean H+1.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formAutoSettleQris}
                      onChange={(e) => setCfgAutoSettleQris(e.target.checked)}
                      className="w-4 h-4 accent-emerald-700 mt-0.5 shrink-0"
                    />
                  </label>
                </div>
              </div>

              {/* Right: Primary Settlement Bank Account */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-navy-900" />
                    <h4 className="text-xs font-bold text-navy-900">
                      Rekening Bank Tujuan Utama (Payout)
                    </h4>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nama Bank Nasional
                    </label>
                    <select
                      value={formBankCode}
                      onChange={(e) => setCfgBankCode(e.target.value as BankCode)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-navy-900"
                    >
                      {SUPPORTED_BANKS.map((bank) => (
                        <option key={bank.code} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nomor Rekening Usaha
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formAccountNumber}
                      maxLength={LIMITS.ACCOUNT_NUM_MAX}
                      onChange={(e) => setCfgAccountNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="6 sampai 24 digit angka"
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-navy-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nama Pemilik Rekening
                    </label>
                    <input
                      type="text"
                      value={formAccountHolder}
                      maxLength={LIMITS.NAME_MAX}
                      onChange={(e) => setCfgAccountHolder(e.target.value)}
                      placeholder="Nama pemilik atau badan usaha UMKM"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-navy-900"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Data rekening disimpan terisolasi ketat pada ruang kerja toko Anda dan hanya
                    dapat diakses oleh Pemilik Usaha serta Admin Kantor Pusat yang berwenang.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingConfig}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white text-xs font-semibold rounded-lg hover:bg-navy-800 disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {savingConfig ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Gateway & Bank'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
