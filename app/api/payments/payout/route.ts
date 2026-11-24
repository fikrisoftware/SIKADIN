import { NextRequest, NextResponse } from 'next/server';
import { isPaymentGateway, isSupportedBankCode } from '@/lib/payment-gateways';
import { executeGatewayPayout, verifyFirebaseBearerToken } from '@/lib/payment-server';

export const dynamic = 'force-dynamic';

const MIN_PAYOUT_AMOUNT = 10_000;
const MAX_PAYOUT_AMOUNT = 500_000_000;

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
  const bankCodeRaw = typeof body.bankCode === 'string' ? body.bankCode.trim().toUpperCase() : '';
  const accountNumberRaw =
    typeof body.accountNumber === 'string' ? body.accountNumber.replace(/\s+/g, '') : '';
  const accountHolderRaw =
    typeof body.accountHolder === 'string' ? body.accountHolder.trim().slice(0, 120) : '';
  const noteRaw = typeof body.note === 'string' ? body.note.trim().slice(0, 240) : '';
  const amountNum = typeof body.amount === 'number' ? Math.round(body.amount) : Number.NaN;

  if (!isPaymentGateway(gatewayRaw)) {
    return NextResponse.json(
      { error: 'Jalur penarikan harus Midtrans, DOKU, atau Xendit.' },
      { status: 400 }
    );
  }

  if (!isSupportedBankCode(bankCodeRaw)) {
    return NextResponse.json(
      { error: 'Kode bank tujuan tidak termasuk dalam daftar bank nasional yang didukung.' },
      { status: 400 }
    );
  }

  if (!/^[0-9]{6,24}$/.test(accountNumberRaw)) {
    return NextResponse.json(
      { error: 'Nomor rekening harus berisi 6 hingga 24 digit angka.' },
      { status: 400 }
    );
  }

  if (accountHolderRaw.length < 2) {
    return NextResponse.json(
      { error: 'Nama pemilik rekening tujuan wajib diisi minimal 2 karakter.' },
      { status: 400 }
    );
  }

  if (!Number.isInteger(amountNum) || amountNum < MIN_PAYOUT_AMOUNT || amountNum > MAX_PAYOUT_AMOUNT) {
    return NextResponse.json(
      {
        error: `Nominal penarikan harus antara Rp ${MIN_PAYOUT_AMOUNT.toLocaleString(
          'id-ID'
        )} hingga Rp ${MAX_PAYOUT_AMOUNT.toLocaleString('id-ID')}.`,
      },
      { status: 400 }
    );
  }

  try {
    const result = await executeGatewayPayout({
      gateway: gatewayRaw,
      bankCode: bankCodeRaw,
      accountNumber: accountNumberRaw,
      accountHolder: accountHolderRaw,
      amount: amountNum,
      note: noteRaw,
    });

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Gagal memproses instruksi pencairan dana ke gateway. Silakan coba lagi.' },
      { status: 502 }
    );
  }
}
