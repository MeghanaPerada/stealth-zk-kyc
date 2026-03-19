import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('state');
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Authorization code missing' }, { status: 400 });
  }

  return NextResponse.json({
    message: 'DigiLocker Authentication Successful',
    walletAddress,
    mockAccessToken: 'dl_token_xyz_987',
    sourceType: 'DIGILOCKER'
  });
}
