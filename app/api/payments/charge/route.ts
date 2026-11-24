import { NextRequest, NextResponse } from 'next/server';
import { isGatewayChannel, isPaymentGateway } from '@/lib/payment-gateways';
import { createGatewayCharge, verifyFirebaseBearerToken } from '@/lib/payment-server';

export const dynamic = 'force-dynamic';

const MIN_CHARGE_AMOUNT = 1_000;
const MAX_CHARGE_AMOUNT = 500_000_000;

export async function POST(req: NextRequest) {
  const caller = await verifyFirebaseBearerToken(req);
  if (!caller || !caller.emailVerified) {
    return NextResponse.json(
      { error: 'Autentikasi tidak valid. Silakan masuk kembali.' },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Format payload JSON tidak valid.' }, { status: 400 });
  }

  const gatewayRaw = typeof body.gateway === 'string' ? body.gateway.trim() : '';
  const channelRaw = typeof body.channel === 'string' ? body.channel.trim() : '';
  const amountNum = typeof body.amount === 'number' ? Math.round(body.amount) : Number.NaN;
  const orderIdRaw =
    typeof body.orderId === 'string'
      ? body.orderId
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9_-]/g, '')
          .slice(0, 40)
      : '';
  const customerNameRaw =
    typeof body.customerName === 'string'
      ? body.customerName.trim().slice(0, 120)
      : 'Pelanggan Umum';

  if (!isPaymentGateway(gatewayRaw)) {
    return NextResponse.json(
      { error: 'Gateway pembayaran harus Midtrans, DOKU, atau Xendit.' },
      { status: 400 }
    );
  }

  if (!isGatewayChannel(channelRaw)) {
    return NextResponse.json(
      { error: 'Kanal non-tunai harus QRIS, Transfer Bank, atau E-Wallet.' },
      { status: 400 }
    );
  }

  if (!Number.isInteger(amountNum) || amountNum < MIN_CHARGE_AMOUNT || amountNum > MAX_CHARGE_AMOUNT) {
    return NextResponse.json(
      {
        error: `Nominal tagihan harus antara Rp ${MIN_CHARGE_AMOUNT.toLocaleString(
          'id-ID'
        )} hingga Rp ${MAX_CHARGE_AMOUNT.toLocaleString('id-ID')}.`,
      },
      { status: 400 }
    );
  }

  const safeOrderId = orderIdRaw.length >= 4 ? orderIdRaw : `SIDIKA-${Date.now()}`;

  try {
    const result = await createGatewayCharge({
      gateway: gatewayRaw,
      channel: channelRaw,
      amount: amountNum,
      orderId: safeOrderId,
      customerName: customerNameRaw || 'Pelanggan Umum',
      customerEmail: caller.email,
    });

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Gagal membuat tagihan pada payment gateway. Silakan coba lagi.' },
      { status: 502 }
    );
  }
}
