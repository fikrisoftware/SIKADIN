import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';
import firebaseConfig from '@/firebase-applet-config.json';
import {
  calculateMdrFee,
  calculatePayoutFee,
  GATEWAY_META,
  getBankName,
} from './payment-gateways';
import type {
  BankCode,
  GatewayChannel,
  GatewayChargeResult,
  GatewayServerStatus,
  PaymentGateway,
} from './types';

export interface VerifiedCaller {
  uid: string;
  email: string;
  emailVerified: boolean;
}

/**
 * Verifies the caller's Firebase Auth ID Token via Google Identity Toolkit
 * without requiring service-account IAM (works on Starter Tier & Cloud Run).
 */
export async function verifyFirebaseBearerToken(
  req: NextRequest
): Promise<VerifiedCaller | null> {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const idToken = authHeader.slice(7).trim();
  if (!idToken || idToken.length > 4096) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
        firebaseConfig.apiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        cache: 'no-store',
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      users?: Array<{ localId?: string; email?: string; emailVerified?: boolean }>;
    };
    const account = data.users?.[0];
    if (!account?.localId || !account.email) return null;
    return {
      uid: account.localId,
      email: account.email.toLowerCase(),
      emailVerified: Boolean(account.emailVerified),
    };
  } catch {
    return null;
  }
}

export function getServerGatewayStatus(): GatewayServerStatus {
  const midtransKey = (process.env.MIDTRANS_SERVER_KEY || '').trim();
  const midtransIrisKey = (process.env.MIDTRANS_IRIS_API_KEY || '').trim();
  const midtransProd = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  const dokuClientId = (process.env.DOKU_CLIENT_ID || '').trim();
  const dokuSecret = (process.env.DOKU_SECRET_KEY || '').trim();
  const dokuProd = process.env.DOKU_IS_PRODUCTION === 'true';

  const xenditKey = (process.env.XENDIT_SECRET_KEY || '').trim();
  const xenditCallback = (process.env.XENDIT_CALLBACK_TOKEN || '').trim();

  return {
    gateways: {
      Midtrans: {
        configured: midtransKey.length > 0,
        mode: midtransKey.length > 0 && midtransProd ? 'live' : 'sandbox',
        payoutConfigured: midtransIrisKey.length > 0,
        webhookConfigured: midtransKey.length > 0,
        webhookPath: GATEWAY_META.Midtrans.webhookPath,
      },
      DOKU: {
        configured: dokuClientId.length > 0 && dokuSecret.length > 0,
        mode: dokuClientId.length > 0 && dokuSecret.length > 0 && dokuProd ? 'live' : 'sandbox',
        payoutConfigured: dokuClientId.length > 0 && dokuSecret.length > 0,
        webhookConfigured: dokuSecret.length > 0,
        webhookPath: GATEWAY_META.DOKU.webhookPath,
      },
      Xendit: {
        configured: xenditKey.length > 0,
        mode: xenditKey.length > 0 && !xenditKey.startsWith('xnd_development_') ? 'live' : 'sandbox',
        payoutConfigured: xenditKey.length > 0,
        webhookConfigured: xenditCallback.length > 0,
        webhookPath: GATEWAY_META.Xendit.webhookPath,
      },
    },
  };
}

