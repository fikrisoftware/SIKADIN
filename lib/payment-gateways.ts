import {
  SUPPORTED_BANKS,
  type BankCode,
  type GatewayChannel,
  type PaymentGateway,
} from './types';

export interface GatewayDescriptor {
  id: PaymentGateway;
  name: string;
  payoutProduct: string;
  tagline: string;
  mdrPercent: Record<GatewayChannel, number>;
  flatFee: Record<GatewayChannel, number>;
  payoutFee: number;
  webhookPath: string;
}

export const GATEWAY_META: Record<PaymentGateway, GatewayDescriptor> = {
  Midtrans: {
    id: 'Midtrans',
    name: 'Midtrans (GoTo Financial)',
    payoutProduct: 'Midtrans Iris',
    tagline: 'QRIS GoPay, Virtual Account Multi-Bank & Iris Disbursement',
    mdrPercent: { QRIS: 0.7, 'Transfer Bank': 0, 'E-Wallet': 2.0 },
    flatFee: { QRIS: 0, 'Transfer Bank': 4000, 'E-Wallet': 0 },
    payoutFee: 2500,
    webhookPath: '/api/payments/webhook/midtrans',
  },
  DOKU: {
    id: 'DOKU',
    name: 'DOKU Jokul',
    payoutProduct: 'DOKU Payout',
    tagline: 'QRIS Nasional, VA Bank Lokal & DOKU Payout Real-Time',
    mdrPercent: { QRIS: 0.7, 'Transfer Bank': 0, 'E-Wallet': 1.8 },
    flatFee: { QRIS: 0, 'Transfer Bank': 3500, 'E-Wallet': 0 },
    payoutFee: 3000,
    webhookPath: '/api/payments/webhook/doku',
  },
  Xendit: {
    id: 'Xendit',
    name: 'Xendit',
    payoutProduct: 'Xendit Disbursement',
    tagline: 'QRIS Dinamis, Virtual Account 24/7 & Xendit Disbursement',
    mdrPercent: { QRIS: 0.7, 'Transfer Bank': 0, 'E-Wallet': 1.5 },
    flatFee: { QRIS: 0, 'Transfer Bank': 4500, 'E-Wallet': 0 },
    payoutFee: 2500,
    webhookPath: '/api/payments/webhook/xendit',
  },
};

export function calculateMdrFee(
  gateway: PaymentGateway,
  channel: GatewayChannel,
  grossAmount: number
): { mdrFee: number; netAmount: number; rateLabel: string } {
  const safeGross = Math.max(0, Math.round(grossAmount));
  const meta = GATEWAY_META[gateway];
  const pct = meta.mdrPercent[channel] ?? 0;
  const flat = meta.flatFee[channel] ?? 0;
  const mdrFee = Math.min(safeGross, Math.round((safeGross * pct) / 100) + flat);
  const netAmount = Math.max(0, safeGross - mdrFee);
  const rateLabel =
    pct > 0 && flat > 0
      ? `${pct}% + Rp ${flat.toLocaleString('id-ID')}`
      : pct > 0
        ? `${pct}%`
        : `Rp ${flat.toLocaleString('id-ID')}`;
  return { mdrFee, netAmount, rateLabel };
}

export function calculatePayoutFee(gateway: PaymentGateway, amount: number): {
  transferFee: number;
  netDisbursed: number;
} {
  const safeAmount = Math.max(0, Math.round(amount));
  const transferFee = GATEWAY_META[gateway].payoutFee;
  return {
    transferFee,
    netDisbursed: Math.max(0, safeAmount - transferFee),
  };
}

export function isSupportedBankCode(code: string): code is BankCode {
  return SUPPORTED_BANKS.some((b) => b.code === code);
}

export function getBankName(code: string): string {
  return SUPPORTED_BANKS.find((b) => b.code === code)?.name || code;
}

export function isPaymentGateway(value: string): value is PaymentGateway {
  return value === 'Midtrans' || value === 'DOKU' || value === 'Xendit';
}

export function isGatewayChannel(value: string): value is GatewayChannel {
  return value === 'QRIS' || value === 'Transfer Bank' || value === 'E-Wallet';
}
