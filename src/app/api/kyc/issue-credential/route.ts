import { NextResponse } from 'next/server';
import { issueZkProof } from '@/lib/kycHelper';
import { getWalletAddress } from '@/lib/middleware/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const walletAddress = getWalletAddress(request) || body.walletAddress;

    if (!walletAddress) {
       return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 });
    }
    
    // Mock data for the Oracle flow
    const pan = "ABCDE1234F";
    const dob = "1990-01-01";
    
    return await issueZkProof(walletAddress, pan, dob, 'ORACLE');
  } catch (error) {
    console.error('Error issuing credential:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
