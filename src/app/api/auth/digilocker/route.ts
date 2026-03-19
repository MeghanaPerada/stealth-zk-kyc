import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('walletAddress');

  if (!walletAddress) {
    return NextResponse.json({ error: 'walletAddress is required for DigiLocker auth' }, { status: 400 });
  }

  // Pass walletAddress as 'state' parameter to keep track of the session
  // In Next.js, we can use absolute or relative URLs for the frontend
  const mockDigilockerUrl = `/api/auth/callback?state=${walletAddress}&code=mock_auth_code_123`;
  
  return NextResponse.json({
    message: 'Redirect to DigiLocker',
    url: mockDigilockerUrl
  });
}
