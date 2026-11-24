import { NextRequest, NextResponse } from 'next/server';
import { getServerGatewayStatus, verifyFirebaseBearerToken } from '@/lib/payment-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const caller = await verifyFirebaseBearerToken(req);
  if (!caller || !caller.emailVerified) {
    return NextResponse.json(
      { error: 'Autentikasi tidak valid. Silakan masuk kembali.' },
      { status: 401 }
    );
  }

  const status = getServerGatewayStatus();
  return NextResponse.json(status, { status: 200 });
}