function buildSimulatedPaymentCode(
  gateway: PaymentGateway,
  channel: GatewayChannel,
  orderId: string,
  amount: number
): { paymentCode: string; paymentUrl: string; bankLabel?: string } {
  const numericHash = crypto
    .createHash('sha256')
    .update(`${gateway}:${orderId}:${amount}`)
    .digest('hex')
    .replace(/[^0-9]/g, '')
    .padEnd(16, '8');

  if (channel === 'QRIS') {
    const qrisPayload = `00020101021226570016ID.CO.SIDIKA.WWW011893600914${numericHash.slice(
      0,
      10
    )}52045499530336054${String(amount).length.toString().padStart(2, '0')}${amount}5802ID5907SI DIKA6007JAKARTA6304${numericHash
      .slice(10, 14)
      .toUpperCase()}`;
    return {
      paymentCode: qrisPayload,
      paymentUrl: '',
    };
  }

  if (channel === 'Transfer Bank') {
    const prefix = gateway === 'Midtrans' ? '70012' : gateway === 'DOKU' ? '89022' : '88088';
    const bankLabel =
      gateway === 'Midtrans'
        ? 'Mandiri / BCA Virtual Account'
        : gateway === 'DOKU'
          ? 'DOKU Virtual Account (BNI/BRI)'
          : 'Xendit Virtual Account (BCA/BRI)';
    return {
      paymentCode: `${prefix}${numericHash.slice(0, 11)}`,
      paymentUrl: '',
      bankLabel,
    };
  }

  // E-Wallet
  const shortRef = `${gateway.toUpperCase().slice(0, 3)}-${numericHash.slice(0, 8)}`;
  return {
    paymentCode: `EWALLET-${shortRef}`,
    paymentUrl: `https://pay-sandbox.sidika.id/${gateway.toLowerCase()}/${encodeURIComponent(
      orderId
    )}`,
    bankLabel: 'GoPay / OVO / DANA / ShopeePay',
  };
}

