import { NextResponse } from 'next/server';
import { issueZkProof } from '@/lib/kycHelper';
import { requireWallet } from '@/lib/middleware/auth';

export async function POST(request: Request) {
  const walletAddress = requireWallet(request);
  if (walletAddress instanceof NextResponse) return walletAddress;

  try {
    const { dl_token } = await request.json();
    if (!dl_token) {
      return NextResponse.json({ error: 'DigiLocker token missing' }, { status: 400 });
    }
    
    // Mocked DigiLocker extraction for Demo
    const mockedDigiLockerData = {
      pan: "ABCDE1234F",
      dob: "1990-01-01"
    };
    
    return await issueZkProof(walletAddress, mockedDigiLockerData.pan, mockedDigiLockerData.dob, 'DIGILOCKER');
  } catch (error) {
    console.error('Error processing DigiLocker documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
