import { NextResponse } from 'next/server';
import { issueZkProof } from '@/lib/kycHelper';
import { requireWallet } from '@/lib/middleware/auth';

export async function POST(request: Request) {
  const walletAddress = requireWallet(request);
  if (walletAddress instanceof NextResponse) return walletAddress;

  try {
    const { pan, dob } = await request.json();
    if (!pan || !dob) {
      return NextResponse.json({ error: 'Missing required fields: pan, dob' }, { status: 400 });
    }
    return await issueZkProof(walletAddress, pan, dob, 'MANUAL_ENTRY');
  } catch (error) {
    console.error('Error processing KYC:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