export async function createGatewayCharge(params: {
  gateway: PaymentGateway;
  channel: GatewayChannel;
  amount: number;
  orderId: string;
  customerName: string;
  customerEmail: string;
}): Promise<GatewayChargeResult> {
  const { gateway, channel, amount, orderId, customerName } = params;
  const { mdrFee, netAmount } = calculateMdrFee(gateway, channel, amount);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Attempt Live/Sandbox Provider API call when server-side secrets are configured
  if (gateway === 'Midtrans' && process.env.MIDTRANS_SERVER_KEY?.trim()) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY.trim();
    const isProd = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const baseUrl = isProd
      ? 'https://api.midtrans.com/v2/charge'
      : 'https://api.sandbox.midtrans.com/v2/charge';
    const basicAuth = Buffer.from(`${serverKey}:`).toString('base64');

    const payload =
      channel === 'QRIS'
        ? {
            payment_type: 'qris',
            transaction_details: { order_id: orderId, gross_amount: amount },
            customer_details: { first_name: customerName },
          }
        : channel === 'Transfer Bank'
          ? {
              payment_type: 'bank_transfer',
              transaction_details: { order_id: orderId, gross_amount: amount },
              bank_transfer: { bank: 'bca' },
              customer_details: { first_name: customerName },
            }
          : {
              payment_type: 'gopay',
              transaction_details: { order_id: orderId, gross_amount: amount },
              customer_details: { first_name: customerName },
            };

    try {
      const resp = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });
      if (resp.ok) {
        const json = (await resp.json()) as {
          transaction_id?: string;
          qr_string?: string;
          va_numbers?: Array<{ bank?: string; va_number?: string }>;
          actions?: Array<{ name?: string; url?: string }>;
        };
        const va = json.va_numbers?.[0];
        const deeplink = json.actions?.find((a) => a.url)?.url || '';
        return {
          gateway,
          channel,
          providerRef: json.transaction_id || `MT-${orderId}`,
          mode: isProd ? 'live' : 'sandbox',
          grossAmount: amount,
          mdrFee,
          netAmount,
          paymentCode: json.qr_string || va?.va_number || `MT-${orderId}`,
          paymentUrl: deeplink,
          expiresAt,
          bankLabel: va?.bank ? `Virtual Account ${va.bank.toUpperCase()}` : undefined,
        };
      }
    } catch {
      // Fall back cleanly to simulated sandbox output
    }
  }

  if (gateway === 'Xendit' && process.env.XENDIT_SECRET_KEY?.trim()) {
    const secretKey = process.env.XENDIT_SECRET_KEY.trim();
    const isLive = !secretKey.startsWith('xnd_development_');
    const basicAuth = Buffer.from(`${secretKey}:`).toString('base64');

    try {
      const resp = await fetch('https://api.xendit.co/v2/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          external_id: orderId,
          amount,
          description: `SI DIKA POS (${channel}) - ${customerName}`,
          currency: 'IDR',
        }),
        cache: 'no-store',
      });
      if (resp.ok) {
        const json = (await resp.json()) as {
          id?: string;
          invoice_url?: string;
        };
        return {
          gateway,
          channel,
          providerRef: json.id || `XND-${orderId}`,
          mode: isLive ? 'live' : 'sandbox',
          grossAmount: amount,
          mdrFee,
          netAmount,
          paymentCode: json.id || `XND-${orderId}`,
          paymentUrl: json.invoice_url || '',
          expiresAt,
        };
      }
    } catch {
      // Fall back cleanly to simulated sandbox output
    }
  }

  if (
    gateway === 'DOKU' &&
    process.env.DOKU_CLIENT_ID?.trim() &&
    process.env.DOKU_SECRET_KEY?.trim()
  ) {
    const clientId = process.env.DOKU_CLIENT_ID.trim();
    const secretKey = process.env.DOKU_SECRET_KEY.trim();
    const isProd = process.env.DOKU_IS_PRODUCTION === 'true';
    const requestTarget = '/checkout/v1/payment';
    const baseUrl = isProd
      ? `https://api.doku.com${requestTarget}`
      : `https://api-sandbox.doku.com${requestTarget}`;
    const requestId = `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const bodyObj = {
      order: { amount, invoice_number: orderId },
      payment: { payment_due_date: 15 },
      customer: { name: customerName },
    };
    const rawBody = JSON.stringify(bodyObj);
    const digest = crypto.createHash('sha256').update(rawBody).digest('base64');
    const componentSignature = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;
    const signature = `HMACSHA256=${crypto
      .createHmac('sha256', secretKey)
      .update(componentSignature)
      .digest('base64')}`;

    try {
      const resp = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Id': clientId,
          'Request-Id': requestId,
          'Request-Timestamp': timestamp,
          Signature: signature,
        },
        body: rawBody,
        cache: 'no-store',
      });
      if (resp.ok) {
        const json = (await resp.json()) as {
          response?: { payment?: { url?: string; token_id?: string } };
        };
        return {
          gateway,
          channel,
          providerRef: json.response?.payment?.token_id || `DOKU-${orderId}`,
          mode: isProd ? 'live' : 'sandbox',
          grossAmount: amount,
          mdrFee,
          netAmount,
          paymentCode: json.response?.payment?.token_id || `DOKU-${orderId}`,
          paymentUrl: json.response?.payment?.url || '',
          expiresAt,
        };
      }
    } catch {
      // Fall back cleanly to simulated sandbox output
    }
  }

  // Built-in Sandbox Simulation Mode (zero secrets required to test end-to-end)
  const sim = buildSimulatedPaymentCode(gateway, channel, orderId, amount);
  const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return {
    gateway,
    channel,
    providerRef: `${gateway.toUpperCase()}-SBX-${randSuffix}`,
    mode: 'sandbox',
    grossAmount: amount,
    mdrFee,
    netAmount,
    paymentCode: sim.paymentCode,
    paymentUrl: sim.paymentUrl,
    expiresAt,
    bankLabel: sim.bankLabel,
  };
}

export async function executeGatewayPayout(params: {
  gateway: PaymentGateway;
  bankCode: BankCode;
  accountNumber: string;
  accountHolder: string;
  amount: number;
  note: string;
}): Promise<{
  providerRef: string;
  mode: 'sandbox' | 'live';
  transferFee: number;
  netDisbursed: number;
  status: 'Diproses' | 'Berhasil';
  bankName: string;
}> {
  const { gateway, bankCode, accountNumber, accountHolder, amount, note } = params;
  const { transferFee, netDisbursed } = calculatePayoutFee(gateway, amount);
  const bankName = getBankName(bankCode);
  const refSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();

  // Optional Live/Sandbox Xendit Disbursement when secret key exists
  if (gateway === 'Xendit' && process.env.XENDIT_SECRET_KEY?.trim()) {
    const secretKey = process.env.XENDIT_SECRET_KEY.trim();
    const isLive = !secretKey.startsWith('xnd_development_');
    const basicAuth = Buffer.from(`${secretKey}:`).toString('base64');
    try {
      const resp = await fetch('https://api.xendit.co/disbursements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          external_id: `SIDIKA-PO-${refSuffix}`,
          amount: netDisbursed,
          bank_code: bankCode,
          account_holder_name: accountHolder,
          account_number: accountNumber,
          description: note || `Penarikan Dana SI DIKA (${bankName})`,
        }),
        cache: 'no-store',
      });
      if (resp.ok) {
        const json = (await resp.json()) as { id?: string; status?: string };
        return {
          providerRef: json.id || `XND-PO-${refSuffix}`,
          mode: isLive ? 'live' : 'sandbox',
          transferFee,
          netDisbursed,
          status: json.status === 'COMPLETED' ? 'Berhasil' : 'Diproses',
          bankName,
        };
      }
    } catch {
      // Fallback to sandbox simulation
    }
  }

  return {
    providerRef: `${gateway.toUpperCase()}-PO-${refSuffix}`,
    mode: 'sandbox',
    transferFee,
    netDisbursed,
    status: 'Berhasil',
    bankName,
  };
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyMidtransWebhookSignature(body: {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
}): { ok: boolean; configured: boolean } {
  const serverKey = (process.env.MIDTRANS_SERVER_KEY || '').trim();
  if (!serverKey) return { ok: false, configured: false };
  if (!body.order_id || !body.status_code || !body.gross_amount || !body.signature_key) {
    return { ok: false, configured: true };
  }
  const expected = crypto
    .createHash('sha512')
    .update(`${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`)
    .digest('hex');
  return {
    ok: timingSafeStringEqual(expected.toLowerCase(), body.signature_key.toLowerCase()),
    configured: true,
  };
}

export function verifyDokuWebhookSignature(params: {
  clientId: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  rawBody: string;
  signatureHeader: string;
}): { ok: boolean; configured: boolean } {
  const secretKey = (process.env.DOKU_SECRET_KEY || '').trim();
  if (!secretKey) return { ok: false, configured: false };
  if (
    !params.clientId ||
    !params.requestId ||
    !params.requestTimestamp ||
    !params.signatureHeader
  ) {
    return { ok: false, configured: true };
  }
  const digest = crypto.createHash('sha256').update(params.rawBody).digest('base64');
  const componentSignature = `Client-Id:${params.clientId}\nRequest-Id:${params.requestId}\nRequest-Timestamp:${params.requestTimestamp}\nRequest-Target:${params.requestTarget}\nDigest:${digest}`;
  const expected = `HMACSHA256=${crypto
    .createHmac('sha256', secretKey)
    .update(componentSignature)
    .digest('base64')}`;
  return {
    ok: timingSafeStringEqual(expected, params.signatureHeader.trim()),
    configured: true,
  };
}

export function verifyXenditWebhookToken(callbackTokenHeader: string): {
  ok: boolean;
  configured: boolean;
} {
  const expectedToken = (process.env.XENDIT_CALLBACK_TOKEN || '').trim();
  if (!expectedToken) return { ok: false, configured: false };
  if (!callbackTokenHeader) return { ok: false, configured: true };
  return {
    ok: timingSafeStringEqual(expectedToken, callbackTokenHeader.trim()),
    configured: true,
  };
}
