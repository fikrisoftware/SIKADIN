import { NextRequest, NextResponse } from 'next/server';
import {
  verifyDokuWebhookSignature,
  verifyMidtransWebhookSignature,
  verifyXenditWebhookToken,
} from '@/lib/payment-server';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ gateway: string }> }
) {
  const { gateway } = await context.params;
  const slug = (gateway || '').trim().toLowerCase();

  if (slug !== 'midtrans' && slug !== 'doku' && slug !== 'xendit') {
    return NextResponse.json({ error: 'Gateway webhook tidak dikenali.' }, { status: 404 });
  }

  const rawBody = await req.text();
  if (!rawBody || rawBody.length > 262_144) {
    return NextResponse.json({ error: 'Payload webhook tidak valid.' }, { status: 400 });
  }

  let parsedBody: Record<string, unknown>;
  try {
    parsedBody = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Body webhook harus berformat JSON valid.' }, { status: 400 });
  }

  if (slug === 'midtrans') {
    const check = verifyMidtransWebhookSignature({
      order_id: typeof parsedBody.order_id === 'string' ? parsedBody.order_id : undefined,
      status_code: typeof parsedBody.status_code === 'string' ? parsedBody.status_code : undefined,
      gross_amount:
        typeof parsedBody.gross_amount === 'string' ? parsedBody.gross_amount : undefined,
      signature_key:
        typeof parsedBody.signature_key === 'string' ? parsedBody.signature_key : undefined,
    });

    if (!check.configured) {
      return NextResponse.json(
        { error: 'Kunci webhook Midtrans belum dikonfigurasi di server.' },
        { status: 503 }
      );
    }
    if (!check.ok) {
      return NextResponse.json({ error: 'Tanda tangan SHA-512 Midtrans tidak valid.' }, { status: 401 });
    }

    return NextResponse.json(
      {
        received: true,
        verified: true,
        gateway: 'Midtrans',
        orderId: parsedBody.order_id,
        transactionStatus: parsedBody.transaction_status || 'unknown',
      },
      { status: 200 }
    );
  }

  if (slug === 'doku') {
    const requestTarget = new URL(req.url).pathname;
    const check = verifyDokuWebhookSignature({
      clientId: req.headers.get('client-id') || '',
      requestId: req.headers.get('request-id') || '',
      requestTimestamp: req.headers.get('request-timestamp') || '',
      requestTarget,
      rawBody,
      signatureHeader: req.headers.get('signature') || '',
    });

    if (!check.configured) {
      return NextResponse.json(
        { error: 'Kunci webhook DOKU belum dikonfigurasi di server.' },
        { status: 503 }
      );
    }
    if (!check.ok) {
      return NextResponse.json(
        { error: 'Tanda tangan HMAC-SHA256 DOKU tidak valid.' },
        { status: 401 }
      );
    }

    const orderObj = parsedBody.order as { invoice_number?: string } | undefined;
    const txObj = parsedBody.transaction as { status?: string } | undefined;
    return NextResponse.json(
      {
        received: true,
        verified: true,
        gateway: 'DOKU',
        orderId: orderObj?.invoice_number || null,
        transactionStatus: txObj?.status || 'unknown',
      },
      { status: 200 }
    );
  }

  // Xendit callback token verification
  const callbackToken = req.headers.get('x-callback-token') || '';
  const check = verifyXenditWebhookToken(callbackToken);

  if (!check.configured) {
    return NextResponse.json(
      { error: 'Token webhook Xendit belum dikonfigurasi di server.' },
      { status: 503 }
    );
  }
  if (!check.ok) {
    return NextResponse.json({ error: 'Callback token Xendit tidak valid.' }, { status: 401 });
  }

  return NextResponse.json(
    {
      received: true,
      verified: true,
      gateway: 'Xendit',
      orderId: parsedBody.external_id || parsedBody.id || null,
      transactionStatus: parsedBody.status || 'unknown',
    },
    { status: 200 }
  );
}
